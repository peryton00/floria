import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "forest";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-stone-100 text-ink-700",
  forest:  "bg-forest-100 text-forest-800",
  success: "bg-success-100 text-success-600",
  warning: "bg-warning-100 text-warning-600",
  error:   "bg-error-100 text-error-600",
  info:    "bg-info-100 text-info-600",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2 py-0.5",
        "text-xs font-medium rounded-full",
        variantStyles[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

/** Numeric count badge for cart/notification icons */
export function CountBadge({ count, max = 99 }: { count: number; max?: number }) {
  if (count <= 0) return null;
  const label = count > max ? `${max}+` : String(count);
  return (
    <span
      aria-label={`${count} item${count === 1 ? "" : "s"}`}
      className={[
        "absolute -top-1 -right-1",
        "min-w-[18px] h-[18px] px-1",
        "flex items-center justify-center",
        "text-[10px] font-bold text-white",
        "bg-glow-400 rounded-full",
        "ring-2 ring-cream-100",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
