"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import Logo from "@/components/ui/Logo";
import { ESTIMATED_APR } from "@/lib/constants";
import { Zap, Shield, TrendingUp, ArrowRight, Bitcoin, Wallet, Users } from "lucide-react";

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
    border: "rgba(255,184,0,0.2)",
    title: "Bitcoin-on-Starknet",
    description: "Split expenses in WBTC — the Bitcoin experience on Starknet's blazing fast L2.",
  },
  {
    icon: TrendingUp,
    color: "var(--accent)",
    bg: "rgba(0,210,255,0.08)",
    border: "rgba(0,210,255,0.2)",
    title: `~${ESTIMATED_APR}% APR Yield`,
    description: "Pool STRK together with friends and earn staking yield while your group debts are open.",
  },
  {
    icon: Zap,
    color: "var(--primary)",
    bg: "var(--primary-subtle)",
    border: "rgba(99,102,241,0.2)",
    title: "Gasless on Mainnet",
    description: "Powered by Cartridge Controller. Sign in with Google — no seed phrases, no gas fees.",
  },
];

// Reusable scroll-reveal wrapper — animates children into view once
function FadeInSection({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
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
      <div className="fixed inset-0 bg-grid opacity-[0.4] pointer-events-none" />
      <div className="fixed inset-0 bg-mesh pointer-events-none" />

      {/* Nav */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8 py-3.5 border-b border-[var(--border-subtle)] backdrop-blur-xl bg-[var(--bg-base)]/80"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Logo href="/dashboard" size="md" />
        <div className="flex items-center gap-3">
          <ThemeToggle compact />
          <Link href="/dashboard" className="btn btn-primary btn-sm">
            Launch app
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-16 text-center">
        <div className="relative z-10 max-w-[680px] mx-auto">
          {/* Live badge */}
          <motion.div
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest"
            style={{
              background: "var(--primary-subtle)",
              color: "var(--primary)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" />
            Bitcoin-on-Starknet · Zero Gas
          </motion.div>

          <motion.h1
            className="text-display-lg font-extrabold leading-[1.1] tracking-tight mb-6"
            style={{ color: "var(--text-primary)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Split bills in{" "}
            <span className="hero-gradient-text">Bitcoin.</span>
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
            className="text-xl font-light leading-relaxed mb-10 max-w-[520px] mx-auto"
            style={{ color: "var(--text-secondary)" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Group expense splitting on Starknet. Gasless settlements with Bitcoin-on-Starknet. Idle funds stake for yield while debts stay open.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/dashboard" className="btn btn-gradient btn-lg min-w-[200px]">
                Get started free
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust row */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {[
              { label: "Gasless on mainnet", icon: "⚡" },
              { label: "Social login", icon: "🔐" },
              { label: `~${ESTIMATED_APR}% APR on STRK`, icon: "📈" },
              { label: "No seed phrase", icon: "✨" },
            ].map(({ label, icon }, i) => (
              <motion.span
                key={label}
                className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: "var(--text-tertiary)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.04 }}
              >
                <span>{icon}</span>
                {label}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section
        className="relative py-20 sm:py-24 px-6 border-t"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="max-w-4xl mx-auto relative z-10">
          <FadeInSection>
            <p className="text-label mb-3 text-center">Why StarkSplit</p>
            <h2
              className="text-display text-center font-extrabold tracking-tight mb-14"
              style={{ color: "var(--text-primary)" }}
            >
              Built different.
            </h2>
          </FadeInSection>

          <div className="grid sm:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <FadeInSection key={feature.title} delay={i * 0.07}>
                  <motion.div
                    className="rounded-2xl p-6 flex flex-col gap-5 h-full"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      boxShadow: "var(--shadow-card)",
                    }}
                    whileHover={{ y: -2, boxShadow: "var(--shadow-card-hover)", transition: { duration: 0.2 } }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: feature.bg, border: `1px solid ${feature.border}` }}
                      whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                    >
                      <Icon size={20} color={feature.color} />
                    </motion.div>
                    <div>
                      <h3
                        className="font-bold text-base mb-2"
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
      <section
        className="relative py-20 sm:py-24 px-6 border-t"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="max-w-3xl mx-auto relative z-10">
          <FadeInSection>
            <p className="text-label mb-3 text-center">How it works</p>
            <h2
              className="text-display text-center font-extrabold tracking-tight mb-14"
              style={{ color: "var(--text-primary)" }}
            >
              Three steps to zero debt.
            </h2>
          </FadeInSection>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-10">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <FadeInSection key={step.number} delay={i * 0.08}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <motion.span
                        className="step-number"
                        whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                      >
                        {step.number}
                      </motion.span>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--primary-subtle)" }}
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
      <section
        className="relative py-16 px-6 border-t"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Wallets", desc: "Cartridge Controller social login", icon: Wallet, color: "var(--primary)" },
              { label: "Gasless", desc: "Built-in paymaster — zero gas on mainnet", icon: Zap, color: "var(--accent-green)" },
              { label: "Staking", desc: "STRK delegation pool yield", icon: TrendingUp, color: "var(--accent)" },
            ].map(({ label, desc, icon: Icon, color }, i) => (
              <FadeInSection key={label} delay={i * 0.06}>
                <motion.div
                  className="rounded-xl p-4 flex items-start gap-3"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  whileHover={{ borderColor: color, y: -1, transition: { duration: 0.2 } }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "var(--bg-interactive)" }}
                  >
                    <Icon size={18} color={color} />
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>
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
      <section
        className="relative py-20 px-6 border-t"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <FadeInSection className="max-w-lg mx-auto text-center relative z-10">
          <h2
            className="text-display font-extrabold tracking-tight mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Ready to split?
          </h2>
          <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
            Start splitting in Bitcoin. Start earning yield. Zero gas required.
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex">
            <Link href="/dashboard" className="btn btn-gradient btn-lg inline-flex">
              Launch StarkSplit
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </FadeInSection>
      </section>

      {/* Footer */}
      <section
        className="relative py-8 px-6 border-t"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <p className="text-caption" style={{ color: "var(--text-tertiary)" }}>
            Powered by{" "}
            <a
              href="https://starknet.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--primary)] transition-colors"
            >
              Starknet
            </a>
            {" · "}
            <a
              href="https://cartridge.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--primary)] transition-colors"
            >
              Cartridge
            </a>
            {" · "}
            <a
              href="https://starkzap.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--primary)] transition-colors"
            >
              Starkzap
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
