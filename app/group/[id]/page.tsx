"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, SplitSquareVertical } from "lucide-react";
import { useStore } from "@/store/useStore";
import { formatDateHeader, truncateAddress, formatAmount } from "@/lib/utils";
import { getGroupCurrency, CUSTOM_TOKEN_DISPLAY_DECIMALS, STRK_DISPLAY_DECIMALS } from "@/lib/constants";
import { toast, ToastContainer } from "@/components/ui/Toast";
import { AvatarGroup } from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { ExpenseListSkeleton } from "@/components/ui/Skeleton";
import ExpenseItem from "@/components/group/ExpenseItem";
import DebtSummary from "@/components/group/DebtSummary";
import InviteShare from "@/components/group/InviteShare";
import type { Debt, TabType } from "@/types";

// Tab bar
function TabBar({
  active,
  onChange,
  expenseCount,
  debtCount,
}: {
  active: TabType;
  onChange: (t: TabType) => void;
  expenseCount?: number;
  debtCount?: number;
}) {
  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: "expenses", label: "Expenses", count: expenseCount },
    { key: "balances", label: "Balances", count: debtCount },
  ];

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`tab-item ${active === tab.key ? "tab-item-active" : ""}`}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className="tab-badge">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Group expense list grouped by date
function ExpensesList({
  expenses,
  currentUserId,
  memberCount,
  isLoading,
  currency,
}: {
  expenses: ReturnType<typeof useStore.getState>["groupExpenses"][string];
  currentUserId?: string;
  memberCount: number;
  isLoading: boolean;
  currency: string;
}) {
  if (isLoading) return <ExpenseListSkeleton count={4} />;

  if (!expenses?.length) {
    return (
      <div className="text-center py-14 px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--primary-subtle)" }}
        >
          <SplitSquareVertical size={32} strokeWidth={1.5} style={{ color: "var(--primary)" }} />
        </div>
        <h3 className="text-lg font-bold mb-2">No expenses yet</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Tap the + button below to add the first expense.
        </p>
      </div>
    );
  }

  // Group by date header
  const grouped: Record<string, typeof expenses> = {};
  expenses.forEach((e) => {
    const header = formatDateHeader(e.created_at);
    if (!grouped[header]) grouped[header] = [];
    grouped[header].push(e);
  });

  return (
    <div>
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] py-3 pt-4 first:pt-0">
            {date}
          </p>
          {items.map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              currentUserId={currentUserId}
              memberCount={memberCount}
              currency={currency}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const {
    activeGroup,
    user,
    wallet,
    groupExpenses,
    groupMembers,
    groupDebts,
    isLoadingExpenses,
    fetchGroupDetails,
    fetchExpenses,
  } = useStore();

  const [tab, setTab] = useState<TabType>("expenses");

  const expenses = groupExpenses[groupId] ?? [];
  const members = groupMembers[groupId] ?? [];
  const debts = groupDebts[groupId] ?? [];

  useEffect(() => {
    fetchGroupDetails(groupId);
  }, [groupId]);

  async function handleSettleDebt(debt: Debt) {
    const toUser = members.find((m) => m.id === debt.to);
    if (!toUser?.wallet_address) {
      toast("Could not find recipient address", "error");
      return;
    }
    router.push(`/group/${groupId}/settle?from=${debt.from}&to=${debt.to}&amount=${debt.amount}`);
  }

  const totalYouOwe = debts
    .filter((d) => d.from === user?.id)
    .reduce((sum, d) => sum + d.amount, 0);

  const totalOwedToYou = debts
    .filter((d) => d.to === user?.id)
    .reduce((sum, d) => sum + d.amount, 0);

  const currency = getGroupCurrency(activeGroup?.type);

  return (
    <div className="page-content" style={{ maxWidth: 860 }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-5">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn btn-ghost btn-sm p-2 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          {activeGroup?.invite_code && (
            <InviteShare
              inviteCode={activeGroup.invite_code}
              groupName={activeGroup.name ?? "Group"}
              variant="modal"
            />
          )}
        </div>

        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{
              background: "var(--bg-interactive)",
              width: 52,
              height: 52,
            }}
          >
            {activeGroup?.emoji ?? "💰"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] mb-1.5">
              {activeGroup?.name ?? "Loading..."}
            </h1>
            <div className="flex items-center gap-2">
              <AvatarGroup users={members} size={24} max={5} />
              <span className="text-xs text-[var(--text-tertiary)]">
                {members.length} member{members.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {user && debts.length > 0 && (
          <div
            className={`balance-banner ${
              totalYouOwe > 0 ? "balance-banner-owe" : totalOwedToYou > 0 ? "balance-banner-owed" : "balance-banner-settled"
            }`}
          >
            {totalYouOwe > 0 ? (
              <span>
                You owe{" "}
                <span className="font-mono-nums font-bold" style={{ color: "var(--error)" }}>
                  {formatAmount(totalYouOwe, currency !== "STRK" ? CUSTOM_TOKEN_DISPLAY_DECIMALS : STRK_DISPLAY_DECIMALS)} {currency}
                </span>{" "}
                in total
              </span>
            ) : totalOwedToYou > 0 ? (
              <span>
                You&apos;re owed{" "}
                <span className="font-mono-nums font-bold" style={{ color: "var(--accent-green)" }}>
                  {formatAmount(totalOwedToYou, currency !== "STRK" ? CUSTOM_TOKEN_DISPLAY_DECIMALS : STRK_DISPLAY_DECIMALS)} {currency}
                </span>{" "}
                in total
              </span>
            ) : (
              <span className="font-semibold" style={{ color: "var(--accent-green)" }}>All settled up</span>
            )}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="mb-4">
        <TabBar
          active={tab}
          onChange={setTab}
          expenseCount={expenses.length}
          debtCount={debts.length}
        />
      </div>

      {/* Tab content */}
      <div className="pb-24">
        {tab === "expenses" && (
          <ExpensesList
            expenses={expenses}
            currentUserId={user?.id}
            memberCount={members.length || 1}
            isLoading={isLoadingExpenses}
            currency={currency}
          />
        )}

        {tab === "balances" && (
          <div style={{ paddingTop: 16 }}>
            {isLoadingExpenses ? (
              <ExpenseListSkeleton count={3} />
            ) : !debts.length ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <span className="text-3xl">✨</span>
                </div>
                <h3 className="text-heading mb-2">All settled!</h3>
                <p className="text-body-sm text-[var(--text-secondary)]">
                  No one owes anything. Great job!
                </p>
              </div>
            ) : (
              user && (
                <DebtSummary
                  debts={debts}
                  currentUserId={user.id}
                  onSettle={handleSettleDebt}
                  currency={currency}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* FAB — Add Expense */}
      {tab === "expenses" && (
        <Link
          href={`/group/${groupId}/add-expense`}
          className="fixed bottom-24 right-6 w-12 h-12 rounded-xl flex items-center justify-center z-50 transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
            boxShadow: "var(--shadow-btn)",
          }}
          aria-label="Add expense"
        >
          <Plus size={22} color="white" strokeWidth={2.5} />
        </Link>
      )}

      <ToastContainer />
    </div>
  );
}
