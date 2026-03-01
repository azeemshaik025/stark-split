"use client";

import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  delay?: number;
  position?: "top" | "bottom";
}

export default function Tooltip({
  children,
  content,
  delay = 150,
  position = "top",
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  function show() {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          x: rect.left + rect.width / 2,
          y: position === "top" ? rect.top : rect.bottom,
        });
      }
      setVisible(true);
    }, delay);
  }

  function hide() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const transform =
    position === "top"
      ? "translate(-50%, calc(-100% - 8px))"
      : "translate(-50%, 8px)";

  return (
    <div
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{ display: "inline-flex" }}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          style={{
            position: "fixed",
            left: coords.x,
            top: coords.y,
            transform,
            padding: "6px 12px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: 8,
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            whiteSpace: "nowrap",
            boxShadow: "var(--shadow-modal)",
            zIndex: 9999,
            pointerEvents: "none",
            animation: "tooltipFadeIn 0.1s ease",
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
