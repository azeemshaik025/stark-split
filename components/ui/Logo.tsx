"use client";

import Link from "next/link";

interface LogoProps {
  href?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const SIZES = {
  sm: { icon: 24, text: "text-base", gap: 8 },
  md: { icon: 28, text: "text-lg", gap: 10 },
  lg: { icon: 32, text: "text-xl", gap: 12 },
  xl: { icon: 40, text: "text-2xl", gap: 14 },
} as const;

export default function Logo({ href = "/dashboard", size = "md", showText = true, className = "" }: LogoProps) {
  const { icon, text, gap } = SIZES[size];

  const content = (
    <>
      <img
        src="/favicon.svg"
        alt=""
        width={icon}
        height={icon}
        className="shrink-0 block"
        style={{ width: icon, height: icon }}
      />
      {showText && (
        <span
          className={`font-extrabold tracking-tight ${text}`}
          style={{ letterSpacing: "-0.03em", lineHeight: 1.1 }}
        >
          <span className="text-gradient">Stark</span>
          <span style={{ color: "var(--text-primary)" }}>Split</span>
        </span>
      )}
    </>
  );

  const wrapperClass = `inline-flex items-center ${className}`.trim();
  const wrapperStyle = { gap };

  if (href && href !== "") {
    return (
      <Link href={href} className={wrapperClass} style={wrapperStyle}>
        {content}
      </Link>
    );
  }

  return (
    <div className={wrapperClass} style={wrapperStyle}>
      {content}
    </div>
  );
}
