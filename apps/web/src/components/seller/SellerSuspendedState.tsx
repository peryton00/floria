"use client";

import Link from "next/link";
import { useSeller } from "@/lib/contexts/SellerContext";

export function SellerSuspendedState() {
  const { sellerProfile, logout } = useSeller();

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-error-100 shadow-sm p-8 md:p-10 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-error-100 flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-error-600">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-error-100 text-error-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-error-600" />
          Account Suspended
        </div>

        <h1 className="font-serif text-2xl font-bold text-ink-900 mb-3 leading-tight">
          Seller Account Suspended
        </h1>

        {sellerProfile && (
          <p className="text-sm font-semibold text-ink-700 mb-2">
            {sellerProfile.business_name}
          </p>
        )}

        <p className="text-sm text-ink-500 leading-relaxed mb-8">
          Your nursery account is currently unavailable for marketplace operations.
          Product listing, inventory management, order processing, and earnings actions
          are disabled until this is resolved.
        </p>

        <div className="bg-error-100 rounded-xl p-5 text-left mb-8">
          <p className="text-xs font-bold text-error-600 mb-2">What this means</p>
          <ul className="space-y-1.5">
            {[
              "Your product listings are hidden from the storefront",
              "You cannot accept or process new orders",
              "Existing order fulfilment is paused",
              "Earnings and payout actions are unavailable",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-ink-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-error-600 mt-px flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:support@floria.in?subject=Account%20Suspension%20Inquiry"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-forest-700"
          >
            Contact Support
          </a>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-ink-200 hover:border-ink-400 text-ink-600 text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-forest-700"
          >
            Sign Out
          </button>
        </div>

        <p className="text-[11px] text-ink-300 mt-8">
          Email:{" "}
          <a
            href="mailto:support@floria.in"
            className="text-forest-700 hover:text-forest-900 font-semibold"
          >
            support@floria.in
          </a>
        </p>
      </div>
    </div>
  );
}
