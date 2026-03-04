"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Wallet, ChevronDown, LogOut, Copy, Check } from "lucide-react";
import { useStore } from "@/store/useStore";
import { truncateAddress, copyToClipboard } from "@/lib/utils";
import { getAvatarGradient, getInitials } from "@/lib/utils";

interface ConnectButtonProps {
  compact?: boolean;
  /** When true, dropdown opens upward (for sidebar/bottom placement) */
  dropdownUp?: boolean;
  /** When true, use larger button for prominent CTA (e.g. dashboard connect state) */
  prominent?: boolean;
}

export default function ConnectButton({ compact = false, dropdownUp = false, prominent = false }: ConnectButtonProps) {
  const router = useRouter();
  const { wallet, walletAddress, user, isConnecting, connectionError, connectWallet, disconnectWallet } =
    useStore();

  // Session needs restore: we have persisted address but no wallet instance (Cartridge requires user click)
  const needsRestore = !!walletAddress && !wallet;

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const displayName =
    user?.display_name || truncateAddress(walletAddress ?? "", 4) || "Anonymous";
  const gradient = getAvatarGradient(walletAddress ?? "");
  const initials = getInitials(user?.display_name ?? walletAddress ?? "?");

  useEffect(() => {
    if (!menuOpen || !buttonRef.current || typeof document === "undefined") return;
    const rect = buttonRef.current.getBoundingClientRect();
    const base = {
      position: "fixed" as const,
      left: rect.left,
      minWidth: 220,
    };
    setDropdownStyle(
      dropdownUp
        ? { ...base, bottom: window.innerHeight - rect.top + 8 }
        : { ...base, top: rect.bottom + 8 }
    );
  }, [menuOpen, dropdownUp]);

  async function handleCopy() {
    if (!walletAddress) return;
    await copyToClipboard(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Not connected, or session needs restore (walletAddress persisted but wallet instance is null)
  if (!walletAddress || needsRestore) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <button
          className={`${prominent ? "btn btn-primary btn-lg" : "btn btn-primary btn-sm"}${prominent && !isConnecting ? " animate-glow-pulse" : ""}`}
          onClick={() => connectWallet()}
          disabled={isConnecting}
          style={{ gap: 8, minWidth: compact ? "auto" : prominent ? 200 : 140 }}
        >
          {isConnecting ? (
            <>
              <svg
                className="animate-spin"
                width={prominent ? 18 : 14}
                height={prominent ? 18 : 14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              {!compact && (needsRestore ? "Restoring..." : "Connecting...")}
            </>
          ) : (
            <>
              <Wallet size={prominent ? 18 : 14} />
              {compact ? "" : needsRestore ? "Restore session" : "Connect Wallet"}
            </>
          )}
        </button>
        {connectionError && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--error)",
              textAlign: "center",
              maxWidth: 280,
              lineHeight: 1.4,
            }}
          >
            {connectionError}
          </p>
        )}
      </div>
    );
  }

  // Connected — show avatar chip with dropdown
  return (
    <div style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        onClick={() => setMenuOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px 6px 6px",
          borderRadius: 10,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          cursor: "pointer",
          transition: "all 0.15s ease",
          color: "var(--text-primary)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--primary)";
        }}
        onMouseLeave={(e) => {
          if (!menuOpen)
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--border-default)";
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            fontWeight: 700,
            color: "white",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        {!compact && (
          <span
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              maxWidth: 100,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayName}
          </span>
        )}

        <ChevronDown
          size={12}
          color="var(--text-tertiary)"
          style={{
            transform: menuOpen ? "rotate(180deg)" : undefined,
            transition: "transform 0.15s ease",
          }}
        />
      </button>

      {/* Dropdown menu — rendered in portal to avoid overflow clipping */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 98 }}
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                <motion.div
                  style={{
                    ...dropdownStyle,
                    zIndex: 99,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 14,
                    boxShadow: "var(--shadow-modal)",
                    padding: 8,
                  }}
                  initial={{ opacity: 0, y: dropdownUp ? 6 : -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: dropdownUp ? 6 : -6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
            {/* Wallet address header */}
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid var(--border-subtle)",
                marginBottom: 4,
              }}
            >
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-tertiary)",
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Connected wallet
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <code
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                    flex: 1,
                  }}
                >
                  {truncateAddress(walletAddress, 6)}
                </code>
                <button
                  onClick={handleCopy}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-tertiary)",
                    padding: 2,
                  }}
                >
                  {copied ? (
                    <Check size={13} color="var(--accent-green)" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </div>
            </div>

            {/* Menu items */}
            <button
              onClick={() => {
                setMenuOpen(false);
                router.push("/settings");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "0.875rem",
                fontWeight: 500,
                textAlign: "left",
                transition: "all 0.1s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--bg-interactive)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "none";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-secondary)";
              }}
            >
              <Wallet size={15} />
              Settings
            </button>

            <button
              onClick={() => {
                setMenuOpen(false);
                disconnectWallet();
                router.push("/");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--error)",
                fontSize: "0.875rem",
                fontWeight: 500,
                textAlign: "left",
                transition: "all 0.1s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255, 71, 87, 0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "none";
              }}
            >
              <LogOut size={15} />
              Disconnect
            </button>
          </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
