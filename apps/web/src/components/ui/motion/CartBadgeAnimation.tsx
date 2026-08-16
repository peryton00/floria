"use client";

import React, { useEffect, useState } from "react";

interface CartBadgeAnimationProps {
  count: number;
  className?: string;
}

export function CartBadgeAnimation({ count, className = "" }: CartBadgeAnimationProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [count]);

  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center font-bold text-[10px] rounded-full px-1.5 py-0.5 bg-forest-700 text-white min-w-[18px] transition-transform duration-200 ${
        pulse ? "animate-badge-pulse scale-110" : "scale-100"
      } ${className}`}
    >
      {count}
    </span>
  );
}
