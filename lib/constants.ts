// Contract addresses
export const STAKING_CONTRACT_ADDRESS =
  "0x00ca1702e64c81d9a07b86bd2c540188d92a2c73cf5cc0e508d949015e7e84a7";

// Token addresses
export const STRK_TOKEN_ADDRESS =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

// Custom token for splits (Bitcoin-on-Starknet)
// Sepolia: User's custom WBTC ERC20 token
// Mainnet: Official Starknet WBTC bridge (0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac)
export const CUSTOM_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_CUSTOM_TOKEN_ADDRESS ||
  "0x496bef3ed20371382fbe0ca6a5a64252c5c848f9f1f0cccf8110fc4def912d5"; // Sepolia default

export const CUSTOM_TOKEN_DECIMALS =
  parseInt(process.env.NEXT_PUBLIC_CUSTOM_TOKEN_DECIMALS ?? "8", 10);

export const CUSTOM_TOKEN_SYMBOL =
  process.env.NEXT_PUBLIC_CUSTOM_TOKEN_SYMBOL ?? "WBTC";

/** Min/max amount for custom token (WBTC) when splitting — for demo */
export const MIN_CUSTOM_TOKEN_AMOUNT = 0.0001;
export const MAX_CUSTOM_TOKEN_AMOUNT = 1;

/** Max decimal places for custom token input (supports 0.0001) */
export const CUSTOM_TOKEN_DECIMAL_PLACES = 4;

/** Currency for a group based on type: split = custom token, pool = STRK */
export function getGroupCurrency(groupType?: string): string {
  return groupType === "pool" ? "STRK" : CUSTOM_TOKEN_SYMBOL;
}

// Starknet network
export const NETWORK =
  (process.env.NEXT_PUBLIC_STARKNET_NETWORK as "sepolia" | "mainnet") ??
  "sepolia";

/** Custom RPC URL (e.g. Alchemy, Infura). Overrides default Cartridge RPC when set. */
export const STARKNET_RPC_URL =
  process.env.NEXT_PUBLIC_STARKNET_RPC_URL?.trim() || undefined;

// App URL
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// APR estimate for STRK delegation (Starknet staking)
// Source: https://starknet.io/staking, https://stakingrewards.com/asset/starknet
// Override via NEXT_PUBLIC_ESTIMATED_APR env var
export const ESTIMATED_APR =
  parseFloat(process.env.NEXT_PUBLIC_ESTIMATED_APR ?? "7.25") || 7.25;

// Gradient presets for member avatars
export const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #6C5CE7, #a78bfa)",
  "linear-gradient(135deg, #00D2FF, #0EA5E9)",
  "linear-gradient(135deg, #00E676, #10B981)",
  "linear-gradient(135deg, #FFB800, #F59E0B)",
  "linear-gradient(135deg, #FF4757, #EF4444)",
  "linear-gradient(135deg, #FF6B9D, #EC4899)",
  "linear-gradient(135deg, #A855F7, #6C5CE7)",
  "linear-gradient(135deg, #06B6D4, #00D2FF)",
];

// Expense category emojis
export const CATEGORY_EMOJIS: Record<string, string> = {
  food: "🍕",
  restaurant: "🍽️",
  coffee: "☕",
  drink: "🍺",
  groceries: "🛒",
  rent: "🏠",
  utilities: "💡",
  transport: "🚗",
  travel: "✈️",
  hotel: "🏨",
  entertainment: "🎬",
  gaming: "🎮",
  sports: "⚽",
  shopping: "🛍️",
  health: "💊",
  other: "💸",
};

export function guessCategory(description: string): string {
  const lower = description.toLowerCase();
  if (/coffee|cafe|starbucks|latte/.test(lower)) return "☕";
  if (/pizza|food|dinner|lunch|breakfast|restaurant|eat|burger|sushi/.test(lower)) return "🍕";
  if (/beer|bar|drink|pub|cocktail/.test(lower)) return "🍺";
  if (/grocery|supermarket|market|costco|trader/.test(lower)) return "🛒";
  if (/rent|apartment|house|housing/.test(lower)) return "🏠";
  if (/electric|internet|water|gas|bill|utility/.test(lower)) return "💡";
  if (/uber|lyft|taxi|gas|fuel|parking|car/.test(lower)) return "🚗";
  if (/flight|hotel|airbnb|travel|trip|vacation/.test(lower)) return "✈️";
  if (/movie|netflix|cinema|show|concert|ticket/.test(lower)) return "🎬";
  if (/game|steam|playstation|xbox|nintendo/.test(lower)) return "🎮";
  if (/doctor|pharmacy|medicine|health|gym/.test(lower)) return "💊";
  if (/amazon|shopping|clothes|mall/.test(lower)) return "🛍️";
  return "💸";
}
