"use client";

import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { LeafIcon } from "@/components/ui/Icons";

export default function NotFound() {
  return (
    <CustomerShell>
      <main id="main-content" className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-4 text-center">
        {/* Decorative Plant Pot SVG Icon */}
        <div className="relative w-24 h-24 mb-6 text-forest-700/80 bg-forest-50 rounded-full flex items-center justify-center border border-forest-100 shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-12 h-12"
          >
            {/* Plant stems and leaves */}
            <path d="M12 14V8M12 8c0-2 2-3 4-3M12 10c0-2-2-3-4-3M12 12c0-1.5 1.5-2.5 3-2.5" />
            {/* The pot */}
            <path d="M7 14h10l-1 5a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2Z" />
            {/* A small question mark on the pot */}
            <text x="10.5" y="19" className="font-sans text-[6px] font-bold fill-forest-800" stroke="none">?</text>
          </svg>
        </div>

        {/* Heading */}
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 mb-3 tracking-tight">
          Lost in the Foliage
        </h1>
        
        {/* Error Code Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-forest-700 bg-forest-50 border border-forest-100 rounded-full uppercase tracking-wider mb-4 shadow-sm">
          <LeafIcon size={12} />
          Error 404 — Page Not Found
        </span>

        {/* Message */}
        <p className="text-sm text-ink-500 max-w-md mb-8 leading-relaxed">
          The path you followed seems to have withered away, or the page has been transplanted to a different location. Let’s get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
          >
            Go to Home
          </Link>
          <Link
            href="/categories"
            className="inline-flex items-center justify-center px-6 py-3 border border-ink-200 hover:border-ink-400 text-ink-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all focus:outline-none"
          >
            Shop Catalog
          </Link>
        </div>
      </main>
    </CustomerShell>
  );
}
