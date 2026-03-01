"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, ChevronRight, TrendingUp, Copy } from "lucide-react";
import { useStore } from "@/store/useStore";
import { truncateAddress, formatAmount, formatBalance, copyToClipboard } from "@/lib/utils";
import { getGroupCurrency, CUSTOM_TOKEN_SYMBOL } from "@/lib/constants";
import Avatar from "@/components/ui/Avatar";
import { CardSkeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { toast, ToastContainer } from "@/components/ui/Toast";
import ConnectButton from "@/components/wallet/ConnectButton";
import Logo from "@/components/ui/Logo";
import GroupModal from "@/components/group/GroupModal";
import type { Group } from "@/types";

// ── Group Card ────────────────────────────────────────────
function GroupCard({ group }: { group: Group }) {
  const { getUserBalance } = useStore();
  const balance = getUserBalance(group.id);
  const router = useRouter();
  const currency = getGroupCurrency(group.type);
  const decimals = currency !== "STRK" ? 4 : 2;

  return (
    <div
      className="card card-interactive flex items-center gap-4 p-4 cursor-pointer"
      onClick={() => router.push(`/group/${group.id}`)}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: "var(--bg-interactive)" }}
      >
        {group.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[var(--text-primary)] truncate">{group.name}</div>
        <div className="text-sm text-[var(--text-secondary)]">
          {group.member_count ?? 1} member{(group.member_count ?? 1) !== 1 ? "s" : ""}
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span
          className="font-mono-nums text-sm font-bold"
          style={{
            color: balance > 0 ? "var(--accent-green)" : balance < 0 ? "var(--error)" : "var(--text-tertiary)",
          }}
        >
          {balance !== 0 ? `${balance > 0 ? "+" : ""}${formatAmount(Math.abs(balance), decimals)} ${currency}` : "Settled"}
        </span>
        <ChevronRight size={16} color="var(--text-tertiary)" />
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────
const STAT_CARD_TEXT_COLOR: Record<string, string> = {
  green: "var(--accent-green)",
  red: "var(--error)",
  cyan: "var(--accent)",
  purple: "var(--primary)",
};

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "green" | "red" | "cyan" | "purple";
}) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <p className="text-label mb-2">{label}</p>
      <span
        className="font-mono-nums text-lg font-bold block"
        style={{ color: STAT_CARD_TEXT_COLOR[color] }}
      >
        {value}
      </span>
      {sub && <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{sub}</p>}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user, walletAddress, groups, isLoadingGroups, walletBalances, fetchGroups, refreshUser, refreshBalances } = useStore();
  const [modal, setModal] = useState<"create" | "join" | null>(null);

  useEffect(() => {
    if (walletAddress) {
      refreshUser();
      refreshBalances();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress && user) fetchGroups();
  }, [walletAddress, user]);


  function handleGroupSuccess(group: Group) {
    setModal(null);
    toast(`"${group.name}" is ready!`, "success");
    router.push(`/group/${group.id}`);
  }

  // Select function directly — object selector causes infinite loop (new ref each render)
  const getUserBalance = useStore((s) => s.getUserBalance);
  const totalOwedToYou = groups.reduce((s, g) => {
    const b = getUserBalance(g.id);
    return s + (b > 0 ? b : 0);
  }, 0);
  const totalYouOwe = groups.reduce((s, g) => {
    const b = getUserBalance(g.id);
    return s + (b < 0 ? Math.abs(b) : 0);
  }, 0);
  // Split groups always use CUSTOM_TOKEN_SYMBOL
  const splitCurrency = CUSTOM_TOKEN_SYMBOL;
  const splitDecimals = 4;

  // Not connected — polished connect CTA
  if (!walletAddress) {
    return (
      <div className="page-content flex flex-col items-center justify-center min-h-[60vh]">
        <div
          className="w-full max-w-md rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* Subtle gradient accent */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: "var(--accent-gradient)" }}
          />
          <div className="flex justify-center mb-6">
            <Logo href={null} size="xl" showText={false} />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">
            Connect your wallet
          </h2>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-[320px] mx-auto leading-relaxed mb-8">
            Sign in with Google, Twitter, or passkeys. No wallet app or seed phrases needed — all transactions are gasless.
          </p>
          <div className="flex flex-col items-center gap-4">
            <ConnectButton prominent />
            <div className="flex flex-wrap justify-center gap-6 pt-2">
              {[
                { label: "Gasless", icon: "⚡" },
                { label: "Social login", icon: "🔐" },
                { label: "No seed phrase", icon: "✨" },
              ].map(({ label, icon }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <span>{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = user?.display_name ?? truncateAddress(walletAddress, 4);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">Good day,</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">{displayName}</h1>
            <button
              onClick={async () => {
                if (!walletAddress) return;
                await copyToClipboard(walletAddress);
                toast("Address copied!", "success");
              }}
              className="btn btn-ghost btn-sm p-1.5 rounded-lg"
              title="Copy address"
            >
              <Copy size={15} color="var(--text-tertiary)" />
            </button>
          </div>
        </div>
        <Link href="/settings" className="block rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]" aria-label="Go to settings">
          <Avatar user={user} size={44} showBorder={false} />
        </Link>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <StatCard label="Owed to you" value={`${formatAmount(totalOwedToYou, splitDecimals)} ${splitCurrency}`} color="green" />
        <StatCard label="You owe" value={`${formatAmount(totalYouOwe, splitDecimals)} ${splitCurrency}`} color="red" />
        <StatCard label={CUSTOM_TOKEN_SYMBOL} value={formatBalance(walletBalances.customToken)} color="purple" />
        <StatCard label="STRK balance" value={formatBalance(walletBalances.strk)} color="cyan" />
      </div>

      {/* Layout: groups + sidebar */}
      <div className="grid lg:grid-cols-[1fr,280px] gap-8 items-start">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Your Groups</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setModal("join")}>
                Join
              </Button>
              <Button size="sm" onClick={() => setModal("create")}>
                <Plus size={14} /> Create
              </Button>
            </div>
          </div>

          {isLoadingGroups ? (
            <div className="flex flex-col gap-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : groups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-heading mb-2">No groups yet</h3>
              <p className="text-body-sm text-[var(--text-secondary)] mb-6 max-w-[220px] mx-auto">
                Create your first group to start splitting expenses and earning yield.
              </p>
              <Button onClick={() => setModal("create")}>
                <Plus size={16} /> Create a Group
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-2">
              <Button fullWidth onClick={() => setModal("create")}>
                <Plus size={16} /> New Group
              </Button>
              <Button fullWidth variant="secondary" onClick={() => setModal("join")}>
                Join via Code
              </Button>
            </div>
          </div>

          <div className="card-gradient-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2 h-2 rounded-full animate-pulse-dot"
                style={{ background: "var(--accent-green)" }}
              />
              <span className="text-xs font-semibold text-[var(--accent-green)] uppercase tracking-wider">
                Group treasury
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
              Contribute to shared pools and earn <span className="font-bold text-[var(--accent)]">~4.8% APR</span>.
              Settlements paid from pool.
            </p>
            <Button variant="secondary" size="sm" fullWidth onClick={() => router.push("/yield")}>
              <TrendingUp size={14} /> View Yield
            </Button>
          </div>
        </div>
      </div>

      {modal && <GroupModal mode={modal} onClose={() => setModal(null)} onSuccess={handleGroupSuccess} />}
      <ToastContainer />
    </div>
  );
}
