"use client";

import React from "react";
import { formatINR } from "@/lib/format";

export interface ProductPriceBlockProps {
  sellingPricePaise: number;
  originalPricePaise?: number | null;
  discountPercentage?: number | null;
  discountAmountPaise?: number | null;
  isFreeDelivery?: boolean;
  size?: "sm" | "md" | "lg";
  showSavings?: boolean;
  className?: string;
}

export function ProductPriceBlock({
  sellingPricePaise,
  originalPricePaise,
  discountPercentage,
  discountAmountPaise,
  isFreeDelivery,
  size = "md",
  showSavings = true,
  className = "",
}: ProductPriceBlockProps) {
  const hasLegitimateDiscount =
    typeof originalPricePaise === "number" &&
    originalPricePaise > sellingPricePaise &&
    sellingPricePaise > 0;

  const calculatedSavingsPaise =
    typeof discountAmountPaise === "number" && discountAmountPaise > 0
      ? discountAmountPaise
      : hasLegitimateDiscount
      ? (originalPricePaise as number) - sellingPricePaise
      : 0;

  const textSize =
    size === "lg"
      ? "text-2xl font-bold"
      : size === "sm"
      ? "text-sm font-bold"
      : "text-lg font-bold";

  const originalTextSize =
    size === "lg"
      ? "text-sm"
      : size === "sm"
      ? "text-[11px]"
      : "text-xs";

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Price row: Final Price (Dominant) + Optional Legitimate Strikethrough & Discount % */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`font-serif tracking-tight text-ink-900 ${textSize}`}>
          {formatINR(sellingPricePaise)}
        </span>

        {hasLegitimateDiscount && (
          <>
            <span className={`text-ink-400 line-through font-ui ${originalTextSize}`}>
              {formatINR(originalPricePaise as number)}
            </span>
            {discountPercentage && discountPercentage > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 rounded border border-emerald-200">
                {discountPercentage}% OFF
              </span>
            )}
          </>
        )}
      </div>

      {/* Optional Genuine Savings Subtext */}
      {showSavings && hasLegitimateDiscount && calculatedSavingsPaise > 0 && (
        <p className="text-[11px] font-medium text-emerald-700 font-ui">
          You save {formatINR(calculatedSavingsPaise)}
        </p>
      )}

      {/* Free Delivery Customer Benefit Tag */}
      {isFreeDelivery && (
        <div className="flex items-center gap-1 text-[11px] font-bold text-forest-700 font-ui">
          <span>FREE DELIVERY</span>
        </div>
      )}
    </div>
  );
}
