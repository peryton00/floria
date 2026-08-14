"use client";

import type { SellerStatus } from "@floria/types";

interface SellerStatusBadgeProps {
  status: SellerStatus;
  size?: "sm" | "md";
}

const CONFIG: Record<SellerStatus, { label: string; classes: string }> = {
  approved:  { label: "Approved",       classes: "bg-success-100 text-success-600" },
  pending:   { label: "Pending Review", classes: "bg-warning-100 text-warning-600" },
  suspended: { label: "Suspended",      classes: "bg-error-100 text-error-600" },
  rejected:  { label: "Rejected",       classes: "bg-error-100 text-error-600" },
};

export function SellerStatusBadge({ status, size = "sm" }: SellerStatusBadgeProps) {
  const { label, classes } = CONFIG[status];
  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-[10px]"
    : "px-2.5 py-1 text-xs";
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider",
        sizeClasses,
        classes,
      ].join(" ")}
      aria-label={`Seller status: ${label}`}
    >
      <span
        className={[
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          status === "approved" ? "bg-success-600" : status === "pending" ? "bg-warning-600" : "bg-error-600",
        ].join(" ")}
        aria-hidden
      />
      {label}
    </span>
  );
}
