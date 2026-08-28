"use client";

import React from "react";

export function StockStatusBadge({
  quantity,
  lowStockThreshold = 5,
}: {
  quantity: number;
  lowStockThreshold?: number;
}) {
  if (quantity === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error-100 text-error-700 border border-error-200">
        Out of Stock
      </span>
    );
  }
  if (quantity <= lowStockThreshold) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning-100 text-warning-700 border border-warning-200">
        Low Stock ({quantity})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-100 text-forest-700 border border-forest-200">
      In Stock ({quantity})
    </span>
  );
}
