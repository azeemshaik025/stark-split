import { AVATAR_GRADIENTS } from "./constants";

// Truncate hex address: 0x1234...abcd
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Format STRK amount with commas
export function formatAmount(
  amount: number | string,
  decimals = 4,
  compact = false
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || !isFinite(num)) return "0";

  if (compact && num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }

  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

/** Safely format wallet balance string (handles NaN, undefined, invalid) */
export function formatBalance(value: string | undefined | null): string {
  if (value == null || value === "") return "0";
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(num)) return "0";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

// Format relative date
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// Format date for grouping in expense list
export function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

// Get avatar gradient by index (deterministic per user)
export function getAvatarGradient(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

// Get initials from display name or address
export function getInitials(nameOrAddress: string): string {
  if (!nameOrAddress || !nameOrAddress.trim()) return "?";
  const trimmed = nameOrAddress.trim();
  if (trimmed.startsWith("0x")) {
    return trimmed.slice(2, 4).toUpperCase();
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return trimmed[0].toUpperCase();
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    return true;
  }
}

// Share or copy invite URL
export async function shareInviteLink(
  inviteCode: string,
  groupName: string
): Promise<void> {
  const url = `${window.location.origin}/join/${inviteCode}`;
  const text = `Join my group "${groupName}" on StarkSplit!`;

  if (navigator.share) {
    await navigator.share({ title: "StarkSplit", text, url });
  } else {
    await copyToClipboard(url);
  }
}

// Debounce
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Clamp number
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Format time remaining until a date (e.g. "18 days 4 hours" or "Ready")
const COOLDOWN_DAYS = 21;

export function formatCooldownRemaining(exitIntentAt: string | null): string {
  if (!exitIntentAt) return "";
  const exitDate = new Date(exitIntentAt);
  const cooldownEnd = new Date(exitDate.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  if (now >= cooldownEnd) return "Ready";
  const diffMs = cooldownEnd.getTime() - now.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days} day${days !== 1 ? "s" : ""} ${hours}h`;
  return `${hours} hour${hours !== 1 ? "s" : ""}`;
}

export function isCooldownComplete(exitIntentAt: string | null): boolean {
  if (!exitIntentAt) return false;
  const exitDate = new Date(exitIntentAt);
  const cooldownEnd = new Date(exitDate.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  return new Date() >= cooldownEnd;
}

// Starknet explorer URL for transaction (Voyager)
export function getExplorerTxUrl(txHash: string, network: "sepolia" | "mainnet" = "sepolia"): string {
  const base = network === "sepolia" ? "https://sepolia.voyager.online" : "https://voyager.online";
  return `${base}/tx/${txHash}`;
}

// Normalize Starknet address (ensure 0x prefix, lowercase hex)
export function normalizeStarknetAddress(addr: string): string {
  if (!addr || typeof addr !== "string") return "";
  const trimmed = addr.trim().toLowerCase();
  if (trimmed.startsWith("0x")) return trimmed;
  return `0x${trimmed}`;
}

// Classify error from SDK
export function getSdkErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("not deployed")) return "Wallet not deployed yet. Please try again.";
  if (message.includes("timed out") || message.includes("429"))
    return "Network is busy. Please try again.";
  if (message.includes("signature") || message.includes("Privy"))
    return "Authentication error. Please reconnect your wallet.";
  if (message.includes("Invalid") || message.includes("Amount"))
    return "Invalid amount entered.";
  if (message.includes("popup") || message.includes("Cartridge connection failed"))
    return "Connection failed. Allow popups for this site (click the icon in the address bar) and try again.";
  if (message.includes("rejected") || message.includes("denied") || message.includes("User rejected"))
    return "Transaction cancelled. Please try again.";
  if (message.includes("webauthn") || message.includes("WebAuthn") || message.includes("passkey") || message.includes("Passkey"))
    return "Passkey error. Try Google or Twitter sign-in, or use HTTPS (not HTTP).";
  if (message.includes("evmMetamask") || message.includes("MetaMask"))
    return "This app uses Starknet (Cartridge). Disable MetaMask for this site or use Google/Twitter/Passkey.";
  if (
    message.includes("balance") ||
    message.includes("insufficient") ||
    message.includes("exceeds") ||
    (message.includes("controller") && message.includes("funds"))
  )
    return "Add STRK to your wallet for gas. On Sepolia testnet, get free STRK from a faucet (e.g. starknet.io/ecosystem/faucets).";
  if (message.includes("sponsor") || message.includes("paymaster") || message.includes("gas"))
    return "Gas sponsorship failed. Try again or ensure you're on the allowlisted domain.";
  if (message.includes("recipient") || message.includes("address") || message.includes("0x"))
    return "Invalid recipient address. The recipient may need to connect their wallet first.";
  if (message.includes("SNIP-9") || message.includes("not compatible"))
    return "Your account doesn't support gasless transactions. Try reconnecting with Cartridge, or ensure you have STRK/ETH for gas.";
  if (message.includes("Failed to fetch price") || message.includes("Insufficient liquidity"))
    return "Price fetch failed for a token. Retrying with gas payment — ensure you have STRK for fees.";
  if (message.includes("ContractNotFound") || message.includes("session if revoked") || message.includes("Storage operation failed"))
    return "Cartridge session issue. Refresh the page and try connecting again.";
  if (message.includes("404") || message.includes("ekubo"))
    return "Temporary network issue. Please try again.";
  if (message.includes("already in process to exit pool"))
    return "Exit already initiated. Complete withdrawal after 21-day cooldown.";
  if (message.includes("cooldown") && message.toLowerCase().includes("not"))
    return "21-day cooldown not complete yet. Please wait.";
  if (message.includes("reverted") || message.includes("revert"))
    return "Transaction reverted. Check you have STRK for gas and try again.";
  if (message.includes("timed out") || message.includes("timeout"))
    return "Transaction timed out. Check Starknet explorer for status.";
  return "Something went wrong. Please try again.";
}
