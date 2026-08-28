import { useState, useEffect, type ReactNode } from "react";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "forest"
  | "terracotta"
  | "sale"
  | "botanical"
  | "sage";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-cream-200 text-ink-800 border border-ink-150",
  forest:
    "bg-forest-100 text-forest-800 border border-forest-200 font-semibold",
  terracotta:
    "bg-terracotta-100 text-terracotta-700 border border-terracotta-200 font-semibold",
  sale: "bg-terracotta-700 text-white font-bold",
  botanical:
    "bg-forest-100 text-forest-800 border border-forest-200 font-medium",
  sage: "bg-sage-100 text-sage-700 border border-sage-200 font-medium",
  success:
    "bg-success-100 text-success-600 border border-emerald-200 font-medium",
  warning:
    "bg-warning-100 text-warning-600 border border-amber-200 font-medium",
  error: "bg-error-100 text-error-600 border border-red-200 font-medium",
  info: "bg-info-100 text-info-600 border border-blue-200 font-medium",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
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
export function CountBadge({
  count,
  max = 99,
}: {
  count: number;
  max?: number;
}) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [count]);

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
        "bg-terracotta-700 rounded-full",
        "ring-2 ring-cream-100",
        "transition-transform duration-200",
        pulse ? "animate-badge-pulse scale-110" : "scale-100",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
