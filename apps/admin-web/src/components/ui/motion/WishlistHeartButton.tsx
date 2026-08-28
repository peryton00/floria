"use client";

import React, { useState } from "react";
import { WishlistIcon } from "@/components/ui/Icons";

interface WishlistHeartButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onToggle"
> {
  active?: boolean;
  onToggle?: (active: boolean) => void;
  size?: number;
  className?: string;
}

export function WishlistHeartButton({
  active = false,
  onToggle,
  size = 20,
  className = "",
  onClick,
  ...props
}: WishlistHeartButtonProps) {
  const [isActive, setIsActive] = useState(active);
  const [animating, setAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    const nextState = !isActive;
    setIsActive(nextState);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 200);
    onToggle?.(nextState);
  };

  return (
    <button
      type="button"
      aria-label={isActive ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isActive}
      onClick={handleClick}
      className={`p-2 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 ${
        isActive
          ? "text-red-600 hover:text-red-700 bg-red-50/70"
          : "text-stone-400 hover:text-red-600 bg-white/80"
      } ${animating ? "animate-heart-pop" : ""} ${className}`}
      {...props}
    >
      <WishlistIcon
        size={size}
        className={isActive ? "fill-red-600 text-red-600" : "text-current"}
      />
    </button>
  );
}
