"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { href: "/yield", icon: TrendingUp, label: "Pools" },
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

  // Use cyan accent color for Pools, purple for Splits
  const activeColor = href === "/yield" ? "var(--accent)" : "var(--primary)";

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: 10,
        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
        background: isActive ? "var(--bg-interactive)" : "transparent",
        textDecoration: "none",
        fontSize: "0.875rem",
        fontWeight: isActive ? 600 : 500,
        letterSpacing: "-0.01em",
        transition: "all 0.15s ease",
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
      {isActive && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "25%",
            bottom: "25%",
            width: 2.5,
            borderRadius: "0 2px 2px 0",
            background: activeColor,
          }}
        />
      )}
      <Icon
        size={18}
        strokeWidth={isActive ? 2 : 1.5}
        color={isActive ? activeColor : "var(--text-tertiary)"}
      />
      {label}
    </Link>
  );
}

// ── Desktop sidebar ─────────────────────────────────────
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
      <div className="mb-8 px-1">
        <Logo href="/" size="md" />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom area: theme toggle + connect */}
      <div className="pt-4 pb-2 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-[11px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider">Theme</span>
          <ThemeToggle />
        </div>
        <ConnectButton dropdownUp />
      </div>
    </aside>
  );
}

// ── Mobile top bar ───────────────────────────────────────
function MobileTopBar() {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--nav-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
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

// ── Mobile bottom nav ────────────────────────────────────
function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] h-16 flex items-center justify-around border-t border-[var(--border-subtle)]"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        // Use cyan for Pools, purple for Splits and Settings
        const activeColor = href === "/yield" ? "var(--accent)" : "var(--primary)";
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "8px 14px",
              color: isActive ? activeColor : "var(--text-tertiary)",
              textDecoration: "none",
              minWidth: 44,
              minHeight: 44,
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
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
            {isActive && <div className="mobile-nav-active-dot" />}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Main AppShell ────────────────────────────────────────
interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <WalletRestorer />
      {/* Desktop sidebar — hidden on mobile via CSS */}
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Mobile top bar — hidden on desktop via CSS */}
        <div className="mobile-topbar-wrapper">
          <MobileTopBar />
        </div>

        {/* Page content — dashboard-style background (dots + aurora, distinct from homepage grid) */}
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

        {/* Mobile bottom nav — hidden on desktop */}
        <div className="mobile-bottomnav-wrapper">
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}
