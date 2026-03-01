"use client";

import Link from "next/link";
import ThemeToggle from "@/components/layout/ThemeToggle";
import Logo from "@/components/ui/Logo";
import { ESTIMATED_APR } from "@/lib/constants";

const STEPS = [
  {
    number: "01",
    title: "Create a group",
    description: "Invite friends with a link. No signup for them — just connect with Google or passkeys.",
  },
  {
    number: "02",
    title: "Add expenses",
    description: "Split equally or custom in Bitcoin-on-Starknet. Track who paid what.",
  },
  {
    number: "03",
    title: "Settle gasless",
    description: `Pay debts with zero gas on mainnet. STRK pools earn ~${ESTIMATED_APR}% APR while open.`,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden relative">
      <div className="fixed inset-0 bg-[var(--bg-base)]" />
      <div className="fixed inset-0 bg-grid opacity-[0.4] pointer-events-none" />
      <div className="fixed inset-0 bg-mesh pointer-events-none" />

      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8 py-4 border-b border-[var(--border-subtle)] backdrop-blur-xl bg-[var(--bg-base)]/70">
        <Logo href="/dashboard" size="md" />
        <div className="flex items-center gap-3">
          <ThemeToggle compact />
          <Link href="/dashboard" className="btn btn-primary btn-sm">
            Launch app
          </Link>
        </div>
      </nav>

      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-16 text-center">
        <div className="relative z-10 max-w-[600px] mx-auto">
          {/* Tagline chip */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest" style={{ background: "var(--primary-subtle)", color: "var(--primary)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" />
            Bitcoin-on-Starknet · Zero Gas
          </div>

          <h1 className="text-display-lg font-extrabold leading-[1.12] tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
            Split bills in{" "}
            <span className="hero-gradient-text">Bitcoin.</span>
            <br />
            Earn yield on STRK.
          </h1>

          <p className="text-xl font-light leading-relaxed mb-10 max-w-[520px] mx-auto" style={{ color: "var(--text-secondary)" }}>
            Group expense splitting on Starknet. Gasless settlements with Bitcoin-on-Starknet. Idle funds stake for yield while debts stay open.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard" className="btn btn-gradient btn-lg min-w-[180px]">
              Launch app
            </Link>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            {[
              { label: "Gasless on mainnet", icon: "⚡" },
              { label: "Social login", icon: "🔐" },
              { label: `~${ESTIMATED_APR}% APR on STRK`, icon: "📈" },
            ].map(({ label, icon }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: "var(--text-tertiary)" }}
              >
                <span>{icon}</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 sm:py-24 px-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="max-w-3xl mx-auto relative z-10">
          <p className="text-label mb-10 text-center">How it works</p>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-10">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col gap-3">
                <span className="step-number">{step.number}</span>
                <h3 className="text-heading-sm" style={{ color: "var(--text-primary)" }}>
                  {step.title}
                </h3>
                <p className="text-body-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-12 px-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <p className="text-caption" style={{ color: "var(--text-tertiary)" }}>
            Powered by{" "}
            <a href="https://starknet.io" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary)] transition-colors">Starknet</a>
            {" · "}
            <a href="https://cartridge.gg" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary)] transition-colors">Cartridge</a>
            {" · "}
            <a href="https://starkzap.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary)] transition-colors">Starkzap</a>
          </p>
        </div>
      </section>
    </div>
  );
}
