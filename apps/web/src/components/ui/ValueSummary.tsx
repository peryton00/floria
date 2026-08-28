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
    items.push(
      sellerName
        ? `Verified nursery (${sellerName})`
        : "Verified nursery partner",
    );
  }

  if (
    typeof rating === "number" &&
    rating > 0 &&
    typeof reviewCount === "number" &&
    reviewCount > 0
  ) {
    items.push(
      `${rating.toFixed(1)}★ rating from ${reviewCount} customer${reviewCount > 1 ? "s" : ""}`,
    );
  } else {
    items.push("Fresh quality plant guarantee");
  }

  // Cap at max 3 signals to avoid badge overload
  const displayedItems = items.slice(0, 3);

  return (
    <div
      className={`rounded-2xl bg-floria-soft-sand border border-floria-border p-4 space-y-2.5 text-xs text-ink-700 font-ui shadow-2xs ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-forest-800" />
        <p className="font-bold text-forest-800 uppercase tracking-widest text-[10px]">
          Floria Quality &amp; Care Assurance
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-1.5">
        {displayedItems.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2 text-ink-700">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-forest-100 text-forest-800 text-[10px] font-bold flex-shrink-0">
              ✓
            </span>
            <span className="font-medium text-xs">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
