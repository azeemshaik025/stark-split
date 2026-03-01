"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, TrendingUp, LogOut, ExternalLink, CheckCircle } from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  getGroupWithCreator,
  getGroupMembers,
  getStakingPositionsForGroup,
  upsertStakingPosition,
  updateStakingPositionStatus,
} from "@/lib/supabase";
import { stakeGroupFunds, exitStakingIntent, exitStakingAction, getLivePoolPosition } from "@/lib/starkzap";
import { ESTIMATED_APR, NETWORK } from "@/lib/constants";
import { formatAmount, truncateAddress, getSdkErrorMessage, isCooldownComplete, getInitials, getExplorerTxUrl } from "@/lib/utils";
import { toast, ToastContainer } from "@/components/ui/Toast";
import { AvatarGroup } from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import InviteShare from "@/components/group/InviteShare";
import type { Group, User, StakingPosition } from "@/types";

// Nethermind validator staker address (matches lib/starkzap.ts)
const DEFAULT_VALIDATOR = "0x05c85dd30df86ed1f2cfe1806417efb2cae421bffdee8110a74a3d3eb95b28d3";

function getMemberDisplayName(u: User | { user?: User } | null): string {
  if (!u) return "";

  let user: User | undefined;
  if ("user" in u) {
    user = u.user;
  } else {
    user = u as User;
  }

  if (!user) return "";
  const name = user.display_name?.trim();
  if (name && name.length > 3) return name;
  return truncateAddress(user.wallet_address ?? "");
}

export default function PoolPage() {
  const params = useParams();
  const router = useRouter();
  const poolId = params.id as string;

  const { user, wallet, walletAddress, connectWallet } = useStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [positions, setPositions] = useState<StakingPosition[]>([]);
  const [stakeAmount, setStakeAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [livePosition, setLivePosition] = useState<{ rewards: string; staked: string; commissionPercent: number } | null>(null);

  const myPosition = positions.find((p) => p.user_id === user?.id);
  const activePositions = positions.filter((p) => p.status === "active");
  const totalStaked = activePositions.reduce((s, p) => s + p.amount_staked, 0);
  // Use live rewards for current user when available, else DB
  const myRewardsNum =
    livePosition?.rewards != null
      ? parseFloat(livePosition.rewards)
      : (myPosition?.rewards_earned ?? 0);
  const totalRewards =
    activePositions.reduce((s, p) => s + p.rewards_earned, 0) -
    (myPosition?.rewards_earned ?? 0) +
    myRewardsNum;

  useEffect(() => {
    async function load() {
      try {
        const [g, mems, pos] = await Promise.all([
          getGroupWithCreator(poolId),
          getGroupMembers(poolId),
          getStakingPositionsForGroup(poolId),
        ]);
        setGroup(g as Group);
        setMembers(
          ((mems as unknown) as { user_id: string; users: Array<any> }[])
            .map((m) => {
              if (m.users && m.users.length > 0) {
                const user = m.users[0];
                return { ...user, id: m.user_id } as unknown as User;
              }
              return null;
            })
            .filter(Boolean) as User[]
        );
        setPositions(
          (pos as (StakingPosition & { user: User })[]).map((p) => ({
            ...p,
            user: p.user,
          }))
        );
      } catch (err) {
        console.error(err);
        toast("Failed to load pool", "error");
      }
    }
    load();
  }, [poolId]);

  // Fetch live rewards from chain for current user (updates dynamically)
  useEffect(() => {
    if (!wallet || !myPosition || myPosition.status !== "active") {
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
    }, 30_000); // Refresh every 30s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [wallet, myPosition?.id, myPosition?.status]);

  async function handleStake() {
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
    const amount = parseFloat(stakeAmount);
    if (!user || !amount || amount <= 0) return;
    if (amount > 1000) {
      toast("Max 1000 STRK for demo", "error");
      return;
    }

    setLoading(true);
    setLastTxHash(null);
    try {
      const txHash = await stakeGroupFunds(currentWallet, stakeAmount);
      await upsertStakingPosition(poolId, user.id, DEFAULT_VALIDATOR, amount);
      setLastTxHash(txHash ?? null);
      toast("Staked successfully!", "success");
      setStakeAmount("");
      const pos = await getStakingPositionsForGroup(poolId);
      setPositions(pos as StakingPosition[]);
    } catch (err) {
      toast(getSdkErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
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
    if (!user || !myPosition) return;

    setWithdrawing(true);
    setLastTxHash(null);
    try {
      let txHash: string | undefined;
      if (myPosition.status === "exit_pending") {
        if (!isCooldownComplete(myPosition.exit_intent_at)) {
          toast("21-day cooldown not complete yet", "error");
          setWithdrawing(false);
          return;
        }
        txHash = await exitStakingAction(currentWallet);
        await updateStakingPositionStatus(myPosition.id, "exited");
        setLastTxHash(txHash ?? null);
        toast("Withdrawn!", "success");
      } else {
        txHash = await exitStakingIntent(currentWallet, String(myPosition.amount_staked));
        await updateStakingPositionStatus(myPosition.id, "exit_pending", new Date().toISOString());
        setLastTxHash(txHash ?? null);
        toast("Exit initiated. Withdraw in 21 days.", "success");
      }
      const pos = await getStakingPositionsForGroup(poolId);
      setPositions(pos as StakingPosition[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Wallet already initiated exit on-chain but our DB was stale — sync state
      if (msg.includes("already in process to exit pool") && myPosition.status === "active") {
        // Use 21 days ago so "Complete withdrawal" shows if cooldown passed; else chain will reject
        const exitIntentDate = new Date();
        exitIntentDate.setDate(exitIntentDate.getDate() - 21);
        await updateStakingPositionStatus(myPosition.id, "exit_pending", exitIntentDate.toISOString());
        const pos = await getStakingPositionsForGroup(poolId);
        setPositions(pos as StakingPosition[]);
        toast("Exit already initiated. Complete withdrawal after 21-day cooldown.", "success");
      } else {
        toast(getSdkErrorMessage(err), "error");
      }
    } finally {
      setWithdrawing(false);
    }
  }

  if (!user) {
    return (
      <div className="page-content flex items-center justify-center min-h-[40vh]">
        <p className="text-[var(--text-secondary)]">Connect wallet to view pool</p>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ maxWidth: 640 }}>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push("/yield")}
            className="btn btn-ghost btn-sm p-2 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          {group?.invite_code && (
            <InviteShare
              inviteCode={group.invite_code}
              groupName={group.name ?? "Pool"}
              variant="modal"
            />
          )}
        </div>

        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ background: "var(--bg-interactive)" }}
          >
            {group?.emoji ?? "💰"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] mb-2">
              {group?.name ?? "Loading..."}
            </h1>
            <div className="flex items-center gap-2">
              <AvatarGroup users={members} size={26} max={5} />
              <span className="text-sm text-[var(--text-secondary)]">
                {members.length} member{members.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Total staked summary */}
        <div
          className="mt-6 p-5 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(0,210,255,0.08), rgba(108,92,231,0.08))",
            border: "1px solid rgba(0,210,255,0.2)",
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-[var(--text-secondary)]">Total staked</span>
            <span className="font-mono-nums text-xl font-bold text-[var(--accent)]">
              {formatAmount(totalStaked)} STRK
            </span>
          </div>
          <div className="flex justify-between items-center text-sm text-[var(--text-tertiary)]">
            <span>
              {livePosition != null && livePosition.commissionPercent > 0
                ? `~${ESTIMATED_APR}% APR (${livePosition.commissionPercent}% fee)`
                : `~${ESTIMATED_APR}% APR`}
            </span>
            <span>Rewards: +{formatAmount(totalRewards, 6)} STRK</span>
          </div>
        </div>
      </div>

      {/* Members & their staked amounts */}
      <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">Staking by member</h2>
      <div className="flex flex-col gap-2 mb-8">
        {members.map((member) => {
          const pos = positions.find((p) => p.user_id === member.id);
          const isYou = member.id === user.id;
          const name = getMemberDisplayName(member);

          return (
            <div
              key={member.id}
              className="card flex items-center gap-4 p-4"
              style={{
                borderColor: isYou ? "rgba(108,92,231,0.3)" : undefined,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "var(--bg-interactive)", color: "var(--text-primary)" }}
              >
                {getInitials(isYou ? "You" : name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--text-primary)]">
                  {isYou ? "You" : name}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  {pos ? (
                    <span className="font-mono-nums text-[var(--accent)]">
                      {pos.user_id === user?.id && livePosition
                        ? formatAmount(livePosition.staked)
                        : formatAmount(pos.amount_staked)}{" "}
                      STRK staked
                    </span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">Not staked</span>
                  )}
                </div>
              </div>
              {pos && (
                <div className="text-right shrink-0">
                  <div className="text-xs text-[var(--accent-green)] font-mono-nums">
                    +{formatAmount(pos.user_id === user?.id ? myRewardsNum : pos.rewards_earned, 6)} rewards
                  </div>
                  <Badge
                    variant={pos.status === "exit_pending" ? "pending" : "active"}
                    className="mt-1"
                  >
                    {pos.status === "exit_pending"
                      ? isCooldownComplete(pos.exit_intent_at)
                        ? "Ready to withdraw"
                        : "Exit pending"
                      : "Active"}
                  </Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Success: View on explorer */}
      {lastTxHash && (
        <div
          className="card p-4 mb-4 flex items-center justify-between gap-4"
          style={{
            background: "rgba(0, 230, 118, 0.06)",
            border: "1px solid rgba(0, 230, 118, 0.2)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(0, 230, 118, 0.15)" }}
            >
              <CheckCircle size={20} color="var(--accent-green)" />
            </div>
            <div>
              <p className="font-semibold text-[var(--accent-green)]">Transaction confirmed</p>
              <p className="text-xs text-[var(--text-secondary)]">View on Starknet explorer</p>
            </div>
          </div>
          <a
            href={getExplorerTxUrl(lastTxHash, NETWORK)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            View on explorer <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* Stake / Withdraw */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Your position</h3>
        {myPosition ? (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Staked</span>
              <span className="font-mono-nums font-bold">
                {livePosition ? formatAmount(livePosition.staked) : formatAmount(myPosition.amount_staked)} STRK
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Rewards</span>
              <span className="font-mono-nums font-bold text-[var(--accent-green)]">
                +{formatAmount(myRewardsNum, 6)} STRK
              </span>
            </div>
            {NETWORK === "sepolia" && (
              <p className="text-xs text-[var(--text-tertiary)] mb-2">
                Testnet: You pay gas (STRK). Ensure you have STRK for fees.
              </p>
            )}
            <Button
              variant="danger"
              fullWidth
              loading={withdrawing}
              onClick={handleWithdraw}
              disabled={myPosition.status === "exit_pending" && !isCooldownComplete(myPosition.exit_intent_at)}
            >
              <LogOut size={16} />
              {myPosition.status === "exit_pending"
                ? isCooldownComplete(myPosition.exit_intent_at)
                  ? "Complete withdrawal"
                  : "Withdraw in 21 days"
                : "Initiate withdrawal"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                Amount to stake (STRK)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={stakeAmount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, "");
                  const m = v.match(/^\d*\.?\d{0,4}/);
                  if (m) setStakeAmount(m[0]);
                }}
                className="input w-full font-mono text-lg"
              />
            </div>
            <Button
              fullWidth
              loading={loading}
              onClick={handleStake}
              disabled={!stakeAmount || parseFloat(stakeAmount) <= 0}
            >
              <TrendingUp size={16} /> Stake STRK
            </Button>
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
