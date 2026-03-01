"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, Zap } from "lucide-react";
import { useStore } from "@/store/useStore";
import Button from "@/components/ui/Button";
import { toast, ToastContainer } from "@/components/ui/Toast";

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { walletAddress, user, connectWallet, joinGroup, isConnecting } = useStore();
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  async function handleConnect() {
    try {
      await connectWallet();
    } catch {
      toast("Failed to connect wallet", "error");
    }
  }

  async function handleJoin() {
    // Validate code format: 8 alphanumeric characters
    if (!code || code.length !== 8 || !/^[a-z0-9]+$/.test(code)) {
      toast("Invalid invite code format", "error");
      return;
    }

    setJoining(true);
    try {
      const group = await joinGroup(code);
      if (group) {
        setJoined(true);
        // Route based on group type: pool groups → /pool/[id], splits → /group/[id]
        const route = group.type === "pool" ? `/pool/${group.id}` : `/group/${group.id}`;
        setTimeout(() => router.push(route), 1500);
      } else {
        toast("Invalid invite code", "error");
      }
    } catch {
      toast("Failed to join group", "error");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 120px)",
        padding: 24,
        textAlign: "center",
        position: "relative",
      }}
    >
      <div>
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            height: 400,
            background:
              "radial-gradient(ellipse, rgba(108, 92, 231, 0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "var(--primary-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          {joined ? (
            <span style={{ fontSize: 36 }}>🎉</span>
          ) : (
            <Users size={32} color="var(--primary)" />
          )}
        </div>

        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: 10,
          }}
        >
          {joined ? "You're in!" : "Join Group"}
        </h1>

        <p
          style={{
            color: "var(--text-secondary)",
            marginBottom: 8,
            maxWidth: 260,
            lineHeight: 1.5,
          }}
        >
          {joined
            ? "Redirecting to your group..."
            : "You've been invited to split expenses on StarkSplit."}
        </p>

        {!joined && (
          <div
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              marginBottom: 32,
              letterSpacing: "0.1em",
            }}
          >
            Code: {code}
          </div>
        )}

        {!joined && (
          <>
            {!walletAddress ? (
              <>
                <Button size="lg" loading={isConnecting} onClick={handleConnect} style={{ minWidth: 220, marginBottom: 12 }}>
                  Connect Wallet to Join
                </Button>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
                  Sign in with Google, Twitter, or passkeys
                </p>
              </>
            ) : (
              <Button size="lg" loading={joining} onClick={handleJoin} style={{ minWidth: 220 }}>
                Join Group
              </Button>
            )}
          </>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
