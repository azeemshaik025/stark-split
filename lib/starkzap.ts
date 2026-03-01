"use client";

import { NETWORK, STRK_TOKEN_ADDRESS, CUSTOM_TOKEN_ADDRESS, CUSTOM_TOKEN_DECIMALS, CUSTOM_TOKEN_SYMBOL, STARKNET_RPC_URL } from "./constants";

// Singleton SDK instance (client-only)
let sdkInstance: import("starkzap").StarkZap | null = null;

async function getSDK(): Promise<import("starkzap").StarkZap> {
  if (sdkInstance) return sdkInstance;
  const { StarkZap } = await import("starkzap");
  sdkInstance = new StarkZap({
    network: NETWORK,
    ...(STARKNET_RPC_URL && { rpcUrl: STARKNET_RPC_URL }),
  });
  return sdkInstance;
}

/** Default validator for staking (Sepolia: Nethermind, Mainnet: first available) */
const DEFAULT_VALIDATOR_STAKER =
  NETWORK === "sepolia"
    ? "0x05c85dd30df86ed1f2cfe1806417efb2cae421bffdee8110a74a3d3eb95b28d3" // Nethermind on Sepolia
    : "0x05c85dd30df86ed1f2cfe1806417efb2cae421bffdee8110a74a3d3eb95b28d3"; // Nethermind on mainnet

/** Cached STRK pool contract address (enter_delegation_pool lives on the pool, not staking contract) */
let cachedPoolAddress: import("starkzap").Address | null = null;

async function getDefaultPoolAddress(): Promise<import("starkzap").Address> {
  if (cachedPoolAddress) return cachedPoolAddress;
  const { fromAddress } = await import("starkzap");
  const sdk = await getSDK();
  const pools = await sdk.getStakerPools(fromAddress(DEFAULT_VALIDATOR_STAKER));
  const strkPool = pools.find((p) => p.token.symbol === "STRK");
  if (!strkPool) throw new Error("STRK staking pool not found for default validator");
  cachedPoolAddress = strkPool.poolContract;
  return cachedPoolAddress;
}

/** Live rewards + commission from chain. Use for current user's position. */
export async function getLivePoolPosition(
  wallet: import("starkzap").WalletInterface
): Promise<{ rewards: string; staked: string; commissionPercent: number } | null> {
  try {
    const poolAddress = await getDefaultPoolAddress();
    const position = await wallet.getPoolPosition(poolAddress);
    if (!position) return null;
    return {
      rewards: position.rewards.toFormatted(),
      staked: position.staked.toFormatted(),
      commissionPercent: position.commissionPercent,
    };
  } catch {
    return null;
  }
}

/** True when sponsored tx failed — fall back to user_pays */
function isGaslessFallbackError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("gasless") ||
    lower.includes("sponsored") ||
    lower.includes("paymaster") ||
    lower.includes("not in policies") ||
    lower.includes("snip-9") ||
    lower.includes("not compatible") ||
    lower.includes("doesn't support") ||
    lower.includes("does not support") ||
    lower.includes("strk") ||
    lower.includes("eth") ||
    lower.includes("failed to fetch price") ||
    lower.includes("insufficient liquidity")
  );
}

/** Errors that often resolve on retry (Cartridge/SDK transient issues) */
function isRetryableConnectError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("contractnotfound") ||
    lower.includes("storage operation failed") ||
    lower.includes("provider error") ||
    lower.includes("provider errror") || // typo in some SDK versions
    lower.includes("session if revoked") ||
    lower.includes("session") && lower.includes("revoked") ||
    lower.includes("ekubo") ||
    lower.includes("insufficient liquidity") ||
    lower.includes("404") ||
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("user interaction required") ||
    lower.includes("failed to initialize") ||
    lower.includes("please try again")
  );
}

export async function connectWallet() {
  const sdk = await getSDK();
  // Pool contract (not staking contract) has enter_delegation_pool, add_to_delegation_pool, etc.
  const poolAddress = await getDefaultPoolAddress();
  const onboard = () =>
    sdk.onboard({
      strategy: "cartridge",
      cartridge: {
        policies: [
          // Splits (custom token)
          { target: CUSTOM_TOKEN_ADDRESS, method: "transfer" },
          { target: CUSTOM_TOKEN_ADDRESS, method: "approve" },
          // Pools (STRK staking)
          { target: STRK_TOKEN_ADDRESS, method: "transfer" },
          { target: STRK_TOKEN_ADDRESS, method: "approve" },
          // Staking pool operations (pool contract, not staking contract)
          { target: poolAddress, method: "enter_delegation_pool" },
          { target: poolAddress, method: "add_to_delegation_pool" },
          { target: poolAddress, method: "exit_delegation_pool_intent" },
          { target: poolAddress, method: "exit_delegation_pool_action" },
          { target: poolAddress, method: "claim_rewards" },
        ],
      },
      deploy: "if_needed",
    });

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { wallet } = await onboard();
      return wallet;
    } catch (err) {
      lastErr = err;
      if (attempt < 2 && isRetryableConnectError(err)) {
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function sanitizeBalance(raw: string): string {
  const num = parseFloat(raw);
  if (isNaN(num) || !isFinite(num) || num < 0) return "0";
  return raw;
}

export async function getWalletBalance(wallet: import("starkzap").WalletInterface) {
  const { sepoliaTokens, mainnetTokens, fromAddress } = await import("starkzap");
  const tokens = NETWORK === "sepolia" ? sepoliaTokens : mainnetTokens;

  // Custom token for splits (Bitcoin-on-Starknet)
  const customToken = {
    address: fromAddress(CUSTOM_TOKEN_ADDRESS),
    name: CUSTOM_TOKEN_SYMBOL,
    decimals: CUSTOM_TOKEN_DECIMALS,
    symbol: CUSTOM_TOKEN_SYMBOL,
  };

  const [strkResult, customTokenResult] = await Promise.allSettled([
    wallet.balanceOf(tokens.STRK),
    wallet.balanceOf(customToken),
  ]);

  return {
    strk:
      strkResult.status === "fulfilled"
        ? sanitizeBalance(strkResult.value.toFormatted())
        : "0",
    customToken:
      customTokenResult.status === "fulfilled"
        ? sanitizeBalance(customTokenResult.value.toFormatted())
        : "0",
  };
}

export async function transferSTRK(
  wallet: import("starkzap").WalletInterface,
  recipientAddress: string,
  amount: string
): Promise<string> {
  const { sepoliaTokens, mainnetTokens, fromAddress, Amount } =
    await import("starkzap");
  const { normalizeStarknetAddress } = await import("./utils");

  const tokens = NETWORK === "sepolia" ? sepoliaTokens : mainnetTokens;
  const normalizedAddr = normalizeStarknetAddress(recipientAddress);

  if (!normalizedAddr || normalizedAddr.length < 10) {
    throw new Error(`Invalid recipient address: recipient may not have a wallet connected`);
  }

  try {
    const tx = await wallet.transfer(
      tokens.STRK,
      [
        {
          to: fromAddress(normalizedAddr),
          amount: Amount.parse(amount, tokens.STRK),
        },
      ],
      { feeMode: "sponsored" }
    );
    await tx.wait();
    return tx.hash;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("SNIP-9") || msg.includes("not compatible")) {
      // Fallback: try user-pays if sponsored fails (account not SNIP-9 compatible)
      const tx = await wallet.transfer(
        tokens.STRK,
        [
          {
            to: fromAddress(normalizedAddr),
            amount: Amount.parse(amount, tokens.STRK),
          },
        ],
        { feeMode: "user_pays" }
      );
      await tx.wait();
      return tx.hash;
    }
    throw err;
  }
}

/**
 * Transfer custom token (for splits/settlements)
 * Uses custom token defined in constants (CUSTOM_TOKEN_ADDRESS, CUSTOM_TOKEN_DECIMALS)
 * Attempts gasless transfer; falls back to user_pays if not sponsored (Sepolia testnet limitation)
 */
export async function transferCustomToken(
  wallet: import("starkzap").WalletInterface,
  recipientAddress: string,
  amount: string
): Promise<{ txHash: string; gasless: boolean }> {
  const { fromAddress, Amount } = await import("starkzap");
  const { normalizeStarknetAddress } = await import("./utils");

  const normalizedAddr = normalizeStarknetAddress(recipientAddress);

  if (!normalizedAddr || normalizedAddr.length < 10) {
    throw new Error(`Invalid recipient address: recipient may not have a wallet connected`);
  }

  const customToken = {
    address: fromAddress(CUSTOM_TOKEN_ADDRESS),
    name: CUSTOM_TOKEN_SYMBOL,
    decimals: CUSTOM_TOKEN_DECIMALS,
    symbol: CUSTOM_TOKEN_SYMBOL,
  };

  try {
    // Attempt gasless transfer (sponsored)
    const tx = await wallet.transfer(
      customToken,
      [
        {
          to: fromAddress(normalizedAddr),
          amount: Amount.parse(amount, customToken),
        },
      ],
      { feeMode: "sponsored" }
    );
    await tx.wait();
    return { txHash: tx.hash, gasless: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    // If sponsored fails (testnet paymaster limitation), fallback to user-pays
    if (
      msg.includes("sponsored") ||
      msg.includes("not in policies") ||
      msg.includes("paymaster") ||
      msg.includes("SNIP-9") ||
      msg.includes("not compatible")
    ) {
      console.warn(
        `Gas sponsorship unavailable for ${CUSTOM_TOKEN_SYMBOL} on ${NETWORK}. User will pay gas.`
      );

      try {
        const tx = await wallet.transfer(
          customToken,
          [
            {
              to: fromAddress(normalizedAddr),
              amount: Amount.parse(amount, customToken),
            },
          ],
          { feeMode: "user_pays" }
        );
        await tx.wait();
        return { txHash: tx.hash, gasless: false };
      } catch (userPaysErr) {
        throw userPaysErr;
      }
    }

    throw err;
  }
}

export async function stakeGroupFunds(
  wallet: import("starkzap").WalletInterface,
  amount: string
) {
  const { sepoliaTokens, mainnetTokens, Amount } = await import("starkzap");
  const tokens = NETWORK === "sepolia" ? sepoliaTokens : mainnetTokens;
  const poolAddress = await getDefaultPoolAddress();

  // Sepolia: use user_pays first — Cartridge session creation fails when fetching price for custom token (Ekubo 404)
  const feeMode: "sponsored" | "user_pays" =
    NETWORK === "sepolia" ? "user_pays" : "sponsored";

  try {
    const tx = await wallet.stake(poolAddress, Amount.parse(amount, tokens.STRK), {
      feeMode,
    });
    await tx.wait();
    return tx.hash;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (feeMode === "sponsored" && isGaslessFallbackError(msg)) {
      const tx = await wallet.stake(poolAddress, Amount.parse(amount, tokens.STRK), {
        feeMode: "user_pays",
      });
      await tx.wait();
      return tx.hash;
    }
    throw err;
  }
}

export async function claimStakingRewards(
  wallet: import("starkzap").WalletInterface
) {
  const poolAddress = await getDefaultPoolAddress();

  // Sepolia: use user_pays first — Cartridge session creation fails when fetching price for custom token (Ekubo 404)
  const feeMode: "sponsored" | "user_pays" =
    NETWORK === "sepolia" ? "user_pays" : "sponsored";

  try {
    const tx = await wallet.claimPoolRewards(poolAddress, { feeMode });
    await tx.wait();
    return tx;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (feeMode === "sponsored" && isGaslessFallbackError(msg)) {
      const tx = await wallet.claimPoolRewards(poolAddress, { feeMode: "user_pays" });
      await tx.wait();
      return tx;
    }
    throw err;
  }
}

/** Initiate unstake (21-day cooldown starts). Use exitStakingAction after cooldown to complete. */
export async function exitStakingIntent(
  wallet: import("starkzap").WalletInterface,
  amount: string
) {
  const { sepoliaTokens, mainnetTokens, Amount } = await import("starkzap");
  const tokens = NETWORK === "sepolia" ? sepoliaTokens : mainnetTokens;
  const poolAddress = await getDefaultPoolAddress();

  // Sepolia: use user_pays first — Cartridge session creation fails when fetching price for custom token (Ekubo 404)
  const feeMode: "sponsored" | "user_pays" =
    NETWORK === "sepolia" ? "user_pays" : "sponsored";

  try {
    const tx = await wallet.exitPoolIntent(
      poolAddress,
      Amount.parse(amount, tokens.STRK),
      { feeMode }
    );
    await tx.wait();
    return tx.hash;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (feeMode === "sponsored" && isGaslessFallbackError(msg)) {
      const tx = await wallet.exitPoolIntent(
        poolAddress,
        Amount.parse(amount, tokens.STRK),
        { feeMode: "user_pays" }
      );
      await tx.wait();
      return tx.hash;
    }
    throw err;
  }
}

/** Complete unstake after 21-day cooldown. Requires wallet address as pool_member. */
export async function exitStakingAction(
  wallet: import("starkzap").WalletInterface
) {
  const poolAddress = await getDefaultPoolAddress();

  // Sepolia: use user_pays first — Cartridge session creation fails when fetching price for custom token (Ekubo 404)
  const feeMode: "sponsored" | "user_pays" =
    NETWORK === "sepolia" ? "user_pays" : "sponsored";

  try {
    const tx = await wallet.exitPool(poolAddress, { feeMode });
    await tx.wait();
    return tx.hash;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (feeMode === "sponsored" && isGaslessFallbackError(msg)) {
      const tx = await wallet.exitPool(poolAddress, { feeMode: "user_pays" });
      await tx.wait();
      return tx.hash;
    }
    throw err;
  }
}
