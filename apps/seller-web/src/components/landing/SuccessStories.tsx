"use client";

import React from "react";
import Image from "next/image";

export function SuccessStories() {
  return (
    <section className="py-20 sm:py-28 bg-cream-100 border-t border-cream-300/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Authentic Photography */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-lg bg-forest-900 aspect-[4/3] sm:aspect-[16/12]">
              <Image
                src="https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&w=1000&q=80"
                alt="Florist preparing bespoke botanical orders in her workshop"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover object-center"
              />
            </div>
          </div>

          {/* Right Column: Editorial Quote */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-800 mb-4">
              Partner Perspective
            </span>
            <blockquote className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal italic text-ink-900 leading-snug">
              “Floria connected our small greenhouse with hundreds of local plant
              lovers who appreciate curated, healthy greenery. It transformed how
              we do business in our city.”
            </blockquote>
            <div className="mt-6">
              <p className="font-semibold text-base text-ink-900">
                Aarav & Meera Sharma
              </p>
              <p className="text-sm text-ink-600 font-normal">
                Founders, The Botanical Shed · Raipur
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
