import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "cta"
  | "action"
  | "terracotta"
  | "muted"
  | "ghost"
  | "destructive"
  | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  cta: "bg-terracotta-700 !text-white hover:bg-terracotta-800 active:bg-terracotta-900 focus-visible:ring-terracotta-700 shadow-xs font-semibold",
  action:
    "bg-terracotta-700 !text-white hover:bg-terracotta-800 active:bg-terracotta-900 focus-visible:ring-terracotta-700 shadow-xs font-semibold",
  terracotta:
    "bg-terracotta-700 !text-white hover:bg-terracotta-800 active:bg-terracotta-900 focus-visible:ring-terracotta-700 shadow-xs font-semibold",
  primary:
    "bg-forest-800 !text-white hover:bg-forest-900 active:bg-forest-900 focus-visible:ring-forest-800 shadow-xs font-semibold",
  secondary:
    "bg-sage-600 !text-white hover:bg-sage-700 active:bg-sage-800 focus-visible:ring-sage-600 font-semibold",
  muted:
    "bg-cream-200 text-ink-900 hover:bg-cream-300 active:bg-cream-400 focus-visible:ring-forest-800 border border-ink-150 font-medium",
  ghost:
    "bg-transparent text-ink-700 hover:bg-cream-200 active:bg-cream-300 focus-visible:ring-forest-800 font-medium",
  outline:
    "bg-transparent border border-forest-800 text-forest-800 hover:bg-forest-50 active:bg-forest-100 focus-visible:ring-forest-800 font-semibold",
  destructive:
    "bg-error-600 !text-white hover:opacity-90 active:opacity-80 focus-visible:ring-error-600 font-semibold",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-6 text-base gap-2",
};

const darkVariants = new Set<Variant>([
  "primary",
  "cta",
  "action",
  "terracotta",
  "secondary",
  "destructive",
]);

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isDark = darkVariants.has(variant);

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading}
      style={isDark ? { color: "#ffffff", ...style } : style}
      className={[
        // Base
        "inline-flex items-center justify-center font-medium rounded-lg",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // Minimum tap target for mobile (WCAG)
        "min-w-[44px]",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Spinner size="sm" />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// Inline Spinner used by Button — keep co-located to avoid circular deps
function Spinner({ size }: { size: "sm" | "md" | "lg" }) {
  const sizeClass =
    size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  return (
    <svg
      aria-hidden="true"
      className={`animate-spin ${sizeClass}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
