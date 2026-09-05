"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Plant, Sparkle } from "@phosphor-icons/react";

export function FinalBusinessCTA() {
  return (
    <section className="py-16 sm:py-24 bg-cream-100 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="bg-forest-900 rounded-3xl p-8 sm:p-14 lg:p-16 text-cream-50 text-center relative overflow-hidden shadow-xl border border-forest-800">
          {/* Subtle background glow */}
          <div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-forest-700/40 blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-forest-800/40 blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-800/90 border border-forest-700 text-cream-100 text-xs font-bold uppercase tracking-wider">
              <Sparkle size={13} weight="fill" className="text-amber-400" />
              <span>Join Floria Business</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              Ready to grow your business with Floria?
            </h2>

            <p className="text-base sm:text-lg text-forest-200 leading-relaxed max-w-xl mx-auto">
              Join a growing community of businesses helping people discover more
              ways to grow, garden, decorate, and celebrate.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-cream-50 hover:bg-cream-100 text-forest-900 text-base font-bold rounded-xl shadow-lg transition-all active:scale-98"
              >
                <span>Become a Seller</span>
                <ArrowRight size={18} weight="bold" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 border border-forest-700 hover:bg-forest-800 text-cream-100 text-sm font-semibold rounded-xl transition-colors"
              >
                <span>Already selling on Floria? Sign in</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
