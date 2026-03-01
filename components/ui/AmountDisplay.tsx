"use client";

import { useEffect, useRef, useState } from "react";
import { formatAmount } from "@/lib/utils";

interface AmountDisplayProps {
  amount: number | string;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "green" | "red" | "cyan" | "default";
  animate?: boolean;
  showSign?: boolean;
  className?: string;
}

export default function AmountDisplay({
  amount,
  currency = "STRK",
  size = "md",
  color = "default",
  animate = false,
  showSign = false,
  className = "",
}: AmountDisplayProps) {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  const [displayAmount, setDisplayAmount] = useState(0);
  const animRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);
  const startRef = useRef<number>(undefined);
  const startAmountRef = useRef(0);

  useEffect(() => {
    if (!animate) {
      setDisplayAmount(numAmount);
      return;
    }

    const duration = 800;
    const start = startAmountRef.current;
    const end = numAmount;

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayAmount(start + (end - start) * eased);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        startAmountRef.current = end;
        startRef.current = undefined;
      }
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [numAmount, animate]);

  const current = animate ? displayAmount : numAmount;

  const sizeStyles = {
    sm: { fontSize: "0.875rem" },
    md: { fontSize: "1rem" },
    lg: { fontSize: "1.5rem" },
    xl: { fontSize: "2.25rem" },
  }[size];

  const colorStyles = {
    primary: { color: "var(--primary)" },
    green: { color: "var(--accent-green)" },
    red: { color: "var(--error)" },
    cyan: { color: "var(--accent)" },
    default: { color: "var(--text-primary)" },
  }[color];

  const sign = showSign && numAmount > 0 ? "+" : "";
  const autoColor =
    color === "default" && showSign
      ? numAmount > 0
        ? { color: "var(--accent-green)" }
        : numAmount < 0
        ? { color: "var(--error)" }
        : {}
      : {};

  return (
    <span
      className={`font-mono-nums ${className}`}
      style={{ ...sizeStyles, ...colorStyles, ...autoColor, fontWeight: 600 }}
    >
      {sign}
      {formatAmount(Math.abs(current))} {currency}
    </span>
  );
}
