"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TrendingUp, Copy, ArrowUpRight, ArrowDownLeft, Wallet, ChevronRight, CheckCircle2, Zap } from "lucide-react";
import { useStore } from "@/store/useStore";
import { truncateAddress, formatAmount, formatBalance, copyToClipboard } from "@/lib/utils";
import { getGroupCurrency, CUSTOM_TOKEN_SYMBOL, CUSTOM_TOKEN_DISPLAY_DECIMALS, STRK_DISPLAY_DECIMALS, ESTIMATED_APR } from "@/lib/constants";
import Avatar from "@/components/ui/Avatar";
import Skeleton, { CardSkeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { toast, ToastContainer } from "@/components/ui/Toast";
import ConnectButton from "@/components/wallet/ConnectButton";
import Logo from "@/components/ui/Logo";
import GroupModal from "@/components/group/GroupModal";
import type { Group } from "@/types";

// ── Time-aware greeting ───────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ── Group Card ────────────────────────────────────────────
function GroupCard({ group }: { group: Group }) {
  const { getUserBalance } = useStore();
  const balance = getUserBalance(group.id);
  const router = useRouter();
  const currency = getGroupCurrency(group.type);
  const decimals = currency !== "STRK" ? CUSTOM_TOKEN_DISPLAY_DECIMALS : STRK_DISPLAY_DECIMALS;

  const balanceColor = balance > 0 ? "var(--accent-green)" : balance < 0 ? "var(--error)" : "var(--text-tertiary)";
  const balanceLabel = balance > 0 ? "you're owed" : balance < 0 ? "you owe" : "All settled";
  const cardClass = balance < 0 ? "group-card-owe" : balance > 0 ? "group-card-owed" : "group-card-settled";

  return (
    <div
      className={`group-card ${cardClass}`}
      onClick={() => router.push(`/group/${group.id}`)}
    >
      <div className="group-card-emoji">
        {group.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[var(--text-primary)] truncate text-[0.9375rem] leading-tight">{group.name}</div>
        <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
          {group.member_count ?? 1} member{(group.member_count ?? 1) !== 1 ? "s" : ""}
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        {balance !== 0 ? (
          <>
            <span
              className="font-mono-nums text-sm font-bold"
              style={{ color: balanceColor }}
            >
              {balance > 0 ? "+" : "-"}{formatAmount(Math.abs(balance), decimals)}
            </span>
            <span className="text-[10px] font-medium" style={{ color: balanceColor, opacity: 0.7 }}>
              {balanceLabel}
            </span>
          </>
        ) : (
          <span className="text-xs font-medium" style={{ color: "var(--accent-green)", opacity: 0.7 }}>
            {balanceLabel}
          </span>
        )}
      </div>
      <ChevronRight size={16} style={{ color: "var(--text-tertiary)", opacity: 0.4, flexShrink: 0 }} />
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user, walletAddress, groups, isLoadingGroups, isLoadingBalances, walletBalances, fetchGroups, refreshUser, refreshBalances } = useStore();
  const [modal, setModal] = useState<"create" | "join" | null>(null);

  useEffect(() => {
    if (walletAddress) {
      refreshUser();
      refreshBalances();
    }
  }, [walletAddress, refreshUser, refreshBalances]);

  useEffect(() => {
    if (walletAddress && user) fetchGroups();
  }, [walletAddress, user, fetchGroups]);

  // If walletAddress is persisted but user is null, the session is stale — show connect CTA
  const needsReconnect = !!walletAddress && !user;


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
  const splitDecimals = CUSTOM_TOKEN_DISPLAY_DECIMALS; // Split groups use WBTC

  // Not connected or stale session — polished connect CTA
  if (!walletAddress || needsReconnect) {
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
  const netBalance = totalOwedToYou - totalYouOwe;
  const isSettled = netBalance === 0 && totalOwedToYou === 0 && totalYouOwe === 0;

  return (
    <div className="page-content" style={{ maxWidth: 720 }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <p className="text-[11px] font-semibold text-[var(--text-tertiary)] mb-0.5 tracking-widest uppercase">{getGreeting()}</p>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">{displayName}</h1>
            <button
              onClick={async () => {
                if (!walletAddress) return;
                await copyToClipboard(walletAddress);
                toast("Address copied!", "success");
              }}
              className="btn btn-ghost btn-sm p-1 rounded-lg"
              title="Copy address"
            >
              <Copy size={13} color="var(--text-tertiary)" />
            </button>
          </div>
        </div>
        <Link href="/settings" className="block rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]" aria-label="Go to settings">
          <Avatar user={user} size={38} showBorder={false} />
        </Link>
      </div>

      {/* Net balance hero */}
      <motion.div
        className="dash-balance-hero mb-5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="dash-balance-hero-inner">
          <div className="flex items-center gap-3">
            <div
              className="dash-balance-icon"
              style={{
                background: isSettled
                  ? "rgba(0,230,118,0.1)"
                  : netBalance >= 0
                    ? "rgba(0,230,118,0.1)"
                    : "rgba(255,71,87,0.1)",
              }}
            >
              {isSettled ? (
                <CheckCircle2 size={20} color="var(--accent-green)" />
              ) : netBalance >= 0 ? (
                <ArrowDownLeft size={20} color="var(--accent-green)" />
              ) : (
                <ArrowUpRight size={20} color="var(--error)" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-0.5">
                {isSettled ? "Status" : "Net balance"}
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className="font-mono-nums text-2xl font-extrabold leading-none"
                  style={{
                    color: isSettled
                      ? "var(--accent-green)"
                      : netBalance >= 0
                        ? "var(--accent-green)"
                        : "var(--error)",
                  }}
                >
                  {isSettled
                    ? "All settled"
                    : `${netBalance >= 0 ? "+" : "-"}${formatAmount(Math.abs(netBalance), splitDecimals)}`}
                </span>
                {!isSettled && (
                  <span className="text-xs font-semibold text-[var(--text-tertiary)]">{splitCurrency}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid — 2x2, animate as one unit */}
      <motion.div
        className="grid grid-cols-2 gap-3 mb-5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {[
          {
            bg: "rgba(0,230,118,0.1)",
            icon: <ArrowDownLeft size={14} color="var(--accent-green)" strokeWidth={2.5} />,
            label: "Owed to you",
            value: formatAmount(totalOwedToYou, splitDecimals),
            color: "var(--accent-green)",
            currency: splitCurrency,
            loading: false,
          },
          {
            bg: "rgba(255,71,87,0.1)",
            icon: <ArrowUpRight size={14} color="var(--error)" strokeWidth={2.5} />,
            label: "You owe",
            value: formatAmount(totalYouOwe, splitDecimals),
            color: "var(--error)",
            currency: splitCurrency,
            loading: false,
          },
          {
            bg: "var(--primary-subtle)",
            icon: <Wallet size={14} color="var(--primary)" strokeWidth={2.5} />,
            label: CUSTOM_TOKEN_SYMBOL,
            value: formatBalance(walletBalances.customToken),
            color: "var(--primary)",
            currency: null,
            loading: isLoadingBalances,
          },
          {
            bg: "rgba(34,211,238,0.1)",
            icon: <Wallet size={14} color="var(--accent)" strokeWidth={2.5} />,
            label: "STRK",
            value: formatBalance(walletBalances.strk),
            color: "var(--accent)",
            currency: null,
            loading: isLoadingBalances,
          },
        ].map((stat) => (
          <div key={stat.label} className="dash-stat">
            <div className="dash-stat-icon" style={{ background: stat.bg }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-0.5">{stat.label}</p>
              <span className="font-mono-nums text-[0.9375rem] font-bold inline-flex items-center" style={{ color: stat.color, minHeight: 18 }}>
                <AnimatePresence mode="wait">
                  {stat.loading ? (
                    <motion.span
                      key="skeleton"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Skeleton width={64} height={18} rounded />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="value"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {stat.value}
                      {stat.currency && (
                        <span className="text-[10px] font-semibold text-[var(--text-tertiary)]"> {stat.currency}</span>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Yield banner */}
      <motion.div
        className="dash-yield-banner mb-6"
        onClick={() => router.push("/pools")}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        whileHover={{ y: -1, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="dash-yield-icon">
            <TrendingUp size={16} color="var(--accent)" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
              Earn <span style={{ color: "var(--accent)" }}>~{ESTIMATED_APR}% APR</span> on STRK
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 truncate">Pool STRK with friends and earn staking yield</p>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
      </motion.div>

      {/* Groups section */}
      <div className="section-header">
        <h2 className="section-title">Your Groups</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setModal("join")}>
            Join
          </Button>
          <Button size="sm" onClick={() => setModal("create")}>
            <Plus size={14} /> Create
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoadingGroups ? (
          <motion.div
            key="groups-skeleton"
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </motion.div>
        ) : groups.length === 0 ? (
          <motion.div
            key="groups-empty"
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <div className="empty-state-icon">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-heading mb-2">No groups yet</h3>
            <p className="text-body-sm text-[var(--text-secondary)] mb-6 max-w-[240px] mx-auto">
              Create your first group to start splitting expenses with friends.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setModal("create")}>
                <Plus size={16} /> Create Group
              </Button>
              <Button variant="secondary" onClick={() => setModal("join")}>
                Join Group
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="groups-list"
            className="flex flex-col gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.12), ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <GroupCard group={group} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {modal && <GroupModal mode={modal} onClose={() => setModal(null)} onSuccess={handleGroupSuccess} />}
      <ToastContainer />
    </div>
  );
}
