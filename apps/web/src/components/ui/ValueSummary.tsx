"use client";

import React from "react";

export interface ValueSummaryProps {
  isFreeDelivery?: boolean;
  isVerifiedSeller?: boolean;
  sellerName?: string;
  rating?: number | null;
  reviewCount?: number | null;
  className?: string;
}

export function ValueSummary({
  isFreeDelivery,
  isVerifiedSeller,
  sellerName,
  rating,
  reviewCount,
  className = "",
}: ValueSummaryProps) {
  const items: string[] = [];

  if (isFreeDelivery) {
    items.push("Free delivery on this item");
  }

  if (isVerifiedSeller) {
    items.push(sellerName ? `Verified nursery (${sellerName})` : "Verified nursery partner");
  }

  if (typeof rating === "number" && rating > 0 && typeof reviewCount === "number" && reviewCount > 0) {
    items.push(`${rating.toFixed(1)}★ rating from ${reviewCount} customer${reviewCount > 1 ? "s" : ""}`);
  } else {
    items.push("Fresh quality plant guarantee");
  }

  // Cap at max 3 signals to avoid badge overload
  const displayedItems = items.slice(0, 3);

  return (
    <div className={`rounded-xl bg-cream-50/80 border border-ink-100 p-3.5 space-y-2 text-xs text-ink-700 font-ui ${className}`}>
      <p className="font-bold text-ink-900 uppercase tracking-wider text-[10px] text-forest-800">
        Floria Value &amp; Quality Assurance
      </p>
      <ul className="space-y-1.5">
        {displayedItems.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span className="text-forest-700 font-bold">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
