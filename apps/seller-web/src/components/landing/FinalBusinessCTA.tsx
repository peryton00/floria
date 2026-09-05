"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

export function FinalBusinessCTA() {
  return (
    <section className="py-24 sm:py-32 lg:py-40 bg-forest-900 text-cream-50 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] tracking-tight mb-6">
          Ready to grow your business with Floria?
        </h2>

        <p className="text-lg sm:text-xl text-forest-200 font-normal leading-relaxed max-w-2xl mx-auto mb-10 sm:mb-12">
          Join businesses across plants, flowers, gardening and more.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-4 bg-cream-50 hover:bg-cream-100 text-forest-900 text-base font-semibold rounded-xl shadow-lg transition-all active:scale-98"
          >
            <span>Become a Seller</span>
            <ArrowRight size={17} weight="bold" />
          </Link>
          <Link
            href="/login"
            className="text-sm sm:text-base font-medium text-cream-200 hover:text-cream-50 transition-colors py-2"
          >
            Already selling on Floria? <span className="underline underline-offset-4 decoration-forest-600 hover:decoration-cream-100">Sign in</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
