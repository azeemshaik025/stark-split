"use client";

import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Zap, AlertCircle, X, Wallet } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { ESTIMATED_APR, STAKING_CONTRACT_ADDRESS } from "@/lib/constants";
import { formatCooldownRemaining, isCooldownComplete } from "@/lib/utils";
import type { StakingPosition } from "@/types";

interface YieldDashboardProps {
  stakingPosition: StakingPosition | null;
  groupId: string;
  poolLiquid: number;
  poolCreatorWallet: string | undefined;
  isPoolCustodian: boolean;
  onContribute: (amount: string, poolAddress: string) => Promise<void>;
  onStake: (amount: string) => Promise<void>;
  onClaimRewards: () => Promise<void>;
  onUnstakeIntent?: (amount: string) => Promise<void>;
  onCompleteUnstake?: () => Promise<void>;
}

// Animated counting yield simulation
function useAnimatedYield(baseRewards: number, amountStaked: number) {
  const [yield_, setYield] = useState(baseRewards);

  useEffect(() => {
    if (!amountStaked) return;
    // Simulate real-time yield accrual (per second)
    const annualRate = ESTIMATED_APR / 100;
    const perSecond = (amountStaked * annualRate) / (365 * 24 * 3600);

    const interval = setInterval(() => {
      setYield((prev) => prev + perSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [amountStaked]);

  return yield_;
}

// Pool overview card (always shown)
function PoolOverview({
  poolLiquid,
  amountStaked,
}: {
  poolLiquid: number;
  amountStaked: number;
}) {
  const poolTotal = poolLiquid + amountStaked;
  return (
    <div className="card-gradient-border" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(0, 210, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Wallet size={20} color="var(--accent)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Pool Treasury</div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Everyone contributes STRK to the shared pool. The pool earns{" "}
            <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>~{ESTIMATED_APR}% APR</span> when staked.
            Settlements are paid from the pool.
          </p>
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Pool total</p>
              <span className="font-mono-nums" style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--accent)" }}>
                {poolTotal.toFixed(2)} STRK
              </span>
            </div>
            <div>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Liquid</p>
              <span className="font-mono-nums" style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                {poolLiquid.toFixed(2)} STRK
              </span>
            </div>
            <div>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Staked</p>
              <span className="font-mono-nums" style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--accent-green)" }}>
                {amountStaked.toFixed(2)} STRK
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function YieldDashboard({
  stakingPosition,
  groupId,
  poolLiquid,
  poolCreatorWallet,
  isPoolCustodian,
  onContribute,
  onStake,
  onClaimRewards,
  onUnstakeIntent,
  onCompleteUnstake,
}: YieldDashboardProps) {
  const [contributeAmount, setContributeAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [isContributing, setIsContributing] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCompletingUnstake, setIsCompletingUnstake] = useState(false);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [cooldownDisplay, setCooldownDisplay] = useState("");

  const isActive = stakingPosition?.status === "active";
  const isExitPending = stakingPosition?.status === "exit_pending";
  const canCompleteUnstake = isExitPending && isCooldownComplete(stakingPosition?.exit_intent_at ?? null);

  // Update cooldown display every minute when exit pending
  useEffect(() => {
    if (!isExitPending || !stakingPosition?.exit_intent_at) return;
    const update = () => setCooldownDisplay(formatCooldownRemaining(stakingPosition.exit_intent_at));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [isExitPending, stakingPosition?.exit_intent_at]);
  const amountStaked = stakingPosition?.amount_staked ?? 0;
  const animatedRewards = useAnimatedYield(
    stakingPosition?.rewards_earned ?? 0,
    amountStaked
  );

  async function handleContribute() {
    if (!poolCreatorWallet || !contributeAmount) return;
    setIsContributing(true);
    try {
      await onContribute(contributeAmount, poolCreatorWallet);
      setContributeAmount("");
    } finally {
      setIsContributing(false);
    }
  }

  async function handleStake() {
    const amount = stakeAmount || poolLiquid.toFixed(4);
    setIsStaking(true);
    try {
      await onStake(amount);
      setStakeAmount("");
    } finally {
      setIsStaking(false);
    }
  }

  async function handleClaim() {
    setIsClaiming(true);
    try {
      await onClaimRewards();
    } finally {
      setIsClaiming(false);
    }
  }

  async function handleUnstakeIntent() {
    if (!onUnstakeIntent) return;
    const amount = unstakeAmount || amountStaked.toFixed(4);
    setIsUnstaking(true);
    try {
      await onUnstakeIntent(amount);
      setShowUnstakeModal(false);
      setUnstakeAmount("");
    } finally {
      setIsUnstaking(false);
    }
  }

  async function handleCompleteUnstake() {
    if (!onCompleteUnstake) return;
    setIsCompletingUnstake(true);
    try {
      await onCompleteUnstake();
    } finally {
      setIsCompletingUnstake(false);
    }
  }

  // Not staked yet (no position or exited)
  const hasStakingPosition = isActive || isExitPending;
  if (!hasStakingPosition) {
    return (
      <div>
        <PoolOverview poolLiquid={poolLiquid} amountStaked={amountStaked} />

        {/* Contribute to pool — any member */}
        <div className="card" style={{ marginBottom: 16 }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 10 }}>
            Contribute to pool (STRK)
          </label>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input
              className="input"
              type="number"
              placeholder="0.00"
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
            />
          </div>
          <Button
            fullWidth
            loading={isContributing}
            onClick={handleContribute}
            disabled={!poolCreatorWallet || !contributeAmount || parseFloat(contributeAmount) <= 0}
          >
            <Wallet size={16} />
            Add to Pool
          </Button>
        </div>

        {/* Stake from pool — pool custodian only */}
        {isPoolCustodian && poolLiquid > 0 && (
          <div className="card">
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 10 }}>
              Stake pool funds (STRK)
            </label>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <input
                className="input"
                type="number"
                placeholder={poolLiquid.toFixed(2)}
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
              />
              <button
                className="btn btn-secondary btn-sm"
                style={{ flexShrink: 0 }}
                onClick={() => setStakeAmount(poolLiquid.toFixed(4))}
              >
                Max
              </button>
            </div>
            <Button fullWidth loading={isStaking} onClick={handleStake}>
              <Zap size={16} />
              Stake & Earn Yield
            </Button>
            <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textAlign: "center", marginTop: 10 }}>
              Gasless · Validator: {STAKING_CONTRACT_ADDRESS.slice(0, 8)}...{STAKING_CONTRACT_ADDRESS.slice(-6)}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Actively staked
  // Calculate progress bar percentage
  const progressPercent = amountStaked > 0
    ? (amountStaked / (poolLiquid + amountStaked)) * 100
    : 0;

  return (
    <div>
      <PoolOverview poolLiquid={poolLiquid} amountStaked={amountStaked} />
      {/* Main yield card */}
      <div className="card-gradient-border" style={{ marginBottom: 16 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isExitPending ? (
              <>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--warning)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--warning)",
                  }}
                >
                  Exit pending
                </span>
              </>
            ) : (
              <>
                <div
                  className="animate-pulse-dot"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--accent-green)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--accent-green)",
                  }}
                >
                  Earning live
                </span>
              </>
            )}
          </div>
          <Badge variant="active">
            ~{ESTIMATED_APR}% APR
          </Badge>
        </div>

        {/* Yield amount */}
        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Total rewards earned
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <Sparkles size={18} color="var(--accent)" />
            <span
              className="font-mono-nums"
              style={{
                fontSize: "2.25rem",
                fontWeight: 800,
                color: "var(--accent)",
                letterSpacing: "-0.02em",
              }}
            >
              {animatedRewards.toFixed(6)}
            </span>
            <span
              style={{ fontSize: "1rem", color: "var(--text-secondary)", fontWeight: 600 }}
            >
              STRK
            </span>
          </div>
        </div>

        {/* Staked amount */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 2 }}>
              Amount staked
            </p>
            <span className="font-mono-nums" style={{ fontWeight: 700 }}>
              {amountStaked.toFixed(2)} STRK
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 2 }}>
              Daily earnings
            </p>
            <span
              className="font-mono-nums"
              style={{ fontWeight: 700, color: "var(--accent-green)" }}
            >
              +{((amountStaked * ESTIMATED_APR) / (100 * 365)).toFixed(4)} STRK
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.75rem",
              color: "var(--text-tertiary)",
              marginBottom: 6,
            }}
          >
            <span>Staked</span>
            <span>{amountStaked.toFixed(2)} STRK</span>
          </div>
          <div
            style={{
              height: 4,
              background: "var(--bg-interactive)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.max(progressPercent, 1)}%`,
                background: "linear-gradient(90deg, #00D2FF, #6C5CE7)",
                borderRadius: 2,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      </div>

        {/* Add to pool — any member can still contribute */}
        {poolCreatorWallet && (
          <div className="card" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 10 }}>
              Add more to pool
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="input"
                type="number"
                placeholder="0.00"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button loading={isContributing} onClick={handleContribute} disabled={!contributeAmount || parseFloat(contributeAmount) <= 0}>
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!canCompleteUnstake && animatedRewards > 0.0001 && (
          <Button
            variant="secondary"
            fullWidth
            loading={isClaiming}
            onClick={handleClaim}
            style={{ borderColor: "rgba(0, 230, 118, 0.3)", color: "var(--accent-green)", flex: 1 }}
          >
            <TrendingUp size={16} />
            Claim Rewards
          </Button>
        )}
        {canCompleteUnstake ? (
          <Button
            fullWidth
            loading={isCompletingUnstake}
            onClick={handleCompleteUnstake}
            style={{ flex: 1 }}
          >
            <Zap size={16} />
            Complete Unstake
          </Button>
        ) : (
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setShowUnstakeModal(true)}
            disabled={!onUnstakeIntent || isExitPending}
            style={{ flex: 1 }}
          >
            <AlertCircle size={16} />
            {isExitPending ? "Exit in progress" : "Unstake"}
          </Button>
        )}
      </div>

      <p
        style={{
          fontSize: "0.75rem",
          color: "var(--text-tertiary)",
          textAlign: "center",
          marginTop: 12,
        }}
      >
        {canCompleteUnstake
          ? "Cooldown complete — claim your STRK"
          : isExitPending && cooldownDisplay
            ? `${cooldownDisplay} until you can complete`
            : "Unstaking has a 21-day cooldown period"}
      </p>

      {/* Unstake confirmation modal */}
      {showUnstakeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg-modal)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 24,
          }}
          onClick={() => !isUnstaking && setShowUnstakeModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: 400,
              width: "100%",
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Initiate Unstake</h3>
              <button
                onClick={() => !isUnstaking && setShowUnstakeModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
              Unstaking starts a 21-day cooldown. After 21 days, you can complete the unstake to receive your STRK back.
            </p>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
              Amount to unstake (STRK)
            </label>
            <input
              className="input"
              type="number"
              placeholder={amountStaked.toFixed(2)}
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" fullWidth onClick={() => setShowUnstakeModal(false)} disabled={isUnstaking}>
                Cancel
              </Button>
              <Button
                fullWidth
                loading={isUnstaking}
                onClick={handleUnstakeIntent}
                disabled={!unstakeAmount || parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > amountStaked}
              >
                Initiate Unstake
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
