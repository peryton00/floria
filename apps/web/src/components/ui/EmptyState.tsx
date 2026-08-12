import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-4",
        "py-16 px-6 text-center",
        className,
      ].join(" ")}
    >
      {icon && (
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-sage-100 text-sage-400">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-ink-900 font-sans">{title}</h3>
        {description && (
          <p className="text-sm text-ink-500 max-w-xs mx-auto">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
