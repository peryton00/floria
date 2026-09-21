"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plant, Star } from "@phosphor-icons/react";
import { api } from "@/lib/api";

interface TopBusiness {
  id: string;
  business_name: string;
  city?: string;
  state?: string;
  logo_url?: string;
  business_type?: string;
  rating_summary?: {
    avg_rating?: number;
    review_count?: number;
    ranking_score?: number;
  };
}

export function TopBusinesses() {
  const [businesses, setBusinesses] = useState<TopBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadTopBusinesses() {
      try {
        const res = await api.getPublicTopBusinesses(3);
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setBusinesses(res.data.slice(0, 3));
        }
      } catch (e) {
        console.warn("[TopBusinesses] Error fetching live businesses:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadTopBusinesses();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <section id="top-businesses" className="py-20 sm:py-28 lg:py-32 bg-cream-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14 sm:mb-20">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 leading-[1.12] tracking-tight">
              Businesses customers love.
            </h2>
            <p className="text-lg sm:text-xl text-ink-600 font-normal leading-relaxed mt-4">
              Discover verified nurseries and plant boutiques growing with Floria.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-4 animate-pulse">
                <div className="rounded-3xl bg-cream-200 aspect-[4/3] sm:aspect-[16/12] w-full" />
                <div className="h-6 bg-cream-200 rounded w-3/4" />
                <div className="h-4 bg-cream-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (businesses.length === 0) {
    return (
      <section id="top-businesses" className="py-16 sm:py-24 bg-cream-100 border-t border-cream-300/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-forest-800 bg-forest-100/70 border border-forest-200 px-3 py-1 rounded-full">
              Pioneer Floria Partner
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink-900">
              Be the first featured nursery in your region
            </h2>
            <p className="text-sm sm:text-base text-ink-600 leading-relaxed">
              Connect your botanical storefront with thousands of local plant enthusiasts across your city.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-forest-800 hover:bg-forest-900 text-cream-50 font-semibold text-sm rounded-xl shadow-xs transition-colors"
              >
                <span>Register Your Nursery</span>
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="top-businesses" className="py-20 sm:py-28 lg:py-32 bg-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-20">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 leading-[1.12] tracking-tight">
            Businesses customers love.
          </h2>
          <p className="text-lg sm:text-xl text-ink-600 font-normal leading-relaxed mt-4">
            Discover some of the businesses already growing with Floria.
          </p>
        </div>

        {/* 3-Column Photographic Discovery Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {businesses.map((biz) => {
            const rs = Array.isArray(biz.rating_summary)
              ? biz.rating_summary[0]
              : biz.rating_summary;
            const rating = rs?.avg_rating ?? 5.0;
            const reviewCount = rs?.review_count ?? 0;
            const location = [biz.city, biz.state].filter(Boolean).join(", ") || "Verified Location";

            return (
              <div
                key={biz.id}
                className="flex flex-col group cursor-default"
              >
                {/* Large Photographic Image Container */}
                <div className="relative rounded-3xl overflow-hidden bg-forest-900 aspect-[4/3] sm:aspect-[16/12] mb-6 shadow-xs group-hover:shadow-md transition-all">
                  {biz.logo_url ? (
                    <Image
                      src={biz.logo_url}
                      alt={biz.business_name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover object-center group-hover:scale-103 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-forest-800 text-cream-50">
                      <Plant size={44} weight="duotone" className="opacity-80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-950/40 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Business Info */}
                <div className="flex flex-col flex-1">
                  <h3 className="font-serif text-2xl font-semibold text-ink-900 group-hover:text-forest-800 transition-colors leading-snug">
                    {biz.business_name}
                  </h3>

                  <p className="text-sm text-ink-600 font-normal mt-1">
                    {location}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-ink-600 font-medium mt-3">
                    <Star size={14} weight="fill" className="text-amber-500" />
                    <span>{rating.toFixed(1)}</span>
                    <span className="text-ink-400">·</span>
                    <span>{reviewCount} reviews</span>
                  </div>

                  <div className="mt-5 pt-4 border-t border-cream-300/60">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-800 hover:text-forest-900 group-hover:translate-x-0.5 transition-all"
                    >
                      <span>Join as a business like this</span>
                      <ArrowRight size={13} weight="bold" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
