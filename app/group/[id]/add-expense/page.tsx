"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  }, [groupId]);

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
      router.push(`/group/${groupId}`);
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

  return (
    <div className="flex justify-center px-5 py-6 pb-24">
      <div className="w-full max-w-md flex flex-col min-h-[calc(100vh-140px)]">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm p-2 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <span className="font-bold text-[var(--text-primary)]">Add Expense</span>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center pb-6 relative">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(108,92,231,0.1) 0%, transparent 70%)" }}
          />

          {/* Amount — native input: keyboard on laptop, numeric keypad on mobile */}
          <div style={{ position: "relative", width: "100%", maxWidth: 280, marginBottom: amountError ? 8 : 32 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, width: "100%", justifyContent: "center" }}>
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
                  color: amountError ? "var(--error)" : numAmount > 0 ? "var(--text-primary)" : "var(--text-tertiary)",
                  background: "none",
                  border: "none",
                  outline: "none",
                  width: "100%",
                  textAlign: "center",
                  caretColor: "var(--primary)",
                }}
              />
              <span style={{ fontSize: "1.25rem", fontWeight: 700, color: amountError ? "var(--error)" : "var(--text-tertiary)", marginBottom: 8 }}>
                {currency}
              </span>
            </div>
            {amountError && (
              <p className="text-center text-xs font-semibold mt-1 mb-6" style={{ color: "var(--error)" }}>
                {amountError}
              </p>
            )}
          </div>

          {/* Description */}
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
              maxWidth: 280,
              marginBottom: 28,
              transition: "border-color 0.15s ease",
            }}
            placeholder="What's this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Paid by */}
          <div style={{ width: "100%", maxWidth: 320, marginBottom: 20 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center", marginBottom: 10 }}>
              PAID BY
            </p>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", justifyContent: "center", paddingBottom: 4 }}>
              {members.map((member) => {
                const isSelected = paidBy === member.id;
                const isYou = member.id === user?.id;
                const name = member.display_name ?? truncateAddress(member.wallet_address ?? "");

                return (
                  <button
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
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    <div
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
                    >
                      {isSelected ? <Check size={14} /> : getInitials(name)}
                    </div>
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
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split among */}
          <div style={{ width: "100%", maxWidth: 320, marginBottom: 20 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center", marginBottom: 10 }}>
              SPLIT AMONG
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
                    {isSelected ? <Check size={14} color="var(--primary)" /> : null}
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
            <p style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", textAlign: "center", marginTop: 8 }}>
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
              (isCustomToken && (numAmount < MIN_CUSTOM_TOKEN_AMOUNT || numAmount > MAX_CUSTOM_TOKEN_AMOUNT))
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
