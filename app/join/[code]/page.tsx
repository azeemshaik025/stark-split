"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, ArrowRight, CheckCircle } from "lucide-react";
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
    if (!code || code.length !== 8 || !/^[a-z0-9]+$/.test(code)) {
      toast("Invalid invite code format", "error");
      return;
    }

    setJoining(true);
    try {
      const group = await joinGroup(code);
      if (group) {
        setJoined(true);
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
      className="fixed inset-0 flex flex-col items-center justify-center p-6"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          height: 500,
          background: "radial-gradient(ellipse, rgba(108,92,231,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center relative overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "var(--accent-gradient)" }}
        />
        {joined ? (
          <>
            {/* Success state */}
            <div
              className="settle-status-icon settle-status-icon-success"
              style={{ margin: "0 auto 20px" }}
            >
              <CheckCircle size={36} color="var(--accent-green)" />
            </div>
            <h1
              className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] mb-2"
            >
              You&apos;re in! 🎉
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Welcome to the group.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Redirecting...
            </div>
          </>
        ) : (
          <>
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "var(--primary-subtle)" }}
            >
              <Users size={30} color="var(--primary)" />
            </div>

            <h1
              className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] mb-2"
            >
              Join Group
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
              You&apos;ve been invited to split expenses on StarkSplit.
            </p>

            {/* Invite code display */}
            <div
              className="rounded-xl p-3 mb-6 mx-auto"
              style={{
                background: "var(--bg-interactive)",
                border: "1px solid var(--border-subtle)",
                maxWidth: 200,
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                Invite Code
              </p>
              <p
                className="font-mono-nums text-lg font-bold tracking-widest text-[var(--text-primary)]"
                style={{ letterSpacing: "0.2em" }}
              >
                {code.toUpperCase()}
              </p>
            </div>

            {!walletAddress ? (
              <div>
                <Button
                  size="lg"
                  fullWidth
                  loading={isConnecting}
                  onClick={handleConnect}
                  className="mb-3 btn-gradient"
                >
                  Connect Wallet to Join
                  <ArrowRight size={18} />
                </Button>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Sign in with Google, Twitter, or passkeys. No seed phrase needed.
                </p>
              </div>
            ) : (
              <div>
                {user && (
                  <p className="text-xs text-[var(--text-secondary)] mb-3">
                    Joining as{" "}
                    <strong className="text-[var(--text-primary)]">
                      {user.display_name ?? "you"}
                    </strong>
                  </p>
                )}
                <Button
                  size="lg"
                  fullWidth
                  loading={joining}
                  onClick={handleJoin}
                  className="btn-gradient"
                >
                  Join Group
                  <ArrowRight size={18} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
