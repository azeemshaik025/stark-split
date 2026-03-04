"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, ExternalLink, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { useStore } from "@/store/useStore";
import { truncateAddress, formatAmount, getSdkErrorMessage, getExplorerTxUrl, getAvatarGradient, getInitials } from "@/lib/utils";
import { CUSTOM_TOKEN_DISPLAY_DECIMALS, NETWORK, CUSTOM_TOKEN_SYMBOL } from "@/lib/constants";
import { toast, ToastContainer } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import type { TxStatus } from "@/types";

export default function SettlePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = params.id as string;

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const amountStr = searchParams.get("amount") ?? "0";
  const amount = parseFloat(amountStr);

  // Guard against NaN or invalid amounts
  if (isNaN(amount) || amount <= 0) {
    return (
      <div className="flex justify-center px-5 py-8 pb-16">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => router.back()} className="btn btn-ghost btn-sm p-2 rounded-lg">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">Error</h1>
          </div>
          <div className="card text-center p-8 mb-6">
            <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
              Invalid amount. Please go back and try again.
            </p>
          </div>
          <Button fullWidth onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { user, wallet, walletAddress, connectWallet, groupMembers, settleDebt, activeGroup, fetchGroupDetails } = useStore();
  const members = groupMembers[groupId] ?? [];

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const hasSettled = useRef(false);

  useEffect(() => {
    if (!members.length) {
      fetchGroupDetails(groupId);
    }
  }, [groupId, members.length, fetchGroupDetails]);

  const fromUser = members.find((m) => m.id === from);
  const toUser = members.find((m) => m.id === to);

  const isYouPaying = from === user?.id;

  const fromName = fromUser?.display_name ?? truncateAddress(from);
  const toName = toUser?.display_name ?? truncateAddress(to);

  async function handleSettle() {
    if (!wallet && walletAddress) {
      try {
        await connectWallet();
      } catch {
        toast("Could not restore session. Please connect your wallet again.", "error");
        return;
      }
    }
    const currentWallet = useStore.getState().wallet;
    if (!currentWallet) {
      toast("Connect your wallet first", "error");
      return;
    }
    if (hasSettled.current) return;
    hasSettled.current = true;

    setTxStatus("pending");
    try {
      const toAddress = toUser?.wallet_address;
      if (!toAddress) throw new Error("Recipient address not found");

      const { txHash: hash } = await settleDebt(
        groupId,
        { from, to, amount },
        toAddress
      );

      setTxHash(hash);
      setTxStatus("confirmed");

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6C5CE7", "#00D2FF", "#00E676"],
      });
    } catch (err) {
      setTxStatus("failed");
      const msg = getSdkErrorMessage(err);
      setErrorMsg(msg);
      if (process.env.NODE_ENV === "development") {
        console.error("[Settle] Transfer failed:", err);
      }
      hasSettled.current = false;
    }
  }

  function UserBubble({ userId, user: u, label }: { userId: string; user?: { display_name?: string | null; wallet_address?: string } | null; label?: string }) {
    const name = label ?? u?.display_name ?? truncateAddress(userId);
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: getAvatarGradient(userId),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            color: "white",
            margin: "0 auto 8px",
          }}
        >
          {getInitials(name)}
        </div>
        <p
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: userId === user?.id
              ? (isYouPaying && userId === from ? "var(--error)" : "var(--accent-green)")
              : "var(--text-primary)",
          }}
        >
          {name}
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center px-5 py-8 pb-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm p-2 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[var(--text-primary)]">Settle Up</h1>
            <p className="text-sm text-[var(--text-secondary)]">{activeGroup?.name ?? "Group"}</p>
          </div>
          <div>
            {NETWORK === "mainnet" ? (
              <span className="badge-gasless">
                <span className="badge-gasless-dot" />
                Gasless
              </span>
            ) : (
              <span className="badge-user-pays">
                Fee may apply
              </span>
            )}
          </div>
        </div>

        {/* Main card */}
        <div
          className="rounded-2xl mb-6 overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {txStatus === "confirmed" ? (
            <div className="p-8 text-center">
              <div
                className="settle-status-icon settle-status-icon-success"
                style={{ marginBottom: 20 }}
              >
                <CheckCircle size={36} color="var(--accent-green)" />
              </div>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: 6 }}>
                Settled! 🎉
              </h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: "0.9375rem" }}>
                Payment confirmed on Starknet
              </p>
              {txHash && (
                <a
                  href={getExplorerTxUrl(txHash, NETWORK)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ margin: "0 auto" }}
                >
                  View on explorer <ExternalLink size={12} />
                </a>
              )}
            </div>
          ) : txStatus === "failed" ? (
            <div className="p-8 text-center">
              <div className="settle-status-icon settle-status-icon-failed" style={{ marginBottom: 20 }}>
                <XCircle size={36} color="var(--error)" />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>
                Transaction Failed
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  marginBottom: 8,
                  fontSize: "0.875rem",
                }}
              >
                {errorMsg}
              </p>
              <p
                style={{
                  color: "var(--text-tertiary)",
                  fontSize: "0.75rem",
                  marginBottom: 4,
                }}
              >
                Ensure you have enough {CUSTOM_TOKEN_SYMBOL} and the recipient has connected their wallet.
              </p>
            </div>
          ) : (
            <>
              {/* Gradient header strip */}
              <div
                style={{
                  height: 4,
                  background: "linear-gradient(90deg, var(--primary), var(--accent))",
                }}
              />
              <div className="p-8 text-center">
                {/* Sender → Receiver */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    marginBottom: 32,
                  }}
                >
                  <UserBubble
                    userId={from}
                    user={fromUser}
                    label={isYouPaying ? "You" : fromName}
                  />

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "var(--primary-subtle)",
                        border: "1px solid rgba(99,102,241,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ArrowRight size={18} color="var(--primary)" />
                    </div>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", fontWeight: 600 }}>
                      pays
                    </span>
                  </div>

                  <UserBubble
                    userId={to}
                    user={toUser}
                    label={to === user?.id ? "You" : toName}
                  />
                </div>

                {/* Amount */}
                <div
                  className="font-mono-nums"
                  style={{
                    fontSize: "3.5rem",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: isYouPaying ? "var(--error)" : "var(--text-primary)",
                    lineHeight: 1,
                    marginBottom: 6,
                  }}
                >
                  {formatAmount(amount, CUSTOM_TOKEN_DISPLAY_DECIMALS)}
                </div>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    marginBottom: 20,
                    fontWeight: 600,
                  }}
                >
                  {CUSTOM_TOKEN_SYMBOL}
                </p>

                {txStatus === "pending" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      color: "var(--text-secondary)",
                      fontSize: "0.875rem",
                    }}
                  >
                    <svg
                      className="animate-spin"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span className="tx-pending">Confirming on Starknet...</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {txStatus === "idle" && isYouPaying && (
          <Button fullWidth size="lg" onClick={handleSettle} className="btn-gradient">
            Pay {formatAmount(amount, CUSTOM_TOKEN_DISPLAY_DECIMALS)} {CUSTOM_TOKEN_SYMBOL}
          </Button>
        )}

        {txStatus === "idle" && !isYouPaying && (
          <div style={{ textAlign: "center" }}>
            <div
              className="rounded-xl p-4 mb-4"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                This payment will be made by{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {fromUser?.display_name ?? truncateAddress(from)}
                </strong>
              </p>
            </div>
            <Button variant="secondary" fullWidth onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        )}

        {txStatus === "failed" && (
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" fullWidth onClick={() => router.back()}>
              Cancel
            </Button>
            <Button fullWidth onClick={handleSettle}>
              Retry
            </Button>
          </div>
        )}

        {txStatus === "confirmed" && (
          <Button
            fullWidth
            size="lg"
            onClick={() => router.push(`/group/${groupId}`)}
          >
            Back to Group
          </Button>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
