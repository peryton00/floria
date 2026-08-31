"use client";

import React from "react";
import type { SellerStatus } from "@floria/types";
import { FloriaIcon } from "@floria/icons";

export function SellerStatusBadge({
  status,
}: {
  status: SellerStatus | string;
}) {
  switch (status) {
    case "approved":
    case "active":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-100 text-forest-800 border border-forest-200">
          <FloriaIcon name="check" size="xs" />
          <span>Approved Nursery</span>
        </span>
      );
    case "pending":
    case "under_review":
    case "application_submitted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-warning-100 text-warning-700 border border-warning-200">
          <FloriaIcon name="clock" size="xs" />
          <span>Pending Review</span>
        </span>
      );
    case "suspended":
    case "deactivated":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-error-100 text-error-700 border border-error-200">
          <FloriaIcon name="warning" size="xs" />
          <span>Suspended</span>
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-ink-200 text-ink-700 border border-ink-300">
          <FloriaIcon name="close" size="xs" />
          <span>Rejected</span>
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
