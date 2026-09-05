"use client";

import React from "react";
import {
  Plant,
  FlowerTulip,
  Wrench,
  PottedPlant,
  Drop,
  Sparkle,
} from "@phosphor-icons/react";

interface CategoryBadge {
  id: string;
  name: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryBadge[] = [
  { id: "plants", name: "Plants & Nurseries", icon: Plant },
  { id: "flowers", name: "Bouquets & Flowers", icon: FlowerTulip },
  { id: "tools", name: "Gardening Tools", icon: Wrench },
  { id: "pots", name: "Pots & Planters", icon: PottedPlant },
  { id: "soils", name: "Soils & Fertilizers", icon: Drop },
  { id: "more", name: "And More", icon: Sparkle },
];

export function HeroCategoryStrip() {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
          Businesses we empower:
        </span>
      </div>
      {/* Scroll container on mobile, flex wrap on desktop */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream-50 border border-cream-300 text-ink-800 text-xs font-semibold whitespace-nowrap shadow-2xs hover:border-forest-400 hover:bg-forest-50/50 hover:text-forest-900 transition-all cursor-default select-none shrink-0"
            >
              <Icon size={14} weight="duotone" className="text-forest-700 shrink-0" />
              <span>{cat.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
