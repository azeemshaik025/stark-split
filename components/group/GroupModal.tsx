"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X, UserPlus, ClipboardPaste } from "lucide-react";
import { useStore } from "@/store/useStore";
import Button from "@/components/ui/Button";
import Tooltip from "@/components/ui/Tooltip";
import { toast } from "@/components/ui/Toast";
import type { Group } from "@/types";

/** Extract invite code from paste (handles full URL or raw code) */
function extractInviteCode(pasted: string): string {
  const trimmed = pasted.trim().toLowerCase();
  // Match /join/CODE or /join/CODE/ at end of URL
  const match = trimmed.match(/\/join\/([a-z0-9]+)\/?$/);
  if (match) return match[1];
  // Raw code: alphanumeric only, take first 8 chars
  const raw = trimmed.replace(/[^a-z0-9]/g, "").slice(0, 8);
  return raw || trimmed.slice(0, 8);
}

/** Group type icons — who you're splitting with, not the reason */
const GROUP_ICONS: { emoji: string; label: string }[] = [
  { emoji: "👥", label: "Friends" },
  { emoji: "👨‍👩‍👧‍👦", label: "Family" },
  { emoji: "💕", label: "Bf/Gf" },
  { emoji: "🏠", label: "Roommates" },
  { emoji: "👫", label: "Partners" },
  { emoji: "🎓", label: "Classmates" },
  { emoji: "🌍", label: "Travel buddies" },
  { emoji: "🎮", label: "Squad" },
];

interface GroupModalProps {
  mode: "create" | "join";
  /** When "pool", creates/joins a pool group (Yield). Omit for split groups (Splits). */
  groupType?: "split" | "pool";
  onClose: () => void;
  onSuccess: (group: Group) => void;
}

export default function GroupModal({ mode, groupType = "split", onClose, onSuccess }: GroupModalProps) {
  const { createGroup, createPoolGroup, joinGroup, joinPoolGroup } = useStore();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("👥");
  const [code, setCode] = useState("");
  const [nameError, setNameError] = useState("");

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const extracted = extractInviteCode(text);
      setCode(extracted);
    } catch {
      toast("Could not read clipboard", "error");
    }
  }, []);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
    setCode(raw);
  };

  async function handle() {
    // Validate for create mode
    if (mode === "create") {
      if (name.trim() === "") {
        setNameError("Group name is required");
        return;
      }
      setNameError("");
    }

    setLoading(true);
    try {
      const createFn = groupType === "pool" ? createPoolGroup : createGroup;
      const joinFn = groupType === "pool" ? joinPoolGroup : joinGroup;
      const group = mode === "create" ? await createFn(name.trim(), emoji) : await joinFn(code.trim());
      if (group) onSuccess(group);
      else toast(mode === "create" ? "Failed to create group" : "Invalid code", "error");
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{
        background: "var(--bg-modal)",
        backdropFilter: "blur(16px) saturate(1.2)",
        WebkitBackdropFilter: "blur(16px) saturate(1.2)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl p-6 sm:p-8 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.93, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "var(--accent-gradient)" }}
        />
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            {mode === "create"
              ? groupType === "pool"
                ? "Create a Pool"
                : "Create a group"
              : groupType === "pool"
                ? "Join a Pool"
                : "Join a group"}
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-2 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {mode === "create" ? (
          <>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Group name</label>
              <input
                className="input"
                placeholder="Weekend crew, Roommates, Family…"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                autoFocus
              />
              {nameError && <p className="text-xs text-[var(--error)] mt-1">{nameError}</p>}
            </div>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Group icon</label>
              <div className="flex gap-2 flex-wrap">
                {GROUP_ICONS.map(({ emoji: e, label }) => (
                  <Tooltip key={e} content={label} delay={150}>
                    <button
                      onClick={() => setEmoji(e)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all"
                      style={{
                        background: emoji === e ? "var(--primary-subtle)" : "var(--bg-interactive)",
                        border: `1px solid ${emoji === e ? "var(--primary)" : "var(--border-subtle)"}`,
                      }}
                    >
                      {e}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "var(--primary-subtle)" }}
            >
              <UserPlus size={28} color="var(--primary)" strokeWidth={2} />
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4 font-medium">
              {groupType === "pool"
                ? "Enter the invite code for the pool"
                : "Enter the invite code from your friend or paste the invite link"}
            </p>
            <div className="relative">
              <input
                className="input w-full text-center font-mono text-xl tracking-[0.3em] uppercase"
                placeholder="a1b2c3d4"
                value={code}
                onChange={handleCodeChange}
                onPaste={(e) => {
                  e.preventDefault();
                  const extracted = extractInviteCode(e.clipboardData.getData("text"));
                  setCode(extracted);
                }}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                autoFocus
                maxLength={8}
                style={{
                  paddingRight: 48,
                  letterSpacing: "0.25em",
                }}
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors hover:bg-[var(--bg-interactive)]"
                style={{ color: "var(--text-tertiary)" }}
                title="Paste from clipboard"
              >
                <ClipboardPaste size={18} />
              </button>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-3">
              Code is 8 characters — letters and numbers only
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={handle}
            className="flex-[2]"
            disabled={mode === "create" && !name.trim()}
          >
            {mode === "create"
              ? groupType === "pool"
                ? "Create Pool"
                : "Create Group"
              : groupType === "pool"
                ? "Join Pool"
                : "Join Group"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

