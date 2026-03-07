"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import Logo from "@/components/ui/Logo";
import { ESTIMATED_APR } from "@/lib/constants";
import { Zap, Shield, TrendingUp, ArrowRight, Bitcoin, Wallet, Users, Sparkles } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Users,
    title: "Create a group",
    description: "Invite friends with a link. No signup for them — just connect with Google or passkeys.",
  },
  {
    number: "02",
    icon: Bitcoin,
    title: "Add expenses",
    description: "Split equally or custom in Bitcoin-on-Starknet. Track who paid what automatically.",
  },
  {
    number: "03",
    icon: Zap,
    title: "Settle gasless",
    description: `Pay debts with zero gas on mainnet. STRK pools earn ~${ESTIMATED_APR}% APR while debts stay open.`,
  },
];

const FEATURES = [
  {
    icon: Bitcoin,
    color: "var(--warning)",
    bg: "rgba(255,184,0,0.08)",
    border: "rgba(255,184,0,0.18)",
    title: "Bitcoin-on-Starknet",
    description: "Split expenses in WBTC — the Bitcoin experience on Starknet's blazing fast L2.",
  },
  {
    icon: TrendingUp,
    color: "var(--accent)",
    bg: "rgba(0,210,255,0.08)",
    border: "rgba(0,210,255,0.18)",
    title: `~${ESTIMATED_APR}% APR Yield`,
    description: "Pool STRK together with friends and earn staking yield while your group debts are open.",
  },
  {
    icon: Zap,
    color: "var(--primary)",
    bg: "var(--primary-subtle)",
    border: "rgba(99,102,241,0.18)",
    title: "Gasless on Mainnet",
    description: "Powered by Cartridge Controller. Sign in with Google — no seed phrases, no gas fees.",
  },
];

function FadeInSection({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden relative">
      <div className="fixed inset-0 bg-[var(--bg-base)]" />
      <div className="fixed inset-0 bg-grid opacity-[0.3] pointer-events-none" />
      <div className="fixed inset-0 bg-mesh-hero pointer-events-none" />

      {/* Nav */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8 py-3.5"
        style={{
          backdropFilter: "blur(20px) saturate(1.2)",
          WebkitBackdropFilter: "blur(20px) saturate(1.2)",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--nav-bg)",
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Logo href="/dashboard" size="md" />
        <div className="flex items-center gap-3">
          <ThemeToggle compact />
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              Launch app
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-16 text-center">
        <div className="relative z-10 max-w-[720px] mx-auto">
          {/* Live badge */}
          <motion.div
            className="inline-flex items-center gap-2.5 mb-7 px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest"
            style={{
              background: "var(--primary-subtle)",
              color: "var(--primary)",
              border: "1px solid rgba(99,102,241,0.18)",
              boxShadow: "0 4px 20px rgba(99,102,241,0.08)",
            }}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse-dot" />
            Bitcoin-on-Starknet · Zero Gas
          </motion.div>

          <motion.h1
            className="font-extrabold leading-[1.05] tracking-tight mb-7"
            style={{ color: "var(--text-primary)", fontSize: "clamp(2.5rem, 7vw, 4rem)" }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Split bills in{" "}
            <span className="text-gradient-animated">Bitcoin.</span>
            <br />
            Earn yield on{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              STRK.
            </span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl font-normal leading-relaxed mb-10 max-w-[540px] mx-auto"
            style={{ color: "var(--text-secondary)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Group expense splitting on Starknet. Gasless settlements with Bitcoin-on-Starknet. Idle funds stake for yield.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="glow-ring rounded-[14px]"
            >
              <Link href="/dashboard" className="btn btn-gradient btn-lg min-w-[220px]">
                Get started free
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust row — floating stats */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.34 }}
          >
            {[
              { label: "Gasless on mainnet", icon: Zap, color: "var(--primary)" },
              { label: "Social login", icon: Shield, color: "var(--accent-green)" },
              { label: `~${ESTIMATED_APR}% APR`, icon: TrendingUp, color: "var(--accent)" },
              { label: "No seed phrase", icon: Sparkles, color: "var(--warning)" },
            ].map(({ label, icon: Icon, color }, i) => (
              <motion.span
                key={label}
                className="floating-stat"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36 + i * 0.06 }}
              >
                <Icon size={14} color={color} strokeWidth={2} />
                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 sm:py-28 px-6">
        <div className="section-divider" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <FadeInSection>
            <p className="text-label mb-3 text-center" style={{ color: "var(--primary)" }}>Why StarkSplit</p>
            <h2
              className="text-display text-center font-extrabold tracking-tight mb-16"
              style={{ color: "var(--text-primary)" }}
            >
              Built different.
            </h2>
          </FadeInSection>

          <div className="grid sm:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <FadeInSection key={feature.title} delay={i * 0.08}>
                  <motion.div
                    className="feature-card flex flex-col gap-5 h-full"
                    whileHover={{ y: -4, transition: { duration: 0.25 } }}
                  >
                    <motion.div
                      className="icon-container"
                      style={{ background: feature.bg, border: `1px solid ${feature.border}` }}
                    >
                      <Icon size={22} color={feature.color} />
                    </motion.div>
                    <div>
                      <h3
                        className="font-bold text-base mb-2.5"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                </FadeInSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-24 sm:py-28 px-6">
        <div className="section-divider" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <div className="max-w-3xl mx-auto relative z-10">
          <FadeInSection>
            <p className="text-label mb-3 text-center" style={{ color: "var(--accent)" }}>How it works</p>
            <h2
              className="text-display text-center font-extrabold tracking-tight mb-16"
              style={{ color: "var(--text-primary)" }}
            >
              Three steps to zero debt.
            </h2>
          </FadeInSection>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <FadeInSection key={step.number} delay={i * 0.1}>
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3.5">
                      <motion.span
                        className="step-number"
                        style={{ width: 32, height: 32, fontSize: "0.875rem" }}
                        whileHover={{ scale: 1.1, transition: { duration: 0.15 } }}
                      >
                        {step.number}
                      </motion.span>
                      <div
                        className="icon-container"
                        style={{
                          background: "var(--primary-subtle)",
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                        }}
                      >
                        <Icon size={16} color="var(--primary)" strokeWidth={2} />
                      </div>
                    </div>
                    <h3 className="text-heading-sm" style={{ color: "var(--text-primary)" }}>
                      {step.title}
                    </h3>
                    <p
                      className="text-body-sm leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {step.description}
                    </p>
                  </div>
                </FadeInSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Starknet modules */}
      <section className="relative py-16 px-6">
        <div className="section-divider" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <div className="max-w-3xl mx-auto relative z-10 pt-4">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Wallets", desc: "Cartridge Controller social login", icon: Wallet, color: "var(--primary)" },
              { label: "Gasless", desc: "Built-in paymaster — zero gas on mainnet", icon: Zap, color: "var(--accent-green)" },
              { label: "Staking", desc: "STRK delegation pool yield", icon: TrendingUp, color: "var(--accent)" },
            ].map(({ label, desc, icon: Icon, color }, i) => (
              <FadeInSection key={label} delay={i * 0.06}>
                <motion.div
                  className="rounded-xl p-5 flex items-start gap-3.5"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                  whileHover={{
                    borderColor: color,
                    y: -2,
                    boxShadow: "var(--shadow-sm)",
                    transition: { duration: 0.2 },
                  }}
                >
                  <div
                    className="icon-container flex-shrink-0"
                    style={{
                      background: "var(--bg-interactive)",
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                    }}
                  >
                    <Icon size={18} color={color} />
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                      {label}
                    </div>
                    <div className="text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>
                      {desc}
                    </div>
                  </div>
                </motion.div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6">
        <div className="section-divider" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <FadeInSection className="max-w-lg mx-auto text-center relative z-10">
          <h2
            className="text-display font-extrabold tracking-tight mb-5"
            style={{ color: "var(--text-primary)" }}
          >
            Ready to split?
          </h2>
          <p className="text-lg mb-10 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Start splitting in Bitcoin. Start earning yield. Zero gas required.
          </p>
          <motion.div
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex glow-ring rounded-[14px]"
          >
            <Link href="/dashboard" className="btn btn-gradient btn-lg inline-flex">
              Launch StarkSplit
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </FadeInSection>
      </section>

      {/* Footer */}
      <section className="relative py-10 px-6">
        <div className="section-divider" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <div className="max-w-2xl mx-auto text-center relative z-10 pt-2">
          <p className="text-caption" style={{ color: "var(--text-tertiary)" }}>
            Powered by{" "}
            <a
              href="https://starknet.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--primary)] transition-colors font-semibold"
            >
              Starknet
            </a>
            {" · "}
            <a
              href="https://cartridge.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--primary)] transition-colors font-semibold"
            >
              Cartridge
            </a>
            {" · "}
            <a
              href="https://starkzap.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--primary)] transition-colors font-semibold"
            >
              Starkzap
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
