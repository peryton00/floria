"use client";

import React from "react";

export function SellerDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-cream-300 rounded-lg w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-cream-200 rounded-2xl border border-cream-300"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-cream-200 rounded-2xl border border-cream-300" />
        <div className="h-64 bg-cream-200 rounded-2xl border border-cream-300" />
      </div>
    </div>
  );
}

export function ProductListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-cream-300 rounded-lg w-36" />
        <div className="h-10 bg-cream-300 rounded-xl w-32" />
      </div>
      <div className="bg-cream-50 border border-cream-300 rounded-2xl p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-cream-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function OrderListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-cream-300 rounded-lg w-40" />
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 bg-cream-200 rounded-2xl border border-cream-300"
          />
        ))}
      </div>
    </div>
  );
}
