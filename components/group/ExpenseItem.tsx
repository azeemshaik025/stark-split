"use client";

import { motion } from "framer-motion";
import { CUSTOM_TOKEN_DISPLAY_DECIMALS, CUSTOM_TOKEN_SYMBOL, guessCategory, STRK_DISPLAY_DECIMALS } from "@/lib/constants";
import { formatAmount, formatDate, truncateAddress } from "@/lib/utils";
import type { Expense } from "@/types";

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
  const displayDecimals = (currency ?? expense.currency ?? CUSTOM_TOKEN_SYMBOL) !== "STRK" ? CUSTOM_TOKEN_DISPLAY_DECIMALS : STRK_DISPLAY_DECIMALS;

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

  // Treat dust as zero (avoids floating-point noise). 1e-18 supports STRK 18 decimals and WBTC 10e-8.
  const DUST = 1e-18;
  const effectiveAmount = Math.abs(displayAmount) < DUST ? 0 : displayAmount;

  const totalDisplay = formatAmount(expense.amount, displayDecimals);
  const sym = currency ?? expense.currency ?? CUSTOM_TOKEN_SYMBOL;

  return (
    <motion.div
      className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl mb-1.5 last:mb-0"
      style={{
        background: "var(--bg-surface)",
        border: `1px solid var(--border-subtle)`,
        borderLeft: isYou && effectiveAmount > 0 ? "3px solid var(--accent-green)" : undefined,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -1, boxShadow: "var(--shadow-sm)" }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: "var(--bg-interactive)" }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[var(--text-primary)] truncate text-[0.9rem] leading-tight">{expense.description}</div>
        <div className="text-xs text-[var(--text-tertiary)] mt-1">
          <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>{isYou ? "You" : paidByName}</span>
          {" paid "}
          <span className="font-mono-nums" style={{ fontWeight: 600 }}>
            {totalDisplay}
          </span>
          <span style={{ opacity: 0.5 }}>{" · "}</span>
          {formatDate(expense.created_at)}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div
          className="font-mono-nums font-bold text-[0.9375rem]"
          style={{
            color:
              effectiveAmount === 0
                ? "var(--text-tertiary)"
                : isYou
                  ? "var(--accent-green)"
                  : "var(--error)",
          }}
        >
          {effectiveAmount === 0
            ? "—"
            : isYou
              ? `+${formatAmount(effectiveAmount, displayDecimals)}`
              : `-${formatAmount(effectiveAmount, displayDecimals)}`}
        </div>
        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{sym}</div>
      </div>
    </motion.div>
  );
}
