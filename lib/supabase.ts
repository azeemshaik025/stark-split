import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// USER QUERIES
// ============================================

/**
 * Ensure user exists. When connecting wallet, only set wallet_address so we
 * don't overwrite display_name. Pass displayName only when explicitly updating.
 */
export async function upsertUser(
  walletAddress: string,
  displayName?: string
) {
  const row: { wallet_address: string; display_name?: string | null } = {
    wallet_address: walletAddress.toLowerCase(),
  };
  if (displayName !== undefined) {
    row.display_name = displayName ?? null;
  }

  const { data, error } = await supabase
    .from("users")
    .upsert(row, { onConflict: "wallet_address" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserByWallet(walletAddress: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: { display_name?: string; avatar_url?: string }
) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// GROUP QUERIES
// ============================================

export async function getUserGroups(userId: string) {
  const { data, error } = await supabase
    .from("group_members")
    .select(`
      group_id,
      groups (
        id, name, emoji, invite_code, type, total_staked, total_yield_earned, pool_liquid, created_at,
        created_by
      )
    `)
    .eq("user_id", userId);

  if (error) throw error;
  // Filter for 'split' type groups only (dashboard shows splits)
  const groups = data?.map((row: any) => row.groups).filter((g: any) => g && g.type === "split") ?? [];
  return groups;
}

/** Get groups where user is a member and type is 'pool' (for Yield page) */
export async function getUserPoolGroups(userId: string) {
  const { data, error } = await supabase
    .from("group_members")
    .select(`
      group_id,
      groups (
        id, name, emoji, invite_code, type, total_staked, total_yield_earned, pool_liquid, created_at,
        created_by
      )
    `)
    .eq("user_id", userId);

  if (error) throw error;
  const groups = data?.map((row: any) => row.groups).filter((g: any) => g && g.type === "pool") ?? [];
  return groups;
}

export async function getGroupById(groupId: string) {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (error) throw error;
  return data;
}

/** Get group with creator's wallet (pool custodian address) and type */
export async function getGroupWithCreator(groupId: string) {
  const group = await getGroupById(groupId);
  const { data: creator } = await supabase
    .from("users")
    .select("id, wallet_address, display_name")
    .eq("id", group.created_by)
    .single();

  return { ...group, type: group.type, creator, creator_wallet: creator?.wallet_address };
}

export async function getGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from("group_members")
    .select(`
      group_id, user_id, joined_at,
      users (id, wallet_address, display_name, avatar_url)
    `)
    .eq("group_id", groupId);

  if (error) throw error;
  return data ?? [];
}

/** Generate a short unique invite code (8 hex chars) */
function generateInviteCode(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return Math.random().toString(36).slice(2, 10);
}

export async function createGroup(
  name: string,
  emoji: string,
  createdBy: string,
  type: "split" | "pool" = "split"
) {
  const inviteCode = generateInviteCode().toLowerCase();

  const { data, error } = await supabase
    .from("groups")
    .insert({ name, emoji, created_by: createdBy, invite_code: inviteCode, type })
    .select()
    .single();

  if (error) {
    // 23505 = unique violation (invite_code collision) — retry with new code
    if (error.code === "23505") {
      return createGroup(name, emoji, createdBy, type);
    }
    throw error;
  }

  // Auto-add creator as member
  await supabase.from("group_members").insert({
    group_id: data.id,
    user_id: createdBy,
  });

  return data;
}

export async function joinGroupByCode(
  inviteCode: string,
  userId: string,
  groupType?: "split" | "pool"
) {
  // Find group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("invite_code", inviteCode.toLowerCase())
    .single();

  if (groupError) throw new Error("Group not found");

  // When joining from Yield, only allow pool groups
  if (groupType && group.type !== groupType) {
    throw new Error(groupType === "pool" ? "This is a split group. Use the Splits tab to join." : "Invalid group type.");
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", group.id)
    .eq("user_id", userId)
    .single();

  if (existing) return group; // Already a member, return group

  // Add member
  const { error: joinError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: userId });

  if (joinError) throw joinError;
  return group;
}

// ============================================
// EXPENSE QUERIES
// ============================================

export async function getGroupExpenses(groupId: string) {
  const { data, error } = await supabase
    .from("expenses")
    .select(`
      *,
      paid_by_user:users!expenses_paid_by_fkey (id, wallet_address, display_name, avatar_url)
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addExpense(
  groupId: string,
  paidBy: string,
  description: string,
  amount: number,
  splitType: "equal" | "exact" | "percentage" = "equal",
  splitDetails?: Record<string, number>,
  currency: string = "STRK"
) {
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      group_id: groupId,
      paid_by: paidBy,
      description,
      amount,
      currency,
      split_type: splitType,
      split_details: splitDetails ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// SETTLEMENT QUERIES
// ============================================

export async function createSettlement(
  groupId: string,
  fromUser: string,
  toUser: string,
  amount: number,
  txHash?: string,
  fromTreasury?: boolean
) {
  const { data, error } = await supabase
    .from("settlements")
    .insert({
      group_id: groupId,
      from_user: fromUser,
      to_user: toUser,
      amount,
      tx_hash: txHash ?? null,
      status: "pending",
      from_treasury: fromTreasury ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Get confirmed settlements for a group (used to reduce debt in balance calc) */
export async function getGroupSettlements(groupId: string) {
  const { data, error } = await supabase
    .from("settlements")
    .select("from_user, to_user, amount")
    .eq("group_id", groupId)
    .eq("status", "confirmed");

  if (error) throw error;
  return data ?? [];
}

export async function updateSettlementStatus(
  settlementId: string,
  status: "pending" | "confirmed" | "failed",
  txHash?: string
) {
  const updates: Record<string, unknown> = { status };
  if (txHash) updates.tx_hash = txHash;

  const { data, error } = await supabase
    .from("settlements")
    .update(updates)
    .eq("id", settlementId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// POOL / TREASURY QUERIES
// ============================================

export async function addPoolContribution(
  groupId: string,
  userId: string,
  amount: number,
  txHash?: string
) {
  const { data, error } = await supabase
    .from("pool_contributions")
    .insert({
      group_id: groupId,
      user_id: userId,
      amount,
      tx_hash: txHash ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  // Update group pool_liquid
  const { data: group } = await supabase
    .from("groups")
    .select("pool_liquid")
    .eq("id", groupId)
    .single();

  const currentLiquid = Number(group?.pool_liquid ?? 0);
  await supabase
    .from("groups")
    .update({ pool_liquid: currentLiquid + amount })
    .eq("id", groupId);

  return data;
}

export async function getPoolContributions(groupId: string) {
  const { data, error } = await supabase
    .from("pool_contributions")
    .select(`
      *,
      user:users (id, wallet_address, display_name)
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}


// ============================================
// STAKING QUERIES
// ============================================

/** Get all staking positions for a group (one per member who staked) */
export async function getStakingPositionsForGroup(groupId: string) {
  const { data, error } = await supabase
    .from("staking_positions")
    .select(`
      *,
      user:users (id, wallet_address, display_name)
    `)
    .eq("group_id", groupId)
    .in("status", ["active", "exit_pending"])
    .order("amount_staked", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Get current user's staking position in a group */
export async function getStakingPositionForUser(groupId: string, userId: string) {
  const { data, error } = await supabase
    .from("staking_positions")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .in("status", ["active", "exit_pending"])
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** @deprecated Use getStakingPositionsForGroup or getStakingPositionForUser */
export async function getStakingPosition(groupId: string) {
  const positions = await getStakingPositionsForGroup(groupId);
  return positions.length > 0 ? positions[0] : null;
}

export async function upsertStakingPosition(
  groupId: string,
  userId: string,
  validatorAddress: string,
  amountStaked: number
) {
  const { data, error } = await supabase
    .from("staking_positions")
    .upsert(
      {
        group_id: groupId,
        user_id: userId,
        validator_address: validatorAddress,
        amount_staked: amountStaked,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "group_id,user_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStakingRewards(
  positionId: string,
  rewardsEarned: number
) {
  const { data, error } = await supabase
    .from("staking_positions")
    .update({ rewards_earned: rewardsEarned, updated_at: new Date().toISOString() })
    .eq("id", positionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStakingPositionStatus(
  positionId: string,
  status: "active" | "exit_pending" | "exited",
  exitIntentAt?: string
) {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "exit_pending" && exitIntentAt) {
    updates.exit_intent_at = exitIntentAt;
  }
  if (status === "exited") {
    updates.exit_intent_at = null;
  }

  const { data, error } = await supabase
    .from("staking_positions")
    .update(updates)
    .eq("id", positionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// FAUCET RATE LIMITING
// ============================================

const FAUCET_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Check if address can request faucet (not requested in last 24h). Returns true if allowed. */
export async function canRequestFaucet(address: string): Promise<boolean> {
  const normalized = address.toLowerCase().trim();
  const { data, error } = await supabase
    .from("faucet_requests")
    .select("last_requested_at")
    .eq("address", normalized)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return true;

  const last = new Date(data.last_requested_at).getTime();
  return Date.now() - last >= FAUCET_COOLDOWN_MS;
}

/** Record a faucet request. Call after successful transfer. */
export async function recordFaucetRequest(address: string): Promise<void> {
  const normalized = address.toLowerCase().trim();
  const { error } = await supabase.from("faucet_requests").upsert(
    { address: normalized, last_requested_at: new Date().toISOString() },
    { onConflict: "address" }
  );
  if (error) throw error;
}
