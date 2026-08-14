"use client";

import React from "react";

interface StockStatusBadgeProps {
  stockQuantity: number;
  lowStockThreshold?: number;
  size?: "sm" | "md";
}

export function StockStatusBadge({
  stockQuantity,
  lowStockThreshold = 5,
  size = "sm",
}: StockStatusBadgeProps) {
  let status: "in_stock" | "low_stock" | "out_of_stock";
  let label: string;
  let classes: string;
  let dotBg: string;

  if (stockQuantity <= 0) {
    status = "out_of_stock";
    label = "Out of Stock";
    classes = "bg-error-100 text-error-600";
    dotBg = "bg-error-600";
  } else if (stockQuantity <= lowStockThreshold) {
    status = "low_stock";
    label = `Low Stock (${stockQuantity})`;
    classes = "bg-warning-100 text-warning-600";
    dotBg = "bg-warning-600";
  } else {
    status = "in_stock";
    label = `In Stock (${stockQuantity})`;
    classes = "bg-success-100 text-success-600";
    dotBg = "bg-success-600";
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider",
        sizeClasses,
        classes,
      ].join(" ")}
      aria-label={`Stock status: ${label}`}
    >
      <span className={["w-1.5 h-1.5 rounded-full flex-shrink-0", dotBg].join(" ")} aria-hidden />
      {label}
    </span>
  );
}
