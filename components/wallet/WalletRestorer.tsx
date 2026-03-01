"use client";

/**
 * Placeholder for wallet restoration.
 * We do NOT auto-call connectWallet() here — Cartridge requires a user gesture
 * (click) to open its popup. Auto-calling from useEffect triggers
 * "User interaction required". Instead, ConnectButton shows "Restore session"
 * when walletAddress exists but wallet is null, and the user must click to restore.
 */
export default function WalletRestorer() {
  return null;
}
