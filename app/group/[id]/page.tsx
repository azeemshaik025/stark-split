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
function TabBar({ active, onChange }: { active: TabType; onChange: (t: TabType) => void }) {
  const tabs: { key: TabType; label: string }[] = [
    { key: "expenses", label: "Expenses" },
    { key: "balances", label: "Balances" },
  ];

  return (
    <div className="flex border-b border-[var(--border-subtle)]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="flex-1 py-3 text-sm font-medium transition-colors relative"
          style={{
            color: active === tab.key ? "var(--primary)" : "var(--text-secondary)",
          }}
        >
          {tab.label}
          {active === tab.key && (
            <span
              className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
              style={{ background: "var(--primary)" }}
            />
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
        <div className="flex justify-between items-center mb-6">
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

        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: "var(--bg-interactive)" }}
          >
            {activeGroup?.emoji ?? "💰"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] mb-2">
              {activeGroup?.name ?? "Loading..."}
            </h1>
            <div className="flex items-center gap-2">
              <AvatarGroup users={members} size={26} max={5} />
              <span className="text-sm text-[var(--text-secondary)]">
                {members.length} member{members.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {user && debts.length > 0 && (
          <div
            className="mt-4 px-4 py-3 rounded-xl text-sm"
            style={{
              background: totalYouOwe > 0 ? "rgba(255,71,87,0.06)" : "rgba(0,230,118,0.06)",
              border: `1px solid ${totalYouOwe > 0 ? "rgba(255,71,87,0.12)" : "rgba(0,230,118,0.12)"}`,
            }}
          >
            {totalYouOwe > 0 ? (
              <span>
                You owe{" "}
                <span className="font-mono-nums font-bold text-[var(--error)]">
                  {formatAmount(totalYouOwe, currency !== "STRK" ? CUSTOM_TOKEN_DISPLAY_DECIMALS : STRK_DISPLAY_DECIMALS)} {currency}
                </span>{" "}
                in total
              </span>
            ) : totalOwedToYou > 0 ? (
              <span>
                You&apos;re owed{" "}
                <span className="font-mono-nums font-bold text-[var(--accent-green)]">
                  {formatAmount(totalOwedToYou, currency !== "STRK" ? CUSTOM_TOKEN_DISPLAY_DECIMALS : STRK_DISPLAY_DECIMALS)} {currency}
                </span>{" "}
                in total
              </span>
            ) : (
              <span className="font-semibold text-[var(--accent-green)]">✓ You&apos;re all settled up!</span>
            )}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div>
        <TabBar active={tab} onChange={setTab} />
      </div>

      {/* Tab content */}
      <div className="pt-4 pb-24">
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
          className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl flex items-center justify-center z-50 shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #6C5CE7, #5A4BD1)",
            boxShadow: "0 8px 24px rgba(108, 92, 231, 0.4)",
          }}
          aria-label="Add expense"
        >
          <Plus size={24} color="white" strokeWidth={2.5} />
        </Link>
      )}

      <ToastContainer />
    </div>
  );
}
