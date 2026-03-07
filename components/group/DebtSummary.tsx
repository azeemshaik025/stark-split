"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, Zap } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { CUSTOM_TOKEN_SYMBOL, CUSTOM_TOKEN_DISPLAY_DECIMALS, STRK_DISPLAY_DECIMALS, NETWORK } from "@/lib/constants";
import { formatAmount, truncateAddress } from "@/lib/utils";
import type { Debt, User } from "@/types";

interface DebtSummaryProps {
  debts: Debt[];
  currentUserId: string;
  onSettle?: (debt: Debt) => void;
  currency?: string;
}

function getMemberDisplayName(
  user: { display_name?: string | null; wallet_address?: string } | null,
  fallbackId?: string
): string {
  if (!user) return truncateAddress(fallbackId ?? "");
  const name = user.display_name?.trim();
  // Use truncateAddress when display_name is empty or looks like wallet initials (e.g. "03" from 0x03...)
  if (!name || (name.length <= 3 && /^[0-9a-fx]{2,3}$/i.test(name))) {
    return truncateAddress(user.wallet_address ?? fallbackId ?? "");
  }
  return name;
}

export default function DebtSummary({
  debts,
  currentUserId,
  onSettle,
  currency = CUSTOM_TOKEN_SYMBOL,
}: DebtSummaryProps) {
  if (debts.length === 0) {
    return (
      <motion.div
        className="text-center py-14 px-6"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div
          className="w-14 h-14 rounded-full bg-[rgba(0,230,118,0.1)] flex items-center justify-center mx-auto mb-4"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.05 }}
        >
          <CheckCircle size={28} color="var(--accent-green)" />
        </motion.div>
        <h3 className="text-lg font-bold mb-2">All settled up!</h3>
        <p className="text-sm text-[var(--text-secondary)]">No outstanding debts in this group.</p>
      </motion.div>
    );
  }

  const myDebts = debts.filter((d) => d.from === currentUserId);
  const owedToMe = debts.filter((d) => d.to === currentUserId);
  const otherDebts = debts.filter(
    (d) => d.from !== currentUserId && d.to !== currentUserId
  );

  function DebtRow({ debt, highlight, index = 0 }: { debt: Debt; highlight?: "owe" | "owed"; index?: number }) {
    const fromName = getMemberDisplayName(debt.from_user ?? null, debt.from);
    const toName = getMemberDisplayName(debt.to_user ?? null, debt.to);

    const isYouOwe = debt.from === currentUserId;
    const isOwedToYou = debt.to === currentUserId;

    return (
      <motion.div
        className={`debt-row ${isYouOwe ? "debt-row-owe" : isOwedToYou ? "debt-row-owed" : "debt-row-other"}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -1, boxShadow: "var(--shadow-sm)" }}
        transition={{ duration: 0.2, delay: index * 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Avatar user={debt.from_user ?? { id: debt.from }} size={32} />
        <div className="flex-1 text-body-sm text-[var(--text-secondary)]">
          <span
            style={{
              color:
                isYouOwe ? "var(--error)" : isOwedToYou ? "var(--accent-green)" : "var(--text-primary)",
              fontWeight: 600,
            }}
          >
            {isYouOwe ? "You" : fromName}
          </span>
          {" owes "}
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            {isOwedToYou ? "you" : toName}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="font-mono-nums"
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color:
                isYouOwe
                  ? "var(--error)"
                  : isOwedToYou
                  ? "var(--accent-green)"
                  : "var(--text-primary)",
            }}
          >
            {formatAmount(debt.amount, currency !== "STRK" ? CUSTOM_TOKEN_DISPLAY_DECIMALS : STRK_DISPLAY_DECIMALS)} {currency}
          </span>

          {isYouOwe && onSettle && (
            <motion.div whileHover={{ scale: 1.02, transition: { duration: 0.15 } }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="primary"
                size="sm"
                className="btn-gradient"
                onClick={() => onSettle(debt)}
                style={{ padding: "6px 14px", fontSize: "0.75rem", gap: 4 }}
              >
                {NETWORK === "mainnet" ? <Zap size={12} /> : null}
                Pay
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      {myDebts.length > 0 && (
        <div className="mb-5">
          <p className="text-label mb-2.5" style={{ color: "var(--error)" }}>
            You owe
          </p>
          {myDebts.map((d, i) => (
            <DebtRow key={`${d.from}-${d.to}`} debt={d} highlight="owe" index={i} />
          ))}
        </div>
      )}

      {owedToMe.length > 0 && (
        <div className="mb-5">
          <p className="text-label mb-2.5" style={{ color: "var(--accent-green)" }}>
            Owed to you
          </p>
          {owedToMe.map((d, i) => (
            <DebtRow key={`${d.from}-${d.to}`} debt={d} highlight="owed" index={i} />
          ))}
        </div>
      )}

      {otherDebts.length > 0 && (
        <div>
          <p className="text-label mb-2.5">
            Other debts
          </p>
          {otherDebts.map((d, i) => (
            <DebtRow key={`${d.from}-${d.to}`} debt={d} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
