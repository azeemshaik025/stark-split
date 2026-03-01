"use client";

import { getAvatarGradient, getInitials } from "@/lib/utils";
import type { User } from "@/types";

interface AvatarProps {
  user: Partial<User> | null;
  size?: number;
  showBorder?: boolean;
  className?: string;
}

export default function Avatar({
  user,
  size = 32,
  showBorder = true,
  className = "",
}: AvatarProps) {
  const gradient = getAvatarGradient(user?.id ?? user?.wallet_address ?? "?");
  const initials = getInitials(
    user?.display_name ?? user?.wallet_address ?? "?"
  );

  return (
    <div
      className={`flex items-center justify-center rounded-full flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: gradient,
        border: showBorder ? "2px solid var(--bg-base)" : undefined,
        fontSize: size * 0.35,
        fontWeight: 700,
        color: "white",
        letterSpacing: "0.02em",
      }}
      title={user?.display_name ?? user?.wallet_address ?? "Unknown"}
    >
      {initials}
    </div>
  );
}

// Stacked avatar group
interface AvatarGroupProps {
  users: Array<Partial<User>>;
  max?: number;
  size?: number;
}

export function AvatarGroup({ users, max = 4, size = 32 }: AvatarGroupProps) {
  const shown = users.slice(0, max);
  const rest = users.length - max;

  return (
    <div className="flex items-center" style={{ paddingLeft: size * 0.1 }}>
      {shown.map((user, i) => (
        <div
          key={user.id ?? i}
          style={{ marginLeft: i === 0 ? 0 : -(size * 0.35) }}
        >
          <Avatar user={user} size={size} showBorder />
        </div>
      ))}
      {rest > 0 && (
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: size,
            height: size,
            marginLeft: -(size * 0.35),
            background: "var(--bg-interactive)",
            border: "2px solid var(--bg-base)",
            fontSize: size * 0.3,
            fontWeight: 700,
            color: "var(--text-secondary)",
          }}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}
