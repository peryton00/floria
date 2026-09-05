"use client";

import React from "react";
import Link from "next/link";
import { Plant, Heart } from "@phosphor-icons/react";

export function BusinessFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-cream-50 border-t border-cream-300 pt-16 pb-12 text-ink-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-cream-300">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-tight text-forest-900">
                FLORIA
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-forest-100 text-forest-800">
                Business
              </span>
            </div>
            <p className="font-serif italic text-base text-ink-600">
              Discover. Choose. Grow.
            </p>
            <p className="text-xs text-ink-500 leading-relaxed max-w-sm">
              Connecting local nurseries, florists, potters, and gardening
              merchants with plant lovers everywhere.
            </p>
          </div>

          {/* Business Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-900">
              Business
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/register" className="hover:text-forest-800 transition-colors">
                  Become a Seller
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-forest-800 transition-colors">
                  Seller Sign In
                </Link>
              </li>
              <li>
                <a href="#why-floria" className="hover:text-forest-800 transition-colors">
                  Why Floria
                </a>
              </li>
              <li>
                <a href="#workspace" className="hover:text-forest-800 transition-colors">
                  Seller Workspace
                </a>
              </li>
            </ul>
          </div>

          {/* Customers Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-900">
              Marketplace
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#categories" className="hover:text-forest-800 transition-colors">
                  Explore Categories
                </a>
              </li>
              <li>
                <a href="#top-businesses" className="hover:text-forest-800 transition-colors">
                  Top Businesses
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-forest-800 transition-colors">
                  Seller FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Company */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-900">
              Company & Legal
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/seller/documents" className="hover:text-forest-800 transition-colors">
                  Partner Terms
                </Link>
              </li>
              <li>
                <span className="text-ink-400">Privacy Policy</span>
              </li>
              <li>
                <span className="text-ink-400">Merchant Guidelines</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-500">
          <p>© {currentYear} Floria Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Crafted for botanical entrepreneurs</span>
            <Plant size={14} weight="fill" className="text-forest-700 ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
}
