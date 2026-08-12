import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-forest-700 text-white hover:bg-forest-800 active:bg-forest-900 focus-visible:ring-forest-700",
  secondary:
    "bg-cream-200 text-ink-900 hover:bg-cream-300 active:bg-cream-400 focus-visible:ring-forest-700",
  ghost:
    "bg-transparent text-ink-700 hover:bg-cream-200 active:bg-cream-300 focus-visible:ring-forest-700",
  outline:
    "bg-transparent border border-forest-700 text-forest-700 hover:bg-forest-50 active:bg-forest-100 focus-visible:ring-forest-700",
  destructive:
    "bg-error-600 text-white hover:opacity-90 active:opacity-80 focus-visible:ring-error-600",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-6 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading}
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
        <>
          <span className="sr-only">Loading…</span>
          <Spinner size="sm" />
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Inline Spinner used by Button — keep co-located to avoid circular deps
function Spinner({ size }: { size: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
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
