interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}

export default function Skeleton({
  width = "100%",
  height = 16,
  className = "",
  rounded = false,
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: rounded ? "9999px" : undefined,
      }}
    />
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <Skeleton width={48} height={48} rounded />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="60%" />
          <Skeleton height={12} width="40%" />
        </div>
        <Skeleton height={20} width={60} />
      </div>
    </div>
  );
}

// Expense list skeleton
export function ExpenseListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-4 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <Skeleton width={40} height={40} rounded />
          <div className="flex-1 space-y-2">
            <Skeleton height={14} width="55%" />
            <Skeleton height={11} width="35%" />
          </div>
          <Skeleton height={16} width={70} />
        </div>
      ))}
    </div>
  );
}
