"use client";

import React from "react";
import { Skeleton } from "./Skeleton";

export function ProductPriceSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-24 rounded-md bg-stone-200/80" />
        <Skeleton className="h-4 w-14 rounded bg-stone-200/60" />
      </div>
      <Skeleton className="h-3 w-32 rounded bg-stone-200/50" />
    </div>
  );
}
