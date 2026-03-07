"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, Copy, Check, Droplets, ExternalLink, RefreshCw, User, Wallet, Globe, AlertTriangle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { updateUserProfile } from "@/lib/supabase";
import { truncateAddress, copyToClipboard, formatBalance, getExplorerTxUrl } from "@/lib/utils";
import { CUSTOM_TOKEN_SYMBOL, NETWORK } from "@/lib/constants";
import { toast, ToastContainer } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";

export default function SettingsPage() {
  const router = useRouter();
  const {
    user,
    walletAddress,
    wallet,
    walletBalances,
    disconnectWallet,
    refreshBalances,
    refreshUser,
    setUserDisplayName,
  } = useStore();

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");

  useEffect(() => {
    setDisplayName(user?.display_name ?? "");
  }, [user?.display_name]);

  useEffect(() => {
    if (walletAddress) {
      refreshBalances();
    }
  }, []);

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetTxHash, setFaucetTxHash] = useState<string | null>(null);
  const [refreshingBalances, setRefreshingBalances] = useState(false);

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

  async function handleRefreshBalances() {
    setRefreshingBalances(true);
    await refreshBalances();
    setRefreshingBalances(false);
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

  if (!walletAddress) {
    return (
      <div className="page-content flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div className="connect-card w-full max-w-md text-center" initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <div className="text-5xl mb-5 relative z-10">🔐</div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2.5 text-[var(--text-primary)] relative z-10">
            Connect your wallet
          </h2>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-[320px] mx-auto leading-relaxed mb-8 relative z-10">
            Sign in to access your settings.
          </p>
          <button onClick={() => router.push("/dashboard")} className="btn btn-primary w-full relative z-10">
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ maxWidth: 640 }}>
      <motion.div className="mb-8" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}>
        <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] mb-1">
          Settings
        </h1>
        <p className="text-xs text-[var(--text-tertiary)]">Manage your profile and wallet</p>
      </motion.div>

      {/* Profile card */}
      <motion.div className="card mb-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--primary-subtle)" }}
          >
            <User size={14} color="var(--primary)" />
          </div>
          <h2 className="text-label" style={{ color: "var(--text-secondary)", margin: 0 }}>
            Profile
          </h2>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Avatar user={user} size={56} showBorder={false} />
          <div>
            <p className="font-bold text-base text-[var(--text-primary)]">
              {user?.display_name || truncateAddress(walletAddress ?? "", 4) || "Anonymous"}
            </p>
            <p className="text-sm text-[var(--text-secondary)] font-mono">
              {truncateAddress(walletAddress ?? "")}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
            Display name
          </label>
          <input
            className="input"
            placeholder="Your name (shown to group members)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>

        <Button size="sm" loading={saving} onClick={handleSave}>
          Save Changes
        </Button>
      </motion.div>

      {/* Wallet card */}
      <motion.div className="card mb-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,210,255,0.08)" }}
          >
            <Wallet size={14} color="var(--accent)" />
          </div>
          <h2 className="text-label" style={{ color: "var(--text-secondary)", margin: 0 }}>
            Wallet
          </h2>
        </div>

        <div className="mb-4">
          <p className="text-xs text-[var(--text-tertiary)] mb-2">Address</p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 font-mono text-sm px-3 py-2.5 rounded-xl"
              style={{
                background: "var(--bg-interactive)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {truncateAddress(walletAddress ?? "", 10)}
            </code>
            <button
              onClick={handleCopy}
              className="btn btn-secondary btn-sm"
              style={{ padding: "10px 12px" }}
              title="Copy full address"
            >
              {copied ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-3 pt-4 mb-3"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {[
            { label: "STRK Balance", value: walletBalances.strk, color: "var(--accent)" },
            { label: CUSTOM_TOKEN_SYMBOL, value: walletBalances.customToken, color: "var(--warning)" },
          ].map((b) => (
            <div
              key={b.label}
              className="text-center p-3 rounded-xl"
              style={{ background: "var(--bg-interactive)" }}
            >
              <p
                className="font-mono-nums font-bold text-lg"
                style={{ color: b.color, marginBottom: 2 }}
              >
                {formatBalance(b.value)}
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {b.label}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={handleRefreshBalances}
          className="btn btn-ghost btn-sm w-full"
          style={{ fontSize: "0.8125rem" }}
          disabled={refreshingBalances}
        >
          <RefreshCw size={13} className={refreshingBalances ? "animate-spin" : ""} />
          {refreshingBalances ? "Refreshing..." : "Refresh balances"}
        </button>
      </motion.div>

      {/* Faucet card (Sepolia only) */}
      {NETWORK !== "mainnet" && (
        <motion.div className="card mb-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(0,230,118,0.08)" }}
            >
              <Droplets size={14} color="var(--accent-green)" />
            </div>
            <h2 className="text-label" style={{ color: "var(--text-secondary)", margin: 0 }}>
              Testnet Faucet
            </h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Get test tokens sent to your connected wallet.{" "}
            <span className="font-semibold">One request per address per 24 hours.</span>
          </p>
          <div
            className="rounded-xl p-3 mb-4 flex items-start gap-2.5"
            style={{
              background: "rgba(0,230,118,0.06)",
              border: "1px solid rgba(0,230,118,0.15)",
            }}
          >
            <Check size={14} color="var(--accent-green)" style={{ marginTop: 2 }} />
            <p className="text-xs" style={{ color: "var(--accent-green)" }}>
              Sends <strong>0.01 {CUSTOM_TOKEN_SYMBOL}</strong> + <strong>5 STRK</strong> to your wallet
            </p>
          </div>
          <Button
            size="sm"
            loading={faucetLoading}
            onClick={handleFaucet}
          >
            <Droplets size={15} />
            Get testing funds
          </Button>
          {faucetTxHash && (
            <a
              href={getExplorerTxUrl(faucetTxHash, NETWORK)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm w-full mt-2"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.8125rem" }}
            >
              <ExternalLink size={13} />
              View on Explorer
            </a>
          )}
        </motion.div>
      )}

      {/* Network card */}
      <motion.div className="card mb-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--bg-interactive)" }}
          >
            <Globe size={14} color="var(--text-tertiary)" />
          </div>
          <h2 className="text-label" style={{ color: "var(--text-secondary)", margin: 0 }}>
            Network
          </h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">
              {NETWORK === "mainnet" ? "Starknet Mainnet" : "Starknet Sepolia"}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {NETWORK === "mainnet"
                ? "Live network — gasless via Cartridge"
                : "Testnet — gas required for custom token"}
            </p>
          </div>
          <span className="badge badge-active">Connected</span>
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        className="card"
        style={{ borderColor: "rgba(255,71,87,0.2)" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,71,87,0.08)" }}
          >
            <AlertTriangle size={14} color="var(--error)" />
          </div>
          <h2 className="text-label" style={{ color: "var(--error)", margin: 0 }}>
            Danger Zone
          </h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Disconnecting will sign you out of StarkSplit. Your groups and expenses are saved.
        </p>
        <Button
          variant="danger"
          onClick={() => {
            disconnectWallet();
            router.push("/");
          }}
        >
          <LogOut size={16} /> Disconnect Wallet
        </Button>
      </motion.div>

      <ToastContainer />
    </div>
  );
}
