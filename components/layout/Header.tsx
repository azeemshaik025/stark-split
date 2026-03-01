"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSettings?: boolean;
  rightElement?: React.ReactNode;
}

export default function Header({
  title,
  showBack = false,
  showSettings = false,
  rightElement,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 20px",
        gap: 12,
        position: "sticky",
        top: 0,
        background: "var(--bg-base)",
        zIndex: 50,
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {showBack && (
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm"
          style={{ padding: "8px", borderRadius: "10px" }}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      {title && (
        <h1
          style={{
            flex: 1,
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {title}
        </h1>
      )}

      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        {rightElement}
        {showSettings && (
          <Link
            href="/settings"
            className="btn btn-ghost btn-sm"
            style={{ padding: "8px", borderRadius: "10px" }}
          >
            <Settings size={20} />
          </Link>
        )}
      </div>
    </header>
  );
}
