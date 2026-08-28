import type { ReactNode } from "react";
import Link from "next/link";
import { LeafIcon } from "@/components/ui/Icons";

export interface EmptyStateSuggestion {
  label: string;
  href: string;
}

export interface EmptyStateProps {
  icon?: ReactNode;
  badge?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  suggestions?: EmptyStateSuggestion[];
  className?: string;
}

export function EmptyState({
  icon,
  badge,
  title,
  description,
  action,
  primaryAction,
  secondaryAction,
  suggestions,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={[
        "relative overflow-hidden bg-floria-linen rounded-3xl border border-floria-border p-8 sm:p-12 text-center shadow-xs my-4",
        "flex flex-col items-center justify-center",
        className,
      ].join(" ")}
    >
      {/* Decorative ambient botanical glow */}
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-forest-50/70 blur-2xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-terracotta-50/60 blur-2xl pointer-events-none"
      />

      {/* Layered botanical icon badge */}
      <div className="relative mb-4 flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-forest-100/90 border border-forest-200 text-forest-800 flex items-center justify-center shadow-xs">
          {icon || <LeafIcon size={26} className="text-forest-800" />}
        </div>
      </div>

      {/* Optional micro tag */}
      {badge && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mb-2 text-[10px] font-bold uppercase tracking-widest text-forest-800 bg-forest-100/80 border border-forest-200/80 rounded-full font-ui">
          {badge}
        </span>
      )}

      {/* Typography */}
      <div className="max-w-md mx-auto space-y-1.5 mb-6">
        <h3 className="font-serif font-bold text-ink-900 text-xl md:text-2xl leading-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs md:text-sm text-ink-500 leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        )}
      </div>

      {/* Explicit action or dual CTA buttons */}
      {action ? (
        <div className="mb-6">{action}</div>
      ) : primaryAction || secondaryAction ? (
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-sm mb-6">
          {primaryAction &&
            (primaryAction.href ? (
              <Link
                href={primaryAction.href}
                style={{ color: "#FFFFFF" }}
                className="flex-1 min-w-[140px] py-2.5 px-5 bg-terracotta-700 hover:bg-terracotta-800 active:bg-terracotta-900 !text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs text-center focus:outline-none focus:ring-2 focus:ring-terracotta-700 focus:ring-offset-2"
              >
                {primaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                style={{ color: "#FFFFFF" }}
                className="flex-1 min-w-[140px] py-2.5 px-5 bg-terracotta-700 hover:bg-terracotta-800 active:bg-terracotta-900 !text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs text-center focus:outline-none focus:ring-2 focus:ring-terracotta-700 focus:ring-offset-2"
              >
                {primaryAction.label}
              </button>
            ))}

          {secondaryAction &&
            (secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="flex-1 min-w-[140px] py-2.5 px-5 bg-floria-sand hover:bg-floria-sand/80 text-ink-800 border border-floria-border font-semibold text-xs rounded-xl transition-all text-center focus:outline-none focus:ring-2 focus:ring-forest-800"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="flex-1 min-w-[140px] py-2.5 px-5 bg-floria-sand hover:bg-floria-sand/80 text-ink-800 border border-floria-border font-semibold text-xs rounded-xl transition-all text-center focus:outline-none focus:ring-2 focus:ring-forest-800"
              >
                {secondaryAction.label}
              </button>
            ))}
        </div>
      ) : null}

      {/* Suggested Quick Category Pills */}
      {suggestions && suggestions.length > 0 && (
        <div className="pt-4 border-t border-floria-border w-full max-w-md flex flex-col items-center gap-2">
          <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider">
            Popular Collections
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {suggestions.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="px-3 py-1 rounded-full text-xs font-medium text-forest-800 bg-forest-50 hover:bg-forest-100 border border-forest-200/80 transition-colors shadow-2xs"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
