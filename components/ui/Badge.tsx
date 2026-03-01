interface BadgeProps {
  variant?: "pending" | "active" | "settled" | "failed" | "gasless";
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = "active",
  children,
  className = "",
}: BadgeProps) {
  const classes = {
    pending: "badge badge-pending",
    active: "badge badge-active",
    settled: "badge badge-settled",
    failed: "badge badge-failed",
    gasless: "badge",
  }[variant];

  const gaslessStyle =
    variant === "gasless"
      ? {
          background: "rgba(108, 92, 231, 0.1)",
          color: "#6C5CE7",
          borderColor: "rgba(108, 92, 231, 0.2)",
        }
      : undefined;

  return (
    <span className={`${classes} ${className}`} style={gaslessStyle}>
      {children}
    </span>
  );
}
