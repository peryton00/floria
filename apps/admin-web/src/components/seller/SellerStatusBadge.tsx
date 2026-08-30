"use client";

import type { SellerStatus } from "@floria/types";

interface SellerStatusBadgeProps {
  status: SellerStatus;
  size?: "sm" | "md";
}

const CONFIG: Record<SellerStatus, { label: string; classes: string }> = {
  active:                 { label: "Active",              classes: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  approved:               { label: "Approved",            classes: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  under_review:           { label: "Under Review",        classes: "bg-amber-50 text-amber-800 border-amber-200" },
  pending:                { label: "Pending Review",      classes: "bg-amber-50 text-amber-800 border-amber-200" },
  needs_correction:       { label: "Needs Correction",    classes: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  application_submitted:  { label: "Submitted",           classes: "bg-blue-50 text-blue-800 border-blue-200" },
  application_incomplete: { label: "Incomplete",          classes: "bg-gray-50 text-gray-700 border-gray-200" },
  suspended:              { label: "Suspended",           classes: "bg-red-50 text-red-700 border-red-200" },
  rejected:               { label: "Rejected",            classes: "bg-red-50 text-red-700 border-red-200" },
  deactivated:            { label: "Deactivated",         classes: "bg-gray-50 text-gray-700 border-gray-200" },
};

export function SellerStatusBadge({ status, size = "sm" }: SellerStatusBadgeProps) {
  const { label, classes } = CONFIG[status];
  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-[10px]"
    : "px-2.5 py-1 text-xs";
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded border font-mono font-bold uppercase tracking-wider",
        sizeClasses,
        classes,
      ].join(" ")}
      aria-label={`Seller status: ${label}`}
    >
      <span
        className={[
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          status === "approved" ? "bg-emerald-500 animate-pulse" : status === "pending" ? "bg-amber-500" : "bg-red-500",
        ].join(" ")}
        aria-hidden
      />
      {label}
    </span>
  );
}

