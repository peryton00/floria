import type { ReactNode } from "react";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<SpinnerSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
  ariaHidden?: boolean;
}

export function Spinner({
  size = "md",
  label = "Loading...",
  className = "",
  ariaHidden = false,
}: SpinnerProps) {
  return (
    <span
      role={ariaHidden ? undefined : "status"}
      aria-label={ariaHidden ? undefined : label}
      aria-hidden={ariaHidden ? "true" : undefined}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <svg
        aria-hidden="true"
        className={`animate-spin ${sizeClasses[size]} text-current`}
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
      {!ariaHidden && <span className="sr-only">{label}</span>}
    </span>
  );
}
