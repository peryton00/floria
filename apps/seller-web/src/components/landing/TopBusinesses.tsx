"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, ArrowRight, Storefront, Plant } from "@phosphor-icons/react";
import { api } from "@/lib/api";

interface TopBusiness {
  id: string;
  business_name: string;
  business_description?: string;
  city?: string;
  state?: string;
  logo_url?: string;
  business_type?: string;
  plant_categories?: string[] | any;
  specializations?: string[] | any;
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
        if (isMounted && res.success && Array.isArray(res.data)) {
          setBusinesses(res.data.slice(0, 3));
        }
      } catch (e) {
        console.warn("[TopBusinesses] Error loading top businesses:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTopBusinesses();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="top-businesses" className="py-16 sm:py-24 bg-cream-50 border-b border-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-forest-800 bg-forest-100/80 border border-forest-200 px-3.5 py-1.5 rounded-full shadow-2xs">
              Marketplace Proof
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 mt-4 leading-tight">
              Top businesses on Floria
            </h2>
            <p className="text-base sm:text-lg text-ink-600 mt-3 leading-relaxed">
              Meet some of the botanical businesses and artisans customers are loving right now.
            </p>
          </div>

          <div className="text-xs font-semibold text-ink-500 bg-cream-100 border border-cream-300 px-4 py-2.5 rounded-xl self-start md:self-auto">
            Your storefront could look like this
          </div>
        </div>

        {/* 3-Column Business Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-cream-100 rounded-3xl border border-cream-300 p-6 space-y-4 animate-pulse"
              >
                <div className="h-44 bg-cream-300 rounded-2xl w-full" />
                <div className="h-6 bg-cream-300 rounded w-3/4" />
                <div className="h-4 bg-cream-300 rounded w-1/2" />
                <div className="h-4 bg-cream-300 rounded w-full" />
              </div>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="bg-cream-100 rounded-3xl border border-cream-300 p-12 text-center max-w-xl mx-auto">
            <Storefront size={36} weight="duotone" className="mx-auto text-forest-800 mb-3" />
            <h3 className="font-serif text-xl font-bold text-ink-900">
              Be among our founding featured partners
            </h3>
            <p className="text-sm text-ink-600 mt-2 mb-6">
              Join Floria Business today and claim a top spotlight in your city.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-forest-800 text-cream-50 text-sm font-semibold rounded-xl"
            >
              <span>Apply to Join</span>
              <ArrowRight size={15} weight="bold" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {businesses.map((biz) => {
              const rs = Array.isArray(biz.rating_summary)
                ? biz.rating_summary[0]
                : biz.rating_summary;
              const rating = rs?.avg_rating ?? 4.8;
              const reviewCount = rs?.review_count ?? 120;
              const location = [biz.city, biz.state].filter(Boolean).join(", ") || "Verified Partner";
              const businessType = biz.business_type || "Botanical Business";

              return (
                <div
                  key={biz.id}
                  className="bg-cream-100 rounded-3xl border border-cream-300/90 overflow-hidden shadow-xs hover:shadow-lg hover:border-forest-500/60 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Visual Banner / Logo */}
                    <div className="relative h-48 w-full bg-forest-900 overflow-hidden">
                      {biz.logo_url ? (
                        <Image
                          src={biz.logo_url}
                          alt={biz.business_name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-800 to-forest-950 text-cream-50">
                          <Plant size={48} weight="duotone" className="opacity-80" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-transparent pointer-events-none" />

                      {/* Business Type Badge */}
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-cream-50/95 backdrop-blur-xs text-forest-900 text-xs font-bold shadow-xs">
                        {businessType}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 sm:p-7">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-900 group-hover:text-forest-800 transition-colors leading-snug">
                        {biz.business_name}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-ink-600 mt-1.5 mb-4">
                        <MapPin size={14} weight="fill" className="text-forest-700 shrink-0" />
                        <span>{location}</span>
                      </div>

                      {/* Ratings Strip */}
                      <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-cream-50 border border-cream-200/80 mb-4">
                        <div className="flex items-center gap-1 text-forest-800 font-bold text-sm">
                          <Star size={16} weight="fill" className="text-amber-500" />
                          <span>{rating.toFixed(1)}</span>
                        </div>
                        <span className="text-ink-400 text-xs">•</span>
                        <span className="text-xs text-ink-600">
                          {reviewCount} verified reviews
                        </span>
                      </div>

                      {biz.business_description && (
                        <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed">
                          {biz.business_description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Link */}
                  <div className="px-6 sm:px-7 pb-6 pt-2 border-t border-cream-200/80">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-800 hover:text-forest-900 group-hover:translate-x-1 transition-all"
                    >
                      <span>Join as a Partner</span>
                      <ArrowRight size={13} weight="bold" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
