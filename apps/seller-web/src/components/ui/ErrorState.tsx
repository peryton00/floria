import type { ReactNode } from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  action,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={[
        "flex flex-col items-center justify-center gap-4",
        "py-12 px-6 text-center",
        className,
      ].join(" ")}
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-error-100 text-error-600">
        {/* Simple X icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6M9 9l6 6" />
        </svg>
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-ink-900 font-sans">
          {title}
        </h3>
        {message && (
          <p className="text-sm text-ink-500 max-w-xs mx-auto">{message}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/** Inline field-level error message */
export function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-error-600">
      {message}
    </p>
  );
}
