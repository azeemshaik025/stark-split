"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import confetti from "canvas-confetti";
import { useStore } from "@/store/useStore";
import { truncateAddress, formatAmount, getSdkErrorMessage, getExplorerTxUrl } from "@/lib/utils";
import { CUSTOM_TOKEN_DISPLAY_DECIMALS } from "@/lib/constants";
import { toast, ToastContainer } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import type { TxStatus } from "@/types";
import { NETWORK, CUSTOM_TOKEN_SYMBOL } from "@/lib/constants";

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
  }, [groupId]);

  const fromUser = members.find((m) => m.id === from);
  const toUser = members.find((m) => m.id === to);

  const isYouPaying = from === user?.id;

  async function handleSettle() {
    // Restore wallet if we have walletAddress but wallet was lost (e.g. after refresh)
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

  return (
    <div className="flex justify-center px-5 py-8 pb-16">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm p-2 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">Settle Up</h1>
            <p className="text-sm text-[var(--text-secondary)]">{activeGroup?.name ?? "Group"}</p>
          </div>
          <div className="ml-auto">
            {NETWORK === "mainnet" ? (
              <span className="badge-gasless">
                <span className="badge-gasless-dot" />
                Gasless
              </span>
            ) : (
              <span className="badge-user-pays">
                Fee may apply (testnet)
              </span>
            )}
          </div>
        </div>

        <div className="card text-center p-8 mb-6">
          {txStatus === "confirmed" ? (
            <>
              {/* Success state */}
              <div className="settle-status-icon settle-status-icon-success">
                <CheckCircle size={36} color="var(--accent-green)" />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>
                Settled!
              </h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
                Payment confirmed on Starknet
              </p>
              {txHash && (
                <a
                  href={getExplorerTxUrl(txHash, NETWORK)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  View on explorer <ExternalLink size={12} />
                </a>
              )}
            </>
          ) : txStatus === "failed" ? (
            <>
              {/* Failed state */}
              <div className="settle-status-icon settle-status-icon-failed">
                <XCircle size={36} color="var(--error)" />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>
                Failed
              </h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: 8, fontSize: "0.875rem" }}>
                {errorMsg}
              </p>
              <p style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", marginBottom: 16 }}>
                Check that you have enough {CUSTOM_TOKEN_SYMBOL} and the recipient has connected their wallet.
              </p>
            </>
          ) : (
            <>
              {/* Payment preview */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  marginBottom: 28,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <Avatar user={fromUser ?? { id: from }} size={48} showBorder={false} />
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      marginTop: 6,
                      fontWeight: 600,
                      color: isYouPaying ? "var(--error)" : "var(--text-primary)",
                    }}
                  >
                    {isYouPaying ? "You" : fromUser?.display_name ?? truncateAddress(from)}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 1,
                      background: "var(--border-default)",
                    }}
                  />
                  <span
                    style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", fontWeight: 600 }}
                  >
                    pays
                  </span>
                  <div
                    style={{
                      width: 32,
                      height: 1,
                      background: "var(--border-default)",
                    }}
                  />
                </div>

                <div style={{ textAlign: "center" }}>
                  <Avatar user={toUser ?? { id: to }} size={48} showBorder={false} />
                  <p style={{ fontSize: "0.8125rem", marginTop: 6, fontWeight: 600 }}>
                    {to === user?.id ? "You" : toUser?.display_name ?? truncateAddress(to)}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div
                className="font-mono-nums"
                style={{
                  fontSize: "3rem",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  marginBottom: 8,
                }}
              >
                {formatAmount(amount, CUSTOM_TOKEN_DISPLAY_DECIMALS)}
              </div>
              <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
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
            <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
              This payment will be made by {fromUser?.display_name ?? truncateAddress(from)}
            </p>
            <Button variant="secondary" fullWidth onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        )}

        {txStatus === "failed" && (
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => router.back()}
            >
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
