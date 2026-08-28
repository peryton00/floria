import type { ReactNode } from "react";

type SpinnerSize = "sm" | "md" | "lg";

const sizeClass: Record<SpinnerSize, string> = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

export function Spinner({
  size = "md",
  label = "Loading…",
  className = "",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex ${className}`}
    >
      <svg
        aria-hidden="true"
        className={`animate-spin text-forest-700 ${sizeClass[size]}`}
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
    </span>
  );
}

/** Full-page centered loading shell */
export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  );
}

/** Section-level loading state */
export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Spinner size="lg" />
      <p className="text-sm text-ink-500">{message}</p>
    </div>
  );
}

/** Inline row loading placeholder */
export function InlineLoader({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-ink-500">
      <Spinner size="sm" />
      {children && <span className="text-sm">{children}</span>}
    </div>
  );
}
