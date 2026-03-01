"use client";

import { guessCategory, CUSTOM_TOKEN_SYMBOL, CUSTOM_TOKEN_DECIMALS } from "@/lib/constants";
import { formatDate, truncateAddress, formatAmount } from "@/lib/utils";
import type { Expense, User } from "@/types";

interface ExpenseItemProps {
  expense: Expense;
  currentUserId?: string;
  memberCount?: number;
  currency?: string;
}

export default function ExpenseItem({ expense, currentUserId, memberCount = 1, currency }: ExpenseItemProps) {
  const emoji = guessCategory(expense.description);
  const paidByName =
    expense.paid_by_user?.display_name ??
    truncateAddress(expense.paid_by_user?.wallet_address ?? "");
  const isYou = expense.paid_by === currentUserId;

  // Calculate the amount relevant to the current user
  let displayAmount: number;
  const splitCount = expense.split_type === "equal" && expense.split_details && Object.keys(expense.split_details).length > 0
    ? Object.keys(expense.split_details).length
    : (memberCount || 1);
  const isInSplit = expense.split_type !== "equal" || !expense.split_details || Object.keys(expense.split_details).length === 0
    ? true
    : (currentUserId !== undefined && currentUserId in expense.split_details);

  if (isYou) {
    // You paid — show what you're owed back (full amount if not in split, else amount minus your share)
    displayAmount = isInSplit && splitCount > 0 ? expense.amount - expense.amount / splitCount : expense.amount;
  } else if (expense.split_type === "exact" && expense.split_details && currentUserId && expense.split_details[currentUserId] !== undefined) {
    displayAmount = expense.split_details[currentUserId];
  } else if (expense.split_type === "percentage" && expense.split_details && currentUserId && expense.split_details[currentUserId] !== undefined) {
    displayAmount = (expense.amount * expense.split_details[currentUserId]) / 100;
  } else {
    // Equal split — use split_details keys if present (selected members), else all members
    displayAmount = isInSplit && splitCount > 0 ? expense.amount / splitCount : 0;
  }

  return (
    <div className="flex items-center gap-4 py-4 border-b border-[var(--border-subtle)] last:border-0">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: "var(--bg-interactive)" }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[var(--text-primary)] truncate">{expense.description}</div>
        <div className="text-sm text-[var(--text-secondary)]">
          {isYou ? "You" : paidByName} paid · {formatDate(expense.created_at)}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div
          className="font-mono-nums font-bold text-sm"
          style={{
            color:
              displayAmount === 0
                ? "var(--text-tertiary)"
                : isYou
                  ? "var(--accent-green)"
                  : "var(--error)",
          }}
        >
          {displayAmount === 0 ? "0.00" : isYou ? `+${formatAmount(displayAmount, CUSTOM_TOKEN_DECIMALS)}` : `-${formatAmount(displayAmount, CUSTOM_TOKEN_DECIMALS)}`}
        </div>
        <div className="text-xs text-[var(--text-tertiary)]">{currency ?? expense.currency ?? CUSTOM_TOKEN_SYMBOL}</div>
      </div>
    </div>
  );
}
