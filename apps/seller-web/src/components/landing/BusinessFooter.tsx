"use client";

import React from "react";
import Link from "next/link";

export function BusinessFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-cream-100 border-t border-cream-300/80 pt-16 pb-12 text-ink-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-14 pb-14 border-b border-cream-300/80">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-forest-900">
                Floria
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-forest-800">
                Business
              </span>
            </div>
            <p className="font-serif italic text-base text-ink-600">
              Discover. Choose. Grow.
            </p>
            <p className="text-xs sm:text-sm text-ink-500 font-normal leading-relaxed max-w-sm">
              Connecting local nurseries, florists, potters, and gardening
              merchants with plant lovers everywhere.
            </p>
          </div>

          {/* For Businesses */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-900">
              For Businesses
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-ink-600">
              <li>
                <Link href="/register" className="hover:text-forest-900 transition-colors">
                  Become a Seller
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-forest-900 transition-colors">
                  Seller Sign In
                </Link>
              </li>
              <li>
                <a href="#why-floria" className="hover:text-forest-900 transition-colors">
                  Why Floria
                </a>
              </li>
              <li>
                <a href="#workspace" className="hover:text-forest-900 transition-colors">
                  Seller Cockpit
                </a>
              </li>
            </ul>
          </div>

          {/* Marketplace */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-900">
              Marketplace
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-ink-600">
              <li>
                <a href="#categories" className="hover:text-forest-900 transition-colors">
                  Categories
                </a>
              </li>
              <li>
                <a href="#top-businesses" className="hover:text-forest-900 transition-colors">
                  Top Businesses
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-forest-900 transition-colors">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-900">
              Company & Legal
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-ink-600">
              <li>
                <Link href="/seller/documents" className="hover:text-forest-900 transition-colors">
                  Partner Terms
                </Link>
              </li>
              <li>
                <span className="text-ink-500">Privacy Policy</span>
              </li>
              <li>
                <span className="text-ink-500">Support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-500">
          <p>© {currentYear} Floria Technologies Inc. All rights reserved.</p>
          <p className="italic font-serif text-ink-600">
            A marketplace for botanical living.
          </p>
        </div>
      </div>
    </footer>
  );
}
