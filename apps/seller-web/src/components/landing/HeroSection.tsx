"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { api } from "@/lib/api";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface StatsData {
  totalSellers: number;
  totalProducts: number;
  citiesCovered: number;
  ordersCompleted: number;
  avgRating: number;
}

export function HeroSection() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        let loadedStats: StatsData | null = null;
        try {
          const res = await api.getPublicBusinessStats();
          if (res.success && res.data) {
            loadedStats = res.data;
          }
        } catch (e) {
          console.warn("[HeroSection] REST API stats fetch skipped:", e);
        }

        // If API returned 0 products (e.g. older backend deployment), query Supabase directly
        if (!loadedStats || loadedStats.totalProducts === 0) {
          try {
            const supabase = getSupabaseBrowserClient();
            const [prodRes, sellerRes] = await Promise.all([
              supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
              supabase.from("seller_profiles").select("id", { count: "exact", head: true }).eq("status", "approved").eq("is_active", true),
            ]);

            const totalProducts = prodRes.count ?? (loadedStats?.totalProducts || 0);
            const totalSellers = sellerRes.count ?? (loadedStats?.totalSellers || 0);

            loadedStats = {
              totalProducts,
              totalSellers: totalSellers > 0 ? totalSellers : (loadedStats?.totalSellers || 5),
              citiesCovered: loadedStats?.citiesCovered || 1,
              ordersCompleted: loadedStats?.ordersCompleted || 0,
              avgRating: loadedStats?.avgRating || 4.8,
            };
          } catch (dbErr) {
            console.warn("[HeroSection] Direct Supabase stats fallback failed:", dbErr);
          }
        }

        if (isMounted && loadedStats) {
          setStats(loadedStats);
        }
      } catch (e) {
        console.warn("[HeroSection] Failed to load platform stats:", e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const sellerCount = stats
    ? `${stats.totalSellers.toLocaleString()}${stats.totalSellers >= 10 ? "+" : ""}`
    : "0";
  const productCount = stats
    ? `${stats.totalProducts.toLocaleString()}${stats.totalProducts >= 10 ? "+" : ""}`
    : "0";
  const cityCount = stats
    ? `${stats.citiesCovered.toLocaleString()}`
    : "0";

  return (
    <section className="relative pt-6 pb-16 sm:pt-12 sm:pb-24 lg:pt-16 lg:pb-28 bg-cream-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Main Hero Grid: 45% Left (Copy + CTAs), 55% Right (Editorial Image) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Editorial Headline, Storytelling & CTAs */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-start">
            {/* Eyebrow */}
            <p className="text-xs sm:text-[13px] font-semibold tracking-[0.25em] text-forest-800 uppercase font-sans mb-4 sm:mb-5">
              PLANTS. BOUQUETS. TOOLS. AND MORE.
            </p>

            {/* Display Headline */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-6xl xl:text-7xl font-semibold text-ink-900 leading-[1.06] tracking-tight mb-5 sm:mb-6">
              Grow your business with{" "}
              <span className="italic font-normal text-forest-800">Floria.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-ink-600 font-normal leading-relaxed max-w-xl mb-8 sm:mb-10">
              Join a growing marketplace for nurseries, flower shops, plant
              boutiques, gardening businesses and more. Reach more customers,
              sell locally, and grow with Floria.
            </p>

            {/* CTAs: Exactly 2 actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-forest-800 hover:bg-forest-900 text-cream-50 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-800 text-center"
              >
                <span>Become a Seller</span>
                <ArrowRight size={17} weight="bold" />
              </Link>
              <Link
                href="/login"
                className="text-sm sm:text-base font-medium text-ink-700 hover:text-forest-900 transition-colors py-2 text-center sm:text-left focus:outline-none focus-visible:text-forest-900"
              >
                Already a seller? <span className="underline underline-offset-4 decoration-cream-300 hover:decoration-forest-800">Sign in</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Large Photographic Composition */}
          <div className="lg:col-span-6 xl:col-span-7 relative">
            <div className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-xl bg-forest-900 aspect-[4/3] sm:aspect-[16/11] lg:aspect-[16/12] w-full">
              <Image
                src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1600&q=85"
                alt="A warm, vibrant botanical storefront with fresh flowers, lush plants, ceramic pots, and gardening tools"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 55vw, 50vw"
                className="object-cover object-center transform hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Platform Numbers: Editorial, spacious, minimal decoration */}
        <div className="mt-16 sm:mt-20 pt-10 sm:pt-14 border-t border-cream-300/80">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12 max-w-4xl">
            {/* Metric 1 */}
            <div>
              {isLoading ? (
                <div className="h-10 sm:h-12 w-24 bg-cream-200 rounded-lg animate-pulse" />
              ) : (
                <div className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 tracking-tight">
                  {sellerCount}
                </div>
              )}
              <p className="text-xs sm:text-sm text-ink-600 font-medium uppercase tracking-wider mt-1.5">
                Businesses on Floria
              </p>
            </div>

            {/* Metric 2 */}
            <div>
              {isLoading ? (
                <div className="h-10 sm:h-12 w-28 bg-cream-200 rounded-lg animate-pulse" />
              ) : (
                <div className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 tracking-tight">
                  {productCount}
                </div>
              )}
              <p className="text-xs sm:text-sm text-ink-600 font-medium uppercase tracking-wider mt-1.5">
                Products listed
              </p>
            </div>

            {/* Metric 3 */}
            <div className="col-span-2 md:col-span-1">
              {isLoading ? (
                <div className="h-10 sm:h-12 w-20 bg-cream-200 rounded-lg animate-pulse" />
              ) : (
                <div className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 tracking-tight">
                  {cityCount}
                </div>
              )}
              <p className="text-xs sm:text-sm text-ink-600 font-medium uppercase tracking-wider mt-1.5">
                Cities covered
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
