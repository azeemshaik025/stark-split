"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getStakingPositionsForGroup } from "@/lib/supabase";
import { getLivePoolPosition } from "@/lib/starkzap";
import { ESTIMATED_APR } from "@/lib/constants";
import { formatAmount } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { toast, ToastContainer } from "@/components/ui/Toast";
import ConnectButton from "@/components/wallet/ConnectButton";
import Logo from "@/components/ui/Logo";
import GroupModal from "@/components/group/GroupModal";
import type { Group, StakingPosition } from "@/types";

export default function PoolsPage() {
  const router = useRouter();
  const { poolGroups, walletAddress, user, wallet, fetchPoolGroups, isLoadingPools } = useStore();
  const [groupPositions, setGroupPositions] = useState<Record<string, StakingPosition[]>>({});
  const [modal, setModal] = useState<"create" | "join" | null>(null);
  const [livePosition, setLivePosition] = useState<{
    rewards: string;
    staked: string;
    commissionPercent: number;
  } | null>(null);

  useEffect(() => {
    if (walletAddress && user) fetchPoolGroups();
  }, [walletAddress, user, fetchPoolGroups]);

  function handleGroupSuccess(group: Group) {
    setModal(null);
    toast(`"${group.name}" is ready!`, "success");
    router.push(`/pool/${group.id}`);
  }

  useEffect(() => {
    async function loadPositions() {
      const results: Record<string, StakingPosition[]> = {};
      await Promise.allSettled(
        poolGroups.map(async (g) => {
          const pos = await getStakingPositionsForGroup(g.id).catch(() => []);
          results[g.id] = pos as StakingPosition[];
        })
      );
      setGroupPositions(results);
    }
    if (poolGroups.length) loadPositions();
  }, [poolGroups]);

  // Fetch live rewards from chain (updates every 30s)
  useEffect(() => {
    if (!wallet || !poolGroups.length) {
      setLivePosition(null);
      return;
    }
    let cancelled = false;
    getLivePoolPosition(wallet).then((pos) => {
      if (!cancelled && pos) setLivePosition(pos);
    });
    const interval = setInterval(() => {
      getLivePoolPosition(wallet).then((pos) => {
        if (!cancelled && pos) setLivePosition(pos);
      });
    }, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [wallet, poolGroups.length]);

  const allPositions = Object.values(groupPositions).flat();
  const activeOnly = allPositions.filter((p) => p.status === "active");
  const myActivePositions = activeOnly.filter((p) => p.user_id === user?.id);
  const myLiveStaked = livePosition
    ? parseFloat(livePosition.staked)
    : myActivePositions.reduce((s, p) => s + p.amount_staked, 0);
  const myLiveRewards = livePosition
    ? parseFloat(livePosition.rewards)
    : myActivePositions.reduce((s, p) => s + p.rewards_earned, 0);
  const othersStaked = activeOnly.filter((p) => p.user_id !== user?.id).reduce((s, p) => s + p.amount_staked, 0);
  const othersRewards = activeOnly.filter((p) => p.user_id !== user?.id).reduce((s, p) => s + p.rewards_earned, 0);
  const totalStaked = othersStaked + myLiveStaked;
  const totalRewards = othersRewards + myLiveRewards;
  const activePositionCount = activeOnly.length;

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
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: "var(--accent-gradient)" }}
          />
          <div className="flex justify-center mb-6">
            <Logo href={null} size="xl" showText={false} />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">
            Connect to view yield
          </h2>
          <p
            className="text-[var(--text-secondary)] text-sm sm:text-base max-w-[320px] mx-auto leading-relaxed mb-8"
          >
            Create or join a group pool to stake STRK and earn ~{ESTIMATED_APR}% APR. All transactions are gasless.
          </p>
          <ConnectButton prominent />
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] mb-1">
          Yield Pools
        </h1>
        <p className="text-xs text-[var(--text-tertiary)]">
          Pool STRK with friends and earn staking rewards together
        </p>
      </div>

      {/* Stats — animate the entire grid as one unit for a clean entrance */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="card-gradient-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full animate-pulse-dot bg-[var(--accent)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
              Total staked
            </span>
          </div>
          <div className="font-mono-nums text-xl font-extrabold" style={{ color: "var(--accent)" }}>
            {formatAmount(totalStaked)}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-0.5">STRK</div>
        </div>

        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(0,230,118,0.06)",
            border: "1px solid rgba(0,230,118,0.12)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-green)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Rewards earned
            </span>
          </div>
          <div
            className="font-mono-nums text-xl font-extrabold yield-number"
            style={{ color: "var(--accent-green)" }}
          >
            +{formatAmount(totalRewards, 6)}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-0.5">STRK</div>
        </div>

        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(108,92,231,0.06)",
            border: "1px solid rgba(108,92,231,0.12)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={12} color="var(--primary)" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Est. APR
            </span>
          </div>
          <div className="font-mono-nums text-xl font-extrabold" style={{ color: "var(--primary)" }}>
            ~{ESTIMATED_APR}%
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-0.5">
            {livePosition != null && livePosition.commissionPercent > 0
              ? `Net after ${livePosition.commissionPercent}% fee`
              : "Delegation"}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={12} color="var(--text-tertiary)" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Active
            </span>
          </div>
          <div className="font-mono-nums text-xl font-extrabold text-[var(--text-primary)]">
            {activePositionCount}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-0.5">
            of {poolGroups.length} pool{poolGroups.length !== 1 ? "s" : ""}
          </div>
        </div>
      </motion.div>

      {/* Pools list header */}
      <div className="section-header">
        <h2 className="section-title">Your Pools</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setModal("join")}>
            Join
          </Button>
          <Button size="sm" onClick={() => setModal("create")}>
            <Plus size={14} /> New Pool
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoadingPools ? (
          <motion.div
            key="pools-skeleton"
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
        ) : poolGroups.length === 0 ? (
          <motion.div
            key="pools-empty"
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <div className="empty-state-icon">
              <Sparkles size={32} color="var(--accent)" />
            </div>
            <h3 className="text-heading mb-2">No pools yet</h3>
            <p className="text-body-sm text-[var(--text-secondary)] mb-6 max-w-[240px] mx-auto">
              Create a pool, contribute STRK, and start earning ~{ESTIMATED_APR}% APR through Starknet staking.
            </p>
            <Button onClick={() => setModal("create")}>
              <Plus size={16} /> Create a Pool
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="pools-list"
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
          {poolGroups.map((group, index) => {
            const positions = groupPositions[group.id] ?? [];
            const activePositionsInGroup = positions.filter((p) => p.status === "active");
            const totalGroupStaked = activePositionsInGroup.reduce((s, p) => s + p.amount_staked, 0);
            const myPos = user ? positions.find((p) => p.user_id === user.id) : null;

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.12), ease: [0.25, 0.46, 0.45, 0.94] }}
              >
              <div
                className="pool-card"
                onClick={() => router.push(`/pool/${group.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: "var(--bg-interactive)" }}
                  >
                    {group.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[var(--text-primary)] mb-0.5">
                      {group.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <span>
                        Pool:{" "}
                        <span className="font-mono-nums font-semibold" style={{ color: "var(--accent)" }}>
                          {formatAmount(totalGroupStaked)} STRK
                        </span>
                      </span>
                      {myPos && (
                        <span style={{ color: "var(--text-tertiary)" }}>
                          · Mine: {formatAmount(myPos.amount_staked)} STRK
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {myPos ? (
                      <div className="flex flex-col items-end gap-1">
                        <div
                          className="font-mono-nums text-sm font-bold"
                          style={{ color: "var(--accent-green)" }}
                        >
                          +{formatAmount(myPos.rewards_earned, 6)}
                        </div>
                        <Badge
                          variant={myPos.status === "active" ? "active" : "pending"}
                        >
                          {myPos.status === "exited"
                            ? "Withdrawn"
                            : myPos.status === "exit_pending"
                              ? "Exit pending"
                              : "Active"}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          ~{ESTIMATED_APR}% APR
                        </span>
                        <Badge variant="pending">Not staked</Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar for staked amount */}
                {totalGroupStaked > 0 && myPos && (
                  <div className="mt-3">
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill-green"
                        style={{
                          width: `${Math.min(100, (myPos.amount_staked / totalGroupStaked) * 100)}%`,
                          height: "100%",
                          borderRadius: 9999,
                          background: "linear-gradient(90deg, var(--accent-green), var(--accent))",
                          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                      Your share: {Math.round((myPos.amount_staked / totalGroupStaked) * 100)}% of pool
                    </p>
                  </div>
                )}
              </div>
              </motion.div>
            );
          })}
          </motion.div>
        )}
      </AnimatePresence>

      {modal && (
        <GroupModal
          mode={modal}
          groupType="pool"
          onClose={() => setModal(null)}
          onSuccess={handleGroupSuccess}
        />
      )}
      <ToastContainer />
    </div>
  );
}
