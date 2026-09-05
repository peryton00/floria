"use client";

import React, { useEffect, useState } from "react";
import {
  Storefront,
  Plant,
  MapPin,
  Star,
  Package,
} from "@phosphor-icons/react";
import { api } from "@/lib/api";

interface StatsData {
  totalSellers: number;
  totalProducts: number;
  citiesCovered: number;
  ordersCompleted: number;
  avgRating: number;
}

export function PlatformStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const res = await api.getPublicBusinessStats();
        if (isMounted && res.success && res.data) {
          setStats(res.data);
        }
      } catch (e) {
        console.warn("[PlatformStats] Failed to load live platform stats:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const items = [
    {
      id: "sellers",
      label: "Active Sellers",
      value: stats?.totalSellers ? `${stats.totalSellers}+` : "100+",
      subtext: "Nurseries, florists & artisans",
      icon: Storefront,
    },
    {
      id: "products",
      label: "Products Listed",
      value: stats?.totalProducts ? `${stats.totalProducts}+` : "2,500+",
      subtext: "Plants, bouquets, tools & pots",
      icon: Plant,
    },
    {
      id: "cities",
      label: "Cities Covered",
      value: stats?.citiesCovered ? `${stats.citiesCovered}` : "12",
      subtext: "Expanding fast across regions",
      icon: MapPin,
    },
    {
      id: "rating",
      label: "Customer Rating",
      value: stats?.avgRating ? `★ ${stats.avgRating.toFixed(1)}` : "★ 4.9",
      subtext: "From verified marketplace buyers",
      icon: Star,
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-cream-50 border-b border-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-forest-800 bg-forest-100/70 border border-forest-200 px-3 py-1 rounded-full">
            Marketplace Scale
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-3">
            Real growth powered by real local businesses
          </h2>
        </div>

        {/* 2-column on mobile, 4-column on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-cream-100 rounded-2xl border border-cream-300/80 p-5 sm:p-6 flex flex-col justify-between hover:border-forest-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
                    {item.label}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-forest-100/80 flex items-center justify-center text-forest-800 group-hover:bg-forest-800 group-hover:text-cream-50 transition-colors">
                    <Icon size={16} weight="duotone" />
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-2 py-2 animate-pulse">
                    <div className="h-8 bg-cream-300 rounded-md w-24" />
                    <div className="h-3 bg-cream-300 rounded-md w-32" />
                  </div>
                ) : (
                  <div>
                    <div className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-ink-900 tracking-tight">
                      {item.value}
                    </div>
                    <p className="text-xs text-ink-500 mt-1">
                      {item.subtext}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
