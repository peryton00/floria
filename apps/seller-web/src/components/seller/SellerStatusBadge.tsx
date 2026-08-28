"use client";

import React from "react";
import type { SellerStatus } from "@floria/types";

export function SellerStatusBadge({
  status,
}: {
  status: SellerStatus | string;
}) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-100 text-forest-800 border border-forest-200">
          ● Verified Nursery
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-warning-100 text-warning-700 border border-warning-200">
          ⏳ Pending Approval
        </span>
      );
    case "suspended":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-error-100 text-error-700 border border-error-200">
          ⚠️ Suspended
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-ink-100 text-ink-700 border border-ink-200">
          {status}
        </span>
      );
  }
}
