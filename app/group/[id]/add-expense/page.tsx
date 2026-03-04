"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { ArrowLeft, Check } from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  getGroupCurrency,
  MIN_CUSTOM_TOKEN_AMOUNT,
  MAX_CUSTOM_TOKEN_AMOUNT,
  CUSTOM_TOKEN_DECIMAL_PLACES,
} from "@/lib/constants";
import { getInitials, getAvatarGradient, truncateAddress } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { toast, ToastContainer } from "@/components/ui/Toast";

// Quick category suggestions with emoji
const QUICK_CATEGORIES: { label: string; emoji: string }[] = [
  { label: "Dinner", emoji: "🍕" },
  { label: "Coffee", emoji: "☕" },
  { label: "Groceries", emoji: "🛒" },
  { label: "Drinks", emoji: "🍺" },
  { label: "Rent", emoji: "🏠" },
  { label: "Uber", emoji: "🚗" },
  { label: "Hotel", emoji: "🏨" },
  { label: "Movies", emoji: "🎬" },
  { label: "Flights", emoji: "✈️" },
  { label: "Shopping", emoji: "🛍️" },
];

export default function AddExpensePage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const { user, activeGroup, groupMembers, fetchGroupDetails, addExpense } = useStore();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState<string>("");
  const [splitAmong, setSplitAmong] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const members = groupMembers[groupId] ?? [];

  useEffect(() => {
    if (!groupMembers[groupId]) {
      fetchGroupDetails(groupId);
    }
  }, [groupId, groupMembers, fetchGroupDetails]);

  useEffect(() => {
    if (user && !paidBy) {
      setPaidBy(user.id);
    }
  }, [user, members]);

  // Default split among: all members
  useEffect(() => {
    if (members.length > 0 && splitAmong.size === 0) {
      setSplitAmong(new Set(members.map((m) => m.id)));
    }
  }, [members]);

  const currency = getGroupCurrency(activeGroup?.type);
  const isCustomToken = currency !== "STRK";
  const maxDecimals = isCustomToken ? CUSTOM_TOKEN_DECIMAL_PLACES : 2;

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      setAmount("");
      return;
    }
    const match = raw.match(new RegExp(`^\\d*\\.?\\d{0,${maxDecimals}}`));
    if (match) setAmount(match[0]);
  }

  const handleQuickCategory = useCallback((label: string, emoji: string) => {
    setDescription(`${emoji} ${label}`);
  }, []);

  async function handleSubmit() {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    if (isCustomToken) {
      if (numAmount < MIN_CUSTOM_TOKEN_AMOUNT) {
        toast(`Minimum amount is ${MIN_CUSTOM_TOKEN_AMOUNT} ${currency}`, "error");
        return;
      }
      if (numAmount > MAX_CUSTOM_TOKEN_AMOUNT) {
        toast(`Maximum amount is ${MAX_CUSTOM_TOKEN_AMOUNT} ${currency} (demo limit)`, "error");
        return;
      }
    }
    if (!description.trim()) {
      toast("Add a description", "error");
      return;
    }
    if (!paidBy) {
      toast("Select who paid", "error");
      return;
    }
    if (splitAmong.size === 0) {
      toast("Select at least one person to split with", "error");
      return;
    }

    setLoading(true);
    try {
      await addExpense(groupId, {
        description: description.trim(),
        amount: numAmount,
        paid_by: paidBy,
        split_type: "equal",
        split_details: Object.fromEntries([...splitAmong].map((id) => [id, 1])),
      });
      toast("Expense added!", "success");
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#6C5CE7", "#00D2FF", "#00E676"],
      });
      setTimeout(() => router.push(`/group/${groupId}`), 600);
    } catch {
      toast("Failed to add expense", "error");
    } finally {
      setLoading(false);
    }
  }

  const numAmount = parseFloat(amount) || 0;
  const amountError =
    numAmount > 0 && isCustomToken
      ? numAmount < MIN_CUSTOM_TOKEN_AMOUNT
        ? `Minimum ${MIN_CUSTOM_TOKEN_AMOUNT} ${currency}`
        : numAmount > MAX_CUSTOM_TOKEN_AMOUNT
        ? `Maximum ${MAX_CUSTOM_TOKEN_AMOUNT} ${currency}`
        : null
      : null;

  // Per-person amount for equal split preview
  const perPersonAmount = splitAmong.size > 0 && numAmount > 0
    ? (numAmount / splitAmong.size).toFixed(maxDecimals).replace(/\.?0+$/, "")
    : null;

  return (
    <div className="flex justify-center px-5 py-6 pb-24">
      <div className="w-full max-w-md flex flex-col min-h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm p-2 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <span className="font-bold text-[var(--text-primary)]">Add Expense</span>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center pb-6 relative">
          {/* Background glow */}
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(108,92,231,0.08) 0%, transparent 70%)" }}
          />

          {/* Amount input */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 300,
              marginBottom: amountError ? 8 : 28,
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                width: "100%",
                justifyContent: "center",
              }}
            >
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={amount}
                onChange={handleAmountChange}
                className={`font-mono-nums${amountError ? " input-error" : ""}`}
                style={{
                  fontSize: "clamp(2.5rem, 16vw, 4rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: amountError
                    ? "var(--error)"
                    : numAmount > 0
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)",
                  background: "none",
                  border: "none",
                  outline: "none",
                  width: "100%",
                  textAlign: "center",
                  caretColor: "var(--primary)",
                }}
              />
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: amountError ? "var(--error)" : "var(--text-tertiary)",
                  marginBottom: 8,
                }}
              >
                {currency}
              </span>
            </div>

            {/* Per-person preview */}
            <AnimatePresence>
              {perPersonAmount && !amountError && splitAmong.size > 1 && (
                <motion.div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-2"
                  style={{
                    background: "var(--primary-subtle)",
                    color: "var(--primary)",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}
                  initial={{ opacity: 0, scale: 0.85, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -4 }}
                  transition={{ type: "spring", stiffness: 360, damping: 22 }}
                >
                  {perPersonAmount} {currency} / person · {splitAmong.size} people
                </motion.div>
              )}
            </AnimatePresence>

            {amountError && (
              <p className="text-center text-xs font-semibold mt-1 mb-6" style={{ color: "var(--error)" }}>
                {amountError}
              </p>
            )}
          </div>

          {/* Description input */}
          <input
            style={{
              background: "none",
              border: "none",
              outline: "none",
              borderBottom: `1px solid ${description ? "var(--border-default)" : "var(--border-subtle)"}`,
              padding: "8px 0",
              textAlign: "center",
              fontSize: "1.125rem",
              color: description ? "var(--text-primary)" : "var(--text-tertiary)",
              width: "100%",
              maxWidth: 300,
              marginBottom: 16,
              transition: "border-color 0.15s ease",
            }}
            placeholder="What's this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Quick category chips */}
          <div style={{ width: "100%", maxWidth: 360, marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 4,
                scrollbarWidth: "none",
              }}
            >
              {QUICK_CATEGORIES.map(({ label, emoji }) => {
                const isSelected = description === `${emoji} ${label}`;
                return (
                  <motion.button
                    key={label}
                    type="button"
                    onClick={() => handleQuickCategory(label, emoji)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 12px",
                      borderRadius: 20,
                      background: isSelected ? "var(--primary-subtle)" : "var(--bg-surface)",
                      border: `1px solid ${isSelected ? "var(--primary)" : "var(--border-subtle)"}`,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: isSelected ? "var(--primary)" : "var(--text-secondary)",
                      transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                      flexShrink: 0,
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Paid by */}
          <div style={{ width: "100%", maxWidth: 320, marginBottom: 20 }}>
            <p className="text-label" style={{ textAlign: "center", marginBottom: 10 }}>
              Paid By
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                justifyContent: "center",
                paddingBottom: 4,
              }}
            >
              {members.map((member) => {
                const isSelected = paidBy === member.id;
                const isYou = member.id === user?.id;
                const name = member.display_name ?? truncateAddress(member.wallet_address ?? "");

                return (
                  <motion.button
                    key={member.id}
                    onClick={() => setPaidBy(member.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: isSelected ? "var(--primary-subtle)" : "var(--bg-surface)",
                      border: `1px solid ${isSelected ? "var(--primary)" : "var(--border-subtle)"}`,
                      cursor: "pointer",
                      transition: "background 0.15s ease, border-color 0.15s ease",
                      flexShrink: 0,
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 380, damping: 20 }}
                  >
                    <motion.div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: getAvatarGradient(member.id),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "white",
                      }}
                      animate={isSelected ? { scale: 1.08 } : { scale: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 18 }}
                    >
                      <AnimatePresence mode="wait">
                        {isSelected ? (
                          <motion.span
                            key="check"
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 18 }}
                          >
                            <Check size={14} />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="initials"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.1 }}
                          >
                            {getInitials(name)}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: isSelected ? "var(--primary)" : "var(--text-secondary)",
                        maxWidth: 56,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isYou ? "You" : name.split(" ")[0]}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Split among */}
          <div style={{ width: "100%", maxWidth: 320, marginBottom: 20 }}>
            <p className="text-label" style={{ textAlign: "center", marginBottom: 10 }}>
              Split Among
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {members.map((member) => {
                const isSelected = splitAmong.has(member.id);
                const isYou = member.id === user?.id;
                const name = member.display_name ?? truncateAddress(member.wallet_address ?? "");

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setSplitAmong((prev) => {
                        const next = new Set(prev);
                        if (next.has(member.id)) {
                          if (next.size > 1) next.delete(member.id);
                        } else {
                          next.add(member.id);
                        }
                        return next;
                      });
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: isSelected ? "var(--primary-subtle)" : "var(--bg-surface)",
                      border: `1px solid ${isSelected ? "var(--primary)" : "var(--border-subtle)"}`,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isSelected && <Check size={13} color="var(--primary)" />}
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: isSelected ? "var(--primary)" : "var(--text-secondary)",
                      }}
                    >
                      {isYou ? "You" : name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p
              style={{
                fontSize: "0.6875rem",
                color: "var(--text-tertiary)",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              {splitAmong.size} of {members.length} selected · tap to toggle
            </p>
          </div>
        </div>

        <div className="mb-8">
          <Button
            fullWidth
            size="lg"
            loading={loading}
            onClick={handleSubmit}
            className="btn-gradient"
            disabled={
              !amount ||
              numAmount <= 0 ||
              !description.trim() ||
              (isCustomToken &&
                (numAmount < MIN_CUSTOM_TOKEN_AMOUNT || numAmount > MAX_CUSTOM_TOKEN_AMOUNT))
            }
          >
            Add Expense
          </Button>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
