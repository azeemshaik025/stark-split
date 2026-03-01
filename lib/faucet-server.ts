/**
 * Server-only faucet: sends 0.01 WBTC + 5 STRK to recipient using FAUCET_PRIVATE_KEY.
 * Uses starkzap with StarkSigner (no Cartridge — runs on Node.js).
 * Optional FAUCET_PUBLIC_KEY: when set, uses explicit public key for address derivation
 * (required if private key derivation differs from standard Stark curve).
 */

import {
  StarkZap,
  StarkSigner,
  OnboardStrategy,
  BraavosPreset,
  fromAddress,
  Amount,
  sepoliaTokens,
  mainnetTokens,
} from "starkzap";
import type { SignerInterface } from "starkzap";
import {
  NETWORK,
  STARKNET_RPC_URL,
  CUSTOM_TOKEN_ADDRESS,
  CUSTOM_TOKEN_DECIMALS,
  CUSTOM_TOKEN_SYMBOL,
} from "./constants";
import { normalizeStarknetAddress } from "./utils";

const FAUCET_WBTC_AMOUNT = "0.01";
const FAUCET_STRK_AMOUNT = "5";

/** Signer that uses explicit public key for address derivation, private key for signing */
function createFaucetSigner(privateKey: string, publicKey: string): SignerInterface {
  const starkSigner = new StarkSigner(privateKey);
  return {
    async getPubKey() {
      return publicKey.startsWith("0x") ? publicKey : `0x${publicKey}`;
    },
    async signRaw(hash: string) {
      return starkSigner.signRaw(hash);
    },
  };
}

export async function sendFaucetTokens(
  recipientAddress: string
): Promise<{ txHash: string }> {
  const pk = process.env.FAUCET_PRIVATE_KEY;
  const pubKey = process.env.FAUCET_PUBLIC_KEY?.trim();

  if (!pk?.trim()) {
    throw new Error("FAUCET_PRIVATE_KEY is not configured");
  }

  const normalized = normalizeStarknetAddress(recipientAddress);
  if (!normalized || normalized.length < 10) {
    throw new Error("Invalid recipient address");
  }

  const signer = pubKey
    ? createFaucetSigner(pk.trim(), pubKey)
    : new StarkSigner(pk.trim());

  const sdk = new StarkZap({
    network: NETWORK,
    ...(STARKNET_RPC_URL && { rpcUrl: STARKNET_RPC_URL }),
  });

  const { wallet } = await sdk.onboard({
    strategy: OnboardStrategy.Signer,
    account: { signer, accountClass: BraavosPreset },
    feeMode: "user_pays",
    deploy: "if_needed",
  });

  const customToken = {
    address: fromAddress(CUSTOM_TOKEN_ADDRESS),
    name: CUSTOM_TOKEN_SYMBOL,
    decimals: CUSTOM_TOKEN_DECIMALS,
    symbol: CUSTOM_TOKEN_SYMBOL,
  };

  const tokens = NETWORK === "sepolia" ? sepoliaTokens : mainnetTokens;
  const recipient = fromAddress(normalized);

  // Batch both transfers in one tx (0.01 WBTC + 5 STRK)
  const tx = await wallet
    .tx()
    .transfer(customToken, [
      { to: recipient, amount: Amount.parse(FAUCET_WBTC_AMOUNT, customToken) },
    ])
    .transfer(tokens.STRK, [
      { to: recipient, amount: Amount.parse(FAUCET_STRK_AMOUNT, tokens.STRK) },
    ])
    .send({ feeMode: "user_pays" });
  await tx.wait();
  return { txHash: tx.hash };
}
