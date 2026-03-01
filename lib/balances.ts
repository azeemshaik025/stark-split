"use client";

/**
 * Independent balance fetcher — uses direct RPC calls, no wallet object needed.
 * Just: address + RPC URL → fetch balance → update.
 * Works with any standard Starknet RPC (no versioned URL required).
 */

import { RpcProvider } from "starknet";
import {
  NETWORK,
  STARKNET_RPC_URL,
  STRK_TOKEN_ADDRESS,
  CUSTOM_TOKEN_ADDRESS,
  CUSTOM_TOKEN_DECIMALS,
} from "./constants";

const STRK_DECIMALS = 18;

/** Default public RPC if no custom URL is set */
const DEFAULT_RPC: Record<string, string> = {
  sepolia: "https://starknet-sepolia.public.blastapi.io",
  mainnet: "https://starknet-mainnet.public.blastapi.io",
};

function getRpcUrl(): string {
  return STARKNET_RPC_URL ?? DEFAULT_RPC[NETWORK] ?? DEFAULT_RPC.sepolia;
}

/** Parse ERC20 balanceOf result — u256 is (low, high) or single felt */
function parseBalance(result: string[], decimals: number): string {
  if (!result || result.length === 0) return "0";
  let raw: bigint;
  if (result.length >= 2) {
    const low = BigInt(result[0]);
    const high = BigInt(result[1]);
    raw = low + high * (2n ** 128n);
  } else {
    raw = BigInt(result[0]);
  }
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const frac = raw % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, decimals).replace(/0+$/, "") || "0";
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

export interface WalletBalances {
  strk: string;
  customToken: string;
}

/**
 * Fetch STRK and custom token balances for an address via direct RPC.
 * No wallet instance required — only the address.
 */
export async function fetchBalancesByAddress(
  walletAddress: string
): Promise<WalletBalances> {
  const addr = walletAddress.trim().toLowerCase();
  if (!addr || addr.length < 10) {
    return { strk: "0", customToken: "0" };
  }
  const rpcUrl = getRpcUrl();
  const provider = new RpcProvider({ nodeUrl: rpcUrl });

  const [strkResult, customResult] = await Promise.allSettled([
    provider.callContract({
      contractAddress: STRK_TOKEN_ADDRESS,
      entrypoint: "balance_of",
      calldata: [addr],
    }),
    provider.callContract({
      contractAddress: CUSTOM_TOKEN_ADDRESS,
      entrypoint: "balance_of",
      calldata: [addr],
    }),
  ]);

  return {
    strk:
      strkResult.status === "fulfilled"
        ? parseBalance(strkResult.value, STRK_DECIMALS)
        : "0",
    customToken:
      customResult.status === "fulfilled"
        ? parseBalance(customResult.value, CUSTOM_TOKEN_DECIMALS)
        : "0",
  };
}
