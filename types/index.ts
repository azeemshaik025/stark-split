// ============================================
// CORE DOMAIN TYPES — StarkSplit
// ============================================

export interface User {
  id: string;
  wallet_address: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  created_by: string;
  invite_code: string;
  type: 'split' | 'pool'; // Discriminator: splits use custom token, pools use STRK
  total_staked: number;
  total_yield_earned: number;
  pool_liquid?: number; // STRK in pool available for settlements
  created_at: string;
  // Joined relations
  members?: GroupMember[];
  member_count?: number;
  your_balance?: number; // positive = owed to you, negative = you owe
  creator_wallet?: string; // Pool custodian address
}

export interface PoolContribution {
  id: string;
  group_id: string;
  user_id: string;
  amount: number;
  tx_hash: string | null;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
  user?: User;
}

export interface Expense {
  id: string;
  group_id: string;
  paid_by: string;
  description: string;
  amount: number;
  currency: string;
  split_type: "equal" | "exact" | "percentage";
  split_details: Record<string, number> | null;
  created_at: string;
  // Joined
  paid_by_user?: User;
}

export interface Settlement {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  tx_hash: string | null;
  status: "pending" | "confirmed" | "failed";
  created_at: string;
  // Joined
  from_user_data?: User;
  to_user_data?: User;
}

export interface StakingPosition {
  id: string;
  group_id: string;
  user_id: string;
  validator_address: string;
  amount_staked: number;
  rewards_earned: number;
  status: "active" | "exit_pending" | "exited";
  exit_intent_at: string | null;
  entered_at: string;
  updated_at: string;
  user?: User;
}

export interface Debt {
  from: string; // user_id
  to: string;   // user_id
  amount: number;
  // enriched
  from_user?: User;
  to_user?: User;
}

export interface NewExpense {
  description: string;
  amount: number;
  paid_by: string;
  split_type: "equal" | "exact" | "percentage";
  split_details?: Record<string, number>;
}

export interface WalletBalances {
  strk: string;
  customToken: string;
}

// Wallet interface (from starkzap)
export interface WalletInstance {
  address: string;
  balanceOf: (token: unknown) => Promise<{ toFormatted: () => string }>;
  transfer: (token: unknown, recipients: unknown[]) => Promise<TxResult>;
  execute: (calls: unknown[], options?: { feeMode?: string }) => Promise<TxResult>;
  tx: () => TxBuilder;
}

export interface TxResult {
  wait: () => Promise<void>;
  watch: (
    cb: (status: { finality: string; execution: string }) => void,
    options?: { pollIntervalMs?: number; timeoutMs?: number }
  ) => () => void;
}

export interface TxBuilder {
  transfer: (token: unknown, recipients: unknown[]) => TxBuilder;
  send: (options?: { feeMode?: string }) => Promise<TxResult>;
}

// UI State
export type TabType = "expenses" | "balances";
export type TxStatus = "idle" | "pending" | "confirmed" | "failed";
