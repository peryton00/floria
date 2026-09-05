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

  // Safe fallback demonstration data if database is fresh
  const displayList =
    businesses.length >= 3
      ? businesses
      : [
          {
            id: "1",
            business_name: "Green Leaf Botanical Nursery",
            city: "Raipur",
            state: "Chhattisgarh",
            logo_url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
            business_type: "Plant Nursery",
            rating_summary: { avg_rating: 4.9, review_count: 342 },
          },
          {
            id: "2",
            business_name: "Petals & Stems Floral Studio",
            city: "Bilaspur",
            state: "Chhattisgarh",
            logo_url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
            business_type: "Flower Studio",
            rating_summary: { avg_rating: 4.9, review_count: 218 },
          },
          {
            id: "3",
            business_name: "Clay & Craft Pottery Co.",
            city: "Bhilai",
            state: "Chhattisgarh",
            logo_url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80",
            business_type: "Planter Artisan",
            rating_summary: { avg_rating: 4.8, review_count: 184 },
          },
        ];

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
          {displayList.map((biz) => {
            const rs = Array.isArray(biz.rating_summary)
              ? biz.rating_summary[0]
              : biz.rating_summary;
            const rating = rs?.avg_rating ?? 4.9;
            const reviewCount = rs?.review_count ?? 250;
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
