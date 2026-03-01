"use client";

import { useState } from "react";
import { Share2, Copy, Check, Link2, X } from "lucide-react";
import { copyToClipboard, shareInviteLink } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface InviteShareProps {
  inviteCode: string;
  groupName: string;
  variant?: "button" | "dropdown" | "modal";
}

export default function InviteShare({
  inviteCode,
  groupName,
  variant = "button",
}: InviteShareProps) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}/join/${inviteCode}` : "";

  async function handleShare() {
    try {
      await shareInviteLink(inviteCode, groupName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowModal(false);
      setShowDropdown(false);
    } catch (err) {
      console.error("Share failed:", err);
      await handleCopyLink();
    }
  }

  async function handleCopyLink() {
    try {
      await copyToClipboard(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function handleCopyCode() {
    try {
      await copyToClipboard(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const sharedContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          padding: "12px 16px",
          borderRadius: 12,
          background: "var(--bg-interactive)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", fontWeight: 600, marginBottom: 4 }}>
          Invite link
        </p>
        <p
          style={{
            fontSize: "0.8125rem",
            fontFamily: "var(--font-mono), monospace",
            wordBreak: "break-all",
            color: "var(--text-primary)",
          }}
        >
          {url}
        </p>
      </div>
      <div
        style={{
          padding: "12px 16px",
          borderRadius: 12,
          background: "var(--bg-interactive)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", fontWeight: 600, marginBottom: 4 }}>
          Invite code
        </p>
        <p
          style={{
            fontSize: "1rem",
            fontFamily: "var(--font-mono), monospace",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "var(--text-primary)",
          }}
        >
          {inviteCode}
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button variant="secondary" onClick={handleShare} style={{ gap: 6, flex: "1 1 0", minWidth: 100 }}>
          <Share2 size={16} />
          Share
        </Button>
        <Button variant="secondary" onClick={handleCopyLink} style={{ gap: 6, flex: "1 1 0", minWidth: 100 }}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied!" : "Copy link"}
        </Button>
        <Button variant="ghost" onClick={handleCopyCode} style={{ gap: 6, flex: "1 1 0", minWidth: 100 }}>
          {copied ? <Check size={16} /> : <Link2 size={16} />}
          Copy code
        </Button>
      </div>
    </div>
  );

  if (variant === "modal") {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6 }}
        >
          <Share2 size={14} />
          Invite
        </button>
        {showModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: 24,
              overflowY: "auto",
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              className="card"
              style={{ maxWidth: 400, width: "100%", padding: 24, overflow: "visible" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Invite to {groupName}</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>
              {sharedContent}
            </div>
          </div>
        )}
      </>
    );
  }

  if (variant === "dropdown") {
    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6 }}
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          {copied ? "Copied!" : "Invite"}
        </button>
        {showDropdown && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 40 }}
              onClick={() => setShowDropdown(false)}
            />
            <div
              className="card"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 8,
                minWidth: 280,
                padding: 16,
                zIndex: 50,
              }}
            >
              {sharedContent}
            </div>
          </>
        )}
      </div>
    );
  }

  // Default: simple button that shares or copies
  return (
    <button
      onClick={handleShare}
      className="btn btn-secondary btn-sm"
      style={{ gap: 6 }}
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? "Copied!" : "Invite"}
    </button>
  );
}
