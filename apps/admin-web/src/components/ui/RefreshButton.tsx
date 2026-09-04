"use client";

import React, { useState } from "react";
import { RefreshIcon } from "@/components/ui/Icons";

interface RefreshButtonProps {
  onRefresh: () => Promise<void> | void;
  isLoading?: boolean;
  title?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function RefreshButton({
  onRefresh,
  isLoading: externalLoading,
  title = "Refresh data",
  className = "",
  size = "md",
}: RefreshButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading ?? internalLoading;

  const handleClick = async () => {
    if (loading) return;
    try {
      setInternalLoading(true);
      await onRefresh();
    } finally {
      setInternalLoading(false);
    }
  };

  const paddingClass = size === "sm" ? "p-2" : size === "lg" ? "p-3.5" : "p-3";
  const iconSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-full bg-white border border-cream-400/60 text-ink-600 hover:text-ink-900 hover:bg-cream-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] focus:outline-none focus:ring-4 focus:ring-forest-700/10 cursor-pointer select-none disabled:opacity-60 flex items-center justify-center ${paddingClass} ${className}`}
      title={title}
      aria-label={title}
    >
      <RefreshIcon
        size={iconSize}
        className={loading ? "animate-spin text-forest-700" : ""}
      />
    </button>
  );
}
