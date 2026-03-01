"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, TrendingUp } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getStakingPositionsForGroup } from "@/lib/supabase";
import { getLivePoolPosition } from "@/lib/starkzap";
import { ESTIMATED_APR } from "@/lib/constants";
import { formatAmount } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { toast, ToastContainer } from "@/components/ui/Toast";
import ConnectButton from "@/components/wallet/ConnectButton";
import Logo from "@/components/ui/Logo";
import GroupModal from "@/components/group/GroupModal";
import type { Group, StakingPosition } from "@/types";

export default function YieldPage() {
  const router = useRouter();
  const { poolGroups, walletAddress, user, wallet, fetchPoolGroups } = useStore();
  const [groupPositions, setGroupPositions] = useState<Record<string, StakingPosition[]>>({});
  const [modal, setModal] = useState<"create" | "join" | null>(null);
  const [livePosition, setLivePosition] = useState<{ rewards: string; staked: string; commissionPercent: number } | null>(null);

  useEffect(() => {
    if (walletAddress && user) fetchPoolGroups();
  }, [walletAddress, user]);

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

  // Fetch live rewards from chain (updates every 30s when user has positions)
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
  // Use live chain data for current user when available
  const myLiveStaked = livePosition ? parseFloat(livePosition.staked) : myActivePositions.reduce((s, p) => s + p.amount_staked, 0);
  const myLiveRewards = livePosition ? parseFloat(livePosition.rewards) : myActivePositions.reduce((s, p) => s + p.rewards_earned, 0);
  const othersStaked = activeOnly.filter((p) => p.user_id !== user?.id).reduce((s, p) => s + p.amount_staked, 0);
  const othersRewards = activeOnly.filter((p) => p.user_id !== user?.id).reduce((s, p) => s + p.rewards_earned, 0);
  const totalStaked = othersStaked + myLiveStaked;
  const totalRewards = othersRewards + myLiveRewards;
  const activePositions = activeOnly.length;

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
          <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-[320px] mx-auto leading-relaxed mb-8">
            Create or join a group pool to stake STRK and earn ~4.8% APR. All transactions are gasless.
          </p>
          <ConnectButton prominent />
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] mb-1">
          Yield Overview
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Pool staking across your groups
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="card-gradient-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full animate-pulse-dot bg-[var(--accent-green)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-green)]">
              Total staked
            </span>
          </div>
          <div className="font-mono-nums text-xl font-extrabold text-[var(--accent)]">
            {formatAmount(totalStaked)}
          </div>
          <div className="text-sm text-[var(--text-secondary)] mt-0.5">STRK</div>
        </div>

        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(0,230,118,0.06)",
            border: "1px solid rgba(0,230,118,0.12)",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Rewards earned
          </p>
          <div className="font-mono-nums text-xl font-extrabold text-[var(--accent-green)]">
            {formatAmount(totalRewards, 6)}
          </div>
          <div className="text-sm text-[var(--text-secondary)] mt-0.5">STRK</div>
        </div>

        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(108,92,231,0.06)",
            border: "1px solid rgba(108,92,231,0.12)",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Est. APR
          </p>
          <div className="font-mono-nums text-xl font-extrabold text-[var(--primary)]">
            ~{ESTIMATED_APR}%
          </div>
          <div className="text-sm text-[var(--text-secondary)] mt-0.5">
            {livePosition != null && livePosition.commissionPercent > 0
              ? `Net after ${livePosition.commissionPercent}% fee`
              : "Delegation"}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Active
          </p>
          <div className="font-mono-nums text-xl font-extrabold text-[var(--text-primary)]">
            {activePositions}
          </div>
          <div className="text-sm text-[var(--text-secondary)] mt-0.5">
            of {poolGroups.length} group{poolGroups.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-[var(--text-primary)]">Positions by Pool</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setModal("join")}>
            Join
          </Button>
          <Button size="sm" onClick={() => setModal("create")}>
            <Plus size={14} /> Create Pool
          </Button>
        </div>
      </div>

      {poolGroups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Sparkles size={32} color="var(--accent)" />
          </div>
          <h3 className="text-heading mb-2">No treasuries yet</h3>
          <p className="text-body-sm text-[var(--text-secondary)] mb-6 max-w-[220px] mx-auto">
            Create a treasury, contribute to the pool, and stake to start earning yield.
          </p>
          <Button onClick={() => setModal("create")}>
            <Plus size={16} /> Create a Pool
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {poolGroups.map((group) => {
            const positions = groupPositions[group.id] ?? [];
            const activePositionsInGroup = positions.filter((p) => p.status === "active");
            const totalGroupStaked = activePositionsInGroup.reduce((s, p) => s + p.amount_staked, 0);
            const myPos = user ? positions.find((p) => p.user_id === user.id) : null;

            return (
              <div
                key={group.id}
                className="pool-card flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => router.push(`/pool/${group.id}`)}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: "var(--bg-interactive)" }}
                >
                  {group.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[var(--text-primary)]">{group.name}</div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    Total:{" "}
                    <span className="font-mono-nums font-semibold text-[var(--accent)]">
                      {formatAmount(totalGroupStaked)} STRK
                    </span>
                    {myPos && (
                      <span className="text-[var(--text-tertiary)] ml-2">
                        · You: {formatAmount(myPos.amount_staked)} STRK
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {myPos ? (
                    <>
                      <div className="font-mono-nums text-sm font-bold text-[var(--accent-green)]">
                        +{formatAmount(myPos.rewards_earned, 6)} STRK
                      </div>
                      <Badge
                        variant={myPos.status === "active" ? "active" : "pending"}
                        className="mt-1"
                      >
                        {myPos.status === "exited"
                          ? "Withdrawn"
                          : myPos.status === "exit_pending"
                            ? "Exit pending"
                            : "Active"}
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="pending">Not staked</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
