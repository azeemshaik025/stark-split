"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  Group,
  Expense,
  Debt,
  NewExpense,
  WalletBalances,
} from "@/types";
import {
  upsertUser,
  getUserByWallet,
  getUserGroups,
  getUserPoolGroups,
  getGroupById,
  getGroupWithCreator,
  createGroup as dbCreateGroup,
  joinGroupByCode,
  getGroupExpenses,
  getGroupSettlements,
  addExpense as dbAddExpense,
  createSettlement,
  updateSettlementStatus,
  getGroupMembers,
} from "@/lib/supabase";
import { getGroupCurrency } from "@/lib/constants";
import { connectWallet as sdkConnectWallet, transferCustomToken } from "@/lib/starkzap";
import { fetchBalancesByAddress } from "@/lib/balances";
import { calculateDebts } from "@/lib/splitwise";
import { getSdkErrorMessage } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface AppState {
  // Auth
  wallet: import("starkzap").WalletInterface | null;
  walletAddress: string | null;
  user: User | null;
  isConnecting: boolean;
  connectionError: string | null;

  // Groups (split groups for dashboard)
  groups: Group[];
  // Pool groups (for Yield page — separate from splits)
  poolGroups: Group[];
  activeGroup: Group | null;
  groupExpenses: Record<string, Expense[]>;
  groupMembers: Record<string, User[]>;
  groupDebts: Record<string, Debt[]>;

  // Balances
  walletBalances: WalletBalances;

  // UI State
  isLoadingGroups: boolean;
  isLoadingExpenses: boolean;

  // Actions — Auth
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;

  // Actions — Groups
  fetchGroups: () => Promise<void>;
  fetchGroupDebtsForAllGroups: () => Promise<void>;
  fetchPoolGroups: () => Promise<void>;
  fetchGroupDetails: (groupId: string) => Promise<void>;
  createGroup: (name: string, emoji: string) => Promise<Group | null>;
  createPoolGroup: (name: string, emoji: string) => Promise<Group | null>;
  joinGroup: (inviteCode: string) => Promise<Group | null>;
  joinPoolGroup: (inviteCode: string) => Promise<Group | null>;

  // Actions — Expenses
  fetchExpenses: (groupId: string) => Promise<void>;
  addExpense: (groupId: string, expense: NewExpense) => Promise<void>;

  // Actions — Settlement (splits only, direct user-to-user)
  settleDebt: (
    groupId: string,
    debt: Debt,
    toAddress: string
  ) => Promise<{ settlementId: string; txHash: string }>;

  // Actions — Balances
  refreshBalances: () => Promise<void>;

  // Actions — User
  refreshUser: () => Promise<void>;
  setUserDisplayName: (displayName: string | null) => void;

  // Helpers
  getDebtsForGroup: (groupId: string) => Debt[];
  getUserBalance: (groupId: string) => number;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      wallet: null,
      walletAddress: null,
      user: null,
      isConnecting: false,
      connectionError: null,
      groups: [],
      poolGroups: [],
      activeGroup: null,
      groupExpenses: {},
      groupMembers: {},
      groupDebts: {},
      walletBalances: { strk: "0", customToken: "0" },
      isLoadingGroups: false,
      isLoadingExpenses: false,

      // ==========================================
      // AUTH
      // ==========================================
      connectWallet: async () => {
        set({ isConnecting: true, connectionError: null });
        try {
          const wallet = await sdkConnectWallet();
          const address = wallet.address;

          // Upsert user in Supabase BEFORE updating UI state — required for groups/expenses (created_by FK)
          const user = await upsertUser(address);

          // Get balance via independent RPC fetcher (no wallet object needed)
          const balances = await fetchBalancesByAddress(address).catch(() => ({
            strk: "0",
            customToken: "0",
          }));

          // Only update state after all critical operations succeed
          set({ wallet, walletAddress: address, user, walletBalances: balances, isConnecting: false });

          // Fetch groups
          await get().fetchGroups();
        } catch (err) {
          // Clean up any partial state so UI doesn't show a broken connected state
          set({
            wallet: null,
            walletAddress: null,
            user: null,
            isConnecting: false,
            connectionError: getSdkErrorMessage(err),
          });
          throw err;
        }
      },

      disconnectWallet: () => {
        set({
          wallet: null,
          walletAddress: null,
          user: null,
          groups: [],
          poolGroups: [],
          activeGroup: null,
          groupExpenses: {},
          groupMembers: {},
          groupDebts: {},
          walletBalances: { strk: "0", customToken: "0" },
        });
      },

      // ==========================================
      // GROUPS
      // ==========================================
      fetchGroups: async () => {
        const { user } = get();
        if (!user) return;

        set({ isLoadingGroups: true });
        try {
          const groups = await getUserGroups(user.id);
          set({ groups: groups.flat() as unknown as Group[], isLoadingGroups: false });
          await get().fetchGroupDebtsForAllGroups();
        } catch {
          set({ isLoadingGroups: false });
        }
      },

      fetchGroupDebtsForAllGroups: async () => {
        const { groups, user } = get();
        if (!groups.length || !user) return;

        try {
          const results = await Promise.all(
            groups.map(async (group) => {
              const [members, expenses, settlements] = await Promise.all([
                getGroupMembers(group.id),
                getGroupExpenses(group.id),
                getGroupSettlements(group.id),
              ]);

              const memberUsers = members.map((m) => m.users).filter(Boolean) as unknown as User[];
              const memberIds = memberUsers.map((m) => m.id);

              const debts = calculateDebts(
                expenses as Expense[],
                memberIds,
                settlements
              );

              const enrichedDebts = debts.map((d) => ({
                ...d,
                from_user: memberUsers.find((m) => m.id === d.from),
                to_user: memberUsers.find((m) => m.id === d.to),
              }));

              return { groupId: group.id, members: memberUsers, debts: enrichedDebts };
            })
          );

          const newMembers: Record<string, User[]> = {};
          const newDebts: Record<string, Debt[]> = {};
          results.forEach(({ groupId, members, debts }) => {
            newMembers[groupId] = members;
            newDebts[groupId] = debts;
          });

          set((state) => ({
            groupMembers: { ...state.groupMembers, ...newMembers },
            groupDebts: { ...state.groupDebts, ...newDebts },
          }));
        } catch (err) {
          console.error("Failed to fetch group debts:", err);
        }
      },

      fetchPoolGroups: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const poolGroups = await getUserPoolGroups(user.id);
          set({ poolGroups: poolGroups.flat() as unknown as Group[] });
        } catch (err) {
          console.error("Failed to fetch pool groups:", err);
        }
      },

      fetchGroupDetails: async (groupId: string) => {
        try {
          const [groupWithCreator, members] = await Promise.all([
            getGroupWithCreator(groupId),
            getGroupMembers(groupId),
          ]);

          const memberUsers = members
            .map((m) => m.users)
            .filter(Boolean) as unknown as User[];

          set((state) => ({
            activeGroup: { ...groupWithCreator, creator_wallet: groupWithCreator.creator_wallet },
            groupMembers: {
              ...state.groupMembers,
              [groupId]: memberUsers,
            },
          }));

          await get().fetchExpenses(groupId);
        } catch (err) {
          console.error("Failed to fetch group details:", err);
        }
      },

      createGroup: async (name: string, emoji: string) => {
        const { user, walletAddress } = get();
        if (!walletAddress) {
          toast("Please connect your wallet first", "error");
          return null;
        }
        // If user is null (e.g. DB upsert failed during connect), try to recover
        let currentUser = user;
        if (!currentUser) {
          try {
            currentUser = await upsertUser(walletAddress);
            set({ user: currentUser });
          } catch {
            toast("Session expired — please reconnect your wallet", "error");
            return null;
          }
        }
        if (!currentUser) return null;

        try {
          const group = await dbCreateGroup(name, emoji, currentUser.id, "split");
          set((state) => ({ groups: [...state.groups, group as Group] }));
          return group as Group;
        } catch (err: unknown) {
          // FK 23503: user not in DB (e.g. after cleanup, or stale persisted state)
          const isFkError =
            err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "23503";
          if (isFkError) {
            try {
              const freshUser = await upsertUser(walletAddress);
              set({ user: freshUser });
              const group = await dbCreateGroup(name, emoji, freshUser.id, "split");
              set((state) => ({ groups: [...state.groups, group as Group] }));
              return group as Group;
            } catch (retryErr) {
              console.error("Failed to create group (retry):", retryErr);
              toast("Failed to create group — please try again", "error");
              return null;
            }
          }
          console.error("Failed to create group:", err);
          toast("Failed to create group — please try again", "error");
          return null;
        }
      },

      createPoolGroup: async (name: string, emoji: string) => {
        const { user, walletAddress } = get();
        if (!walletAddress) {
          toast("Please connect your wallet first", "error");
          return null;
        }
        let currentUser = user;
        if (!currentUser) {
          try {
            currentUser = await upsertUser(walletAddress);
            set({ user: currentUser });
          } catch {
            toast("Session expired — please reconnect your wallet", "error");
            return null;
          }
        }
        if (!currentUser) return null;

        try {
          const group = await dbCreateGroup(name, emoji, currentUser.id, "pool");
          set((state) => ({ poolGroups: [...state.poolGroups, group as Group] }));
          return group as Group;
        } catch (err: unknown) {
          const isFkError =
            err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "23503";
          if (isFkError) {
            try {
              const freshUser = await upsertUser(walletAddress);
              set({ user: freshUser });
              const group = await dbCreateGroup(name, emoji, freshUser.id, "pool");
              set((state) => ({ poolGroups: [...state.poolGroups, group as Group] }));
              return group as Group;
            } catch {
              toast("Failed to create pool — please try again", "error");
              return null;
            }
          }
          console.error("Failed to create pool group:", err);
          toast("Failed to create pool — please try again", "error");
          return null;
        }
      },

      joinGroup: async (inviteCode: string) => {
        const { user, walletAddress } = get();
        let currentUser = user;
        if (!currentUser && walletAddress) {
          try {
            currentUser = await upsertUser(walletAddress);
            set({ user: currentUser });
          } catch {
            toast("Session expired — please reconnect your wallet", "error");
            return null;
          }
        }
        if (!currentUser) {
          toast("Please connect your wallet first", "error");
          return null;
        }

        try {
          const group = await joinGroupByCode(inviteCode, currentUser.id);
          await get().fetchGroups();
          return group as Group;
        } catch (err) {
          console.error("Failed to join group:", err);
          return null;
        }
      },

      joinPoolGroup: async (inviteCode: string) => {
        const { user, walletAddress } = get();
        let currentUser = user;
        if (!currentUser && walletAddress) {
          try {
            currentUser = await upsertUser(walletAddress);
            set({ user: currentUser });
          } catch {
            toast("Session expired — please reconnect your wallet", "error");
            return null;
          }
        }
        if (!currentUser) {
          toast("Please connect your wallet first", "error");
          return null;
        }

        try {
          const group = await joinGroupByCode(inviteCode, currentUser.id, "pool");
          await get().fetchPoolGroups();
          return group as Group;
        } catch (err) {
          console.error("Failed to join pool group:", err);
          return null;
        }
      },

      // ==========================================
      // EXPENSES
      // ==========================================
      fetchExpenses: async (groupId: string) => {
        set({ isLoadingExpenses: true });
        try {
          const [expenses, settlements] = await Promise.all([
            getGroupExpenses(groupId),
            getGroupSettlements(groupId),
          ]);
          const members = get().groupMembers[groupId] ?? [];
          const memberIds = members.map((m) => m.id);

          // Recalculate debts (expenses - confirmed settlements)
          const debts = calculateDebts(
            expenses as Expense[],
            memberIds,
            settlements
          );

          // Enrich debts with user data
          const enrichedDebts = debts.map((d) => ({
            ...d,
            from_user: members.find((m) => m.id === d.from),
            to_user: members.find((m) => m.id === d.to),
          }));

          set((state) => ({
            groupExpenses: {
              ...state.groupExpenses,
              [groupId]: expenses as Expense[],
            },
            groupDebts: {
              ...state.groupDebts,
              [groupId]: enrichedDebts,
            },
            isLoadingExpenses: false,
          }));
        } catch (err) {
          console.error("Failed to fetch expenses:", err);
          set({ isLoadingExpenses: false });
        }
      },

      addExpense: async (groupId: string, expense: NewExpense) => {
        const { user, activeGroup } = get();
        if (!user) return;

        const currency = getGroupCurrency(activeGroup?.type);

        await dbAddExpense(
          groupId,
          expense.paid_by,
          expense.description,
          expense.amount,
          expense.split_type,
          expense.split_details,
          currency
        );

        // Refresh
        await get().fetchExpenses(groupId);
      },

      // ==========================================
      // SETTLEMENT
      // ==========================================
      settleDebt: async (groupId: string, debt: Debt, toAddress: string) => {
        const { wallet, user } = get();
        if (!wallet || !user) throw new Error("Not connected");

        const settlement = await createSettlement(
          groupId,
          debt.from,
          debt.to,
          debt.amount,
          undefined
        );

        try {
          const { txHash } = await transferCustomToken(
            wallet,
            toAddress,
            debt.amount.toString()
          );

          await updateSettlementStatus(settlement.id, "confirmed", txHash);
          await get().fetchExpenses(groupId);
          // Refresh wallet balances after successful settlement
          get().refreshBalances();

          return { settlementId: settlement.id, txHash };
        } catch (err) {
          await updateSettlementStatus(settlement.id, "failed");
          throw err;
        }
      },


      // ==========================================
      // BALANCES
      // ==========================================
      refreshBalances: async () => {
        const { walletAddress } = get();
        if (!walletAddress) return;

        try {
          const balances = await fetchBalancesByAddress(walletAddress);
          set({ walletBalances: balances });
        } catch (err) {
          console.error("Failed to refresh balances:", err);
        }
      },

      refreshUser: async () => {
        const { walletAddress } = get();
        if (!walletAddress) return;

        try {
          let user = await getUserByWallet(walletAddress);
          // If user not found in DB (e.g. after DB cleanup), re-create them
          if (!user) {
            user = await upsertUser(walletAddress);
          }
          set({ user });
        } catch (err) {
          console.error("Failed to refresh user:", err);
        }
      },

      setUserDisplayName: (displayName) => {
        const { user } = get();
        if (user) set({ user: { ...user, display_name: displayName } });
      },

      // ==========================================
      // HELPERS
      // ==========================================
      getDebtsForGroup: (groupId: string) => {
        return get().groupDebts[groupId] ?? [];
      },

      getUserBalance: (groupId: string) => {
        const { user, groupDebts } = get();
        if (!user) return 0;

        const debts = groupDebts[groupId] ?? [];
        let net = 0;
        debts.forEach((d) => {
          if (d.to === user.id) net += d.amount;
          if (d.from === user.id) net -= d.amount;
        });
        return Number(net.toFixed(8));
      },
    }),
    {
      name: "starksplit-store",
      partialize: (state) => ({
        // Only persist minimal auth state
        walletAddress: state.walletAddress,
        user: state.user,
      }),
    }
  )
);
