"use client";

import React from "react";
import { formatINR } from "@/lib/format";

export interface DeliveryBenefitProps {
  isFreeDelivery?: boolean;
  deliverySavingsPaise?: number | null;
  baseDeliveryFeePaise?: number;
  className?: string;
  variant?: "badge" | "inline" | "detailed";
}

export function DeliveryBenefit({
  isFreeDelivery,
  deliverySavingsPaise,
  baseDeliveryFeePaise = 4000,
  className = "",
  variant = "inline",
}: DeliveryBenefitProps) {
  if (isFreeDelivery) {
    if (variant === "badge") {
      return (
        <span
          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white rounded bg-forest-700 ${className}`}
        >
          FREE DELIVERY
        </span>
      );
    }

    return (
      <div className={`flex items-center gap-1.5 text-xs text-forest-800 font-ui font-medium ${className}`}>
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white rounded bg-forest-700">
          FREE DELIVERY
        </span>
        {deliverySavingsPaise && deliverySavingsPaise > 0 ? (
          <span className="text-[11px] text-forest-700 font-medium">
            (You save {formatINR(deliverySavingsPaise)} on delivery)
          </span>
        ) : null}
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <span className={`px-2 py-0.5 text-[10px] font-medium text-ink-600 bg-cream-100 rounded border border-ink-100 ${className}`}>
        Delivery from {formatINR(baseDeliveryFeePaise)}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 text-xs text-ink-600 font-ui ${className}`}>
      <span>Standard Delivery ({formatINR(baseDeliveryFeePaise)})</span>
    </div>
  );
}
