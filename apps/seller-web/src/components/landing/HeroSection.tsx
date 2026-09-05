"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkle, Storefront, Plant } from "@phosphor-icons/react";
import { HeroCategoryStrip } from "./HeroCategoryStrip";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-20 lg:pt-16 lg:pb-24 bg-cream-100 border-b border-cream-300">
      {/* Subtle warm decorative background blobs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-forest-100/50 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-cream-300/40 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Editorial Copy, CTAs & Categories */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 sm:space-y-8">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-100/80 border border-forest-300/60 text-forest-900 text-xs font-bold uppercase tracking-widest shadow-2xs">
              <Sparkle size={14} weight="fill" className="text-forest-700" />
              <span>PLANTS · BOUQUETS · TOOLS · AND MORE</span>
            </div>

            {/* Primary Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-ink-900 leading-[1.12] tracking-tight">
              Grow your business with{" "}
              <span className="text-forest-800 italic">Floria.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-ink-600 leading-relaxed max-w-xl">
              Join a growing marketplace for nurseries, flower shops, plant
              boutiques, gardening businesses and more. Reach more customers, sell
              locally, and grow with Floria.
            </p>

            {/* CTA Button Group */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-forest-800 hover:bg-forest-900 text-cream-50 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-800"
              >
                <span>Become a Seller</span>
                <ArrowRight size={18} weight="bold" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 border border-cream-400 bg-cream-50 hover:bg-cream-200 text-ink-800 text-sm font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-800"
              >
                <span>Already a seller? Sign in</span>
              </Link>
            </div>

            {/* Trust Assurance micro-strip */}
            <div className="flex items-center gap-5 text-xs text-ink-500 pt-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} weight="duotone" className="text-forest-700" />
                <span>Verified Local Merchants</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Storefront size={16} weight="duotone" className="text-forest-700" />
                <span>Zero Upfront Listing Fees</span>
              </div>
            </div>

            {/* Category Breadth Strip */}
            <div className="w-full pt-4 border-t border-cream-300/80">
              <HeroCategoryStrip />
            </div>
          </div>

          {/* Right Column: Premium Editorial Visual Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Visual Frame */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-cream-50 bg-forest-900 aspect-[4/5] sm:aspect-[4/4.5] lg:aspect-[4/5]">
                <Image
                  src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80"
                  alt="Botanical business owner arranging fresh floral bouquets and indoor plants in a welcoming local storefront"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  className="object-cover object-center transform hover:scale-102 transition-transform duration-700"
                />

                {/* Subtle Image Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-transparent pointer-events-none" />

                {/* Overlaid Editorial Caption Card */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-cream-50/95 backdrop-blur-md border border-cream-300/80 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center shrink-0 border border-forest-200">
                      <Plant size={22} weight="duotone" className="text-forest-800" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-forest-900">
                        Local Partner Ecosystem
                      </p>
                      <p className="text-xs text-ink-600">
                        Connecting passionate growers, florists & artisans with local buyers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Accent Tag behind frame */}
              <div
                className="hidden sm:block absolute -bottom-5 -left-5 p-3 rounded-2xl bg-forest-800 text-cream-50 text-xs font-bold shadow-xl border border-forest-700"
                aria-hidden="true"
              >
                100% Local & Verified
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
