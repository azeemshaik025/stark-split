"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

let toastListeners: ((toast: ToastMessage) => void)[] = [];

export function toast(
  message: string,
  type: ToastType = "info",
  duration = 4000
) {
  const id = Math.random().toString(36).slice(2);
  const t: ToastMessage = { id, type, message, duration };
  toastListeners.forEach((l) => l(t));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (t: ToastMessage) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, t.duration ?? 4000);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const icons = {
    success: <CheckCircle size={16} color="var(--success)" />,
    error: <XCircle size={16} color="var(--error)" />,
    warning: <AlertCircle size={16} color="var(--warning)" />,
    info: <Info size={16} color="var(--info)" />,
  };

  const colors: Record<ToastType, string> = {
    success: "rgba(0, 230, 118, 0.1)",
    error: "rgba(255, 71, 87, 0.1)",
    warning: "rgba(255, 184, 0, 0.1)",
    info: "rgba(59, 130, 246, 0.1)",
  };

  const borderColors: Record<ToastType, string> = {
    success: "rgba(0, 230, 118, 0.2)",
    error: "rgba(255, 71, 87, 0.2)",
    warning: "rgba(255, 184, 0, 0.2)",
    info: "rgba(59, 130, 246, 0.2)",
  };

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 360,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-fade-in-up"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 12,
            background: colors[t.type],
            border: `1px solid ${borderColors[t.type]}`,
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <span style={{ flexShrink: 0, marginTop: 1 }}>{icons[t.type]}</span>
          <span
            style={{
              fontSize: "0.875rem",
              color: "var(--text-primary)",
              flex: 1,
            }}
          >
            {t.message}
          </span>
          <button
            onClick={() =>
              setToasts((prev) => prev.filter((x) => x.id !== t.id))
            }
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
