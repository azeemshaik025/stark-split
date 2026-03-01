"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Copy, Check, Droplets, ExternalLink } from "lucide-react";
import { useStore } from "@/store/useStore";
import { updateUserProfile } from "@/lib/supabase";
import { truncateAddress, copyToClipboard, formatBalance, getExplorerTxUrl } from "@/lib/utils";
import { CUSTOM_TOKEN_SYMBOL, NETWORK } from "@/lib/constants";
import { toast, ToastContainer } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";

export default function SettingsPage() {
  const router = useRouter();
  const { user, walletAddress, wallet, walletBalances, disconnectWallet, refreshBalances, refreshUser, setUserDisplayName } = useStore();

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");

  useEffect(() => {
    setDisplayName(user?.display_name ?? "");
  }, [user?.display_name]);

  // Auto-refresh balances on mount (independent fetcher — only needs walletAddress)
  useEffect(() => {
    if (walletAddress) {
      refreshBalances();
    }
  }, []);

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetTxHash, setFaucetTxHash] = useState<string | null>(null);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const newName = displayName.trim() || null;
    try {
      await updateUserProfile(user.id, { display_name: newName ?? undefined });
      setUserDisplayName(newName);
      await refreshUser();
      toast("Profile updated!", "success");
    } catch {
      toast("Failed to update", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!walletAddress) return;
    await copyToClipboard(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleFaucet() {
    if (!walletAddress) return;
    setFaucetLoading(true);
    setFaucetTxHash(null);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Faucet request failed", "error");
        return;
      }
      setFaucetTxHash(data.txHash);
      await refreshBalances();
      toast(`0.01 ${CUSTOM_TOKEN_SYMBOL} + 5 STRK sent!`, "success");
    } catch {
      toast("Faucet request failed", "error");
    } finally {
      setFaucetLoading(false);
    }
  }

  // Auth guard: if not connected, show connect prompt
  if (!walletAddress) {
    return (
      <div className="page-content flex flex-col items-center justify-center min-h-[60vh]">
        <div
          className="w-full max-w-md rounded-2xl p-8 sm:p-10 text-center"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">
            Connect your wallet
          </h2>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-[320px] mx-auto leading-relaxed mb-8">
            Sign in to access your settings.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn btn-primary w-full"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Settings</h1>
        <p style={{ color: "var(--text-secondary)" }}>Manage your profile and wallet</p>
      </div>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>Profile</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <Avatar user={user} size={56} showBorder={false} />
          <div>
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>{user?.display_name || truncateAddress(walletAddress ?? "", 4) || "Anonymous"}</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{truncateAddress(walletAddress ?? "")}</p>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
            Display name
          </label>
          <input
            className="input"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <Button size="sm" loading={saving} onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      {/* Wallet card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>Wallet</h2>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: 6 }}>Address</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <code style={{ fontSize: "0.875rem", color: "var(--text-secondary)", flex: 1, background: "var(--bg-interactive)", padding: "10px 14px", borderRadius: 10 }}>
              {truncateAddress(walletAddress ?? "", 10)}
            </code>
            <button onClick={handleCopy} className="btn btn-secondary btn-sm" style={{ padding: "10px 12px" }}>
              {copied ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
          {[
            { label: "STRK", value: walletBalances.strk },
            { label: CUSTOM_TOKEN_SYMBOL, value: walletBalances.customToken },
          ].map((b) => (
            <div key={b.label} style={{ textAlign: "center", padding: "12px", background: "var(--bg-interactive)", borderRadius: 10 }}>
              <p className="font-mono-nums" style={{ fontWeight: 700, marginBottom: 2 }}>
                {formatBalance(b.value)}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{b.label}</p>
            </div>
          ))}
        </div>

        <button onClick={() => refreshBalances()} className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: "100%", fontSize: "0.8125rem" }}>
          Refresh balances
        </button>
      </div>

      {/* Faucet card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>Testnet Faucet</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 16 }}>
          Get 0.01 {CUSTOM_TOKEN_SYMBOL} + 5 STRK sent to your connected wallet. One request per address per 24 hours.
        </p>
        <Button
          size="sm"
          loading={faucetLoading}
          onClick={handleFaucet}
          style={{ marginBottom: faucetTxHash ? 12 : 0 }}
        >
          <Droplets size={16} style={{ marginRight: 6 }} />
          Get testing funds
        </Button>
        {faucetTxHash && (
          <a
            href={getExplorerTxUrl(faucetTxHash, NETWORK)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", fontSize: "0.8125rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <ExternalLink size={14} />
            View on Explorer
          </a>
        )}
      </div>

      {/* Network card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 2 }}>
              {NETWORK === "mainnet" ? "Starknet Mainnet" : "Starknet Sepolia"}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              {NETWORK === "mainnet" ? "Mainnet" : "Testnet"}
            </p>
          </div>
          <span className="badge badge-active">Connected</span>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ borderColor: "rgba(255,71,87,0.15)" }}>
        <h2 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--error)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Danger Zone</h2>
        <Button variant="danger" onClick={() => { disconnectWallet(); router.push("/"); }}>
          <LogOut size={16} /> Disconnect Wallet
        </Button>
      </div>

      <ToastContainer />
    </div>
  );
}
