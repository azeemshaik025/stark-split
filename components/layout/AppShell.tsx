"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Settings,
} from "lucide-react";
import ConnectButton from "@/components/wallet/ConnectButton";
import ThemeToggle from "@/components/layout/ThemeToggle";
import Logo from "@/components/ui/Logo";
import WalletRestorer from "@/components/wallet/WalletRestorer";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Splits" },
  { href: "/pools", icon: TrendingUp, label: "Pools" },
  { href: "/settings", icon: Settings, label: "Settings" },
];


function SidebarNavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const activeColor = href === "/pools" ? "var(--accent)" : "var(--primary)";

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 12,
        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
        background: isActive ? "var(--bg-interactive)" : "transparent",
        textDecoration: "none",
        fontSize: "0.875rem",
        fontWeight: isActive ? 600 : 500,
        letterSpacing: "-0.01em",
        transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.background =
            "var(--bg-interactive)";
          (e.currentTarget as HTMLAnchorElement).style.color =
            "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.background =
            "transparent";
          (e.currentTarget as HTMLAnchorElement).style.color =
            "var(--text-secondary)";
        }
      }}
    >
      <AnimatePresence>
        {isActive && (
          <motion.span
            layoutId="sidebar-active-indicator"
            style={{
              position: "absolute",
              left: 0,
              top: "22%",
              bottom: "22%",
              width: 3,
              borderRadius: "0 3px 3px 0",
              background: activeColor,
            }}
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.4 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        )}
      </AnimatePresence>
      <Icon
        size={18}
        strokeWidth={isActive ? 2 : 1.5}
        color={isActive ? activeColor : "var(--text-tertiary)"}
      />
      {label}
    </Link>
  );
}

function Sidebar() {
  return (
    <aside
      className="w-56 flex-shrink-0 sticky top-0 h-screen flex flex-col py-6 px-4"
      style={{
        borderRight: "1px solid var(--sidebar-border)",
        background: "var(--sidebar-bg)",
        overflow: "visible",
        transition: "background-color 0.25s ease, border-color 0.25s ease",
      }}
    >
      <div className="pb-6 mb-4 px-1" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <Logo href="/" size="md" />
      </div>

      <nav className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="pt-4 pb-2 flex flex-col gap-3.5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-[11px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">Theme</span>
          <ThemeToggle />
        </div>
        <ConnectButton dropdownUp />
      </div>
    </aside>
  );
}

function MobileTopBar() {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Logo href="/" size="md" />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ThemeToggle compact />
        <ConnectButton compact />
      </div>
    </div>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(24px) saturate(1.3)",
        WebkitBackdropFilter: "blur(24px) saturate(1.3)",
        borderTop: "1px solid var(--border-subtle)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        height: 64,
      }}
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        const activeColor = href === "/pools" ? "var(--accent)" : "var(--primary)";
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "8px 16px",
              color: isActive ? activeColor : "var(--text-tertiary)",
              textDecoration: "none",
              minWidth: 48,
              minHeight: 48,
              justifyContent: "center",
              position: "relative",
              transition: "color 0.2s ease",
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {label.split(" ")[0]}
            </span>
            <AnimatePresence>
              {isActive && (
                <motion.div
                  className="mobile-nav-active-dot"
                  layoutId="mobile-nav-active-dot"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                />
              )}
            </AnimatePresence>
          </Link>
        );
      })}
    </nav>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <WalletRestorer />
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="mobile-topbar-wrapper">
          <MobileTopBar />
        </div>

        <main
          className="relative"
          style={{ flex: 1, overflowY: "auto" }}
        >
          <div className="fixed inset-0 pointer-events-none -z-10 bg-[var(--bg-base)]" />
          <div className="fixed inset-0 pointer-events-none -z-10 bg-dashboard-dots" />
          <div className="fixed inset-0 pointer-events-none -z-10 bg-dashboard-aurora" />
          <div className="fixed inset-0 pointer-events-none -z-10 bg-dashboard-vignette" />
          {children}
        </main>

        <div className="mobile-bottomnav-wrapper">
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}
