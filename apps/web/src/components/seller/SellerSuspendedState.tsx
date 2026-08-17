"use client";

import Link from "next/link";
import { useSeller } from "@/lib/contexts/SellerContext";

export function SellerSuspendedState() {
  const { sellerProfile, logout } = useSeller();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-floria-page flex flex-col items-center justify-center px-4 py-12 font-ui">
      <div className="max-w-lg w-full bg-floria-linen rounded-3xl border border-rose-200 shadow-xs p-8 sm:p-10 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-5 text-rose-700 shadow-2xs">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          Account Suspended
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mb-2 leading-tight">
          Seller Account Suspended
        </h1>

        {sellerProfile && (
          <p className="text-xs font-bold text-forest-800 mb-3">
            {sellerProfile.business_name}
          </p>
        )}

        <p className="text-xs sm:text-sm text-ink-500 leading-relaxed mb-6">
          Your nursery account is currently unavailable for marketplace operations.
          Product listing, inventory management, and order fulfillment actions
          are locked until this issue is resolved.
        </p>

        <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-5 text-left mb-6 space-y-2">
          <p className="text-xs font-bold text-rose-900 uppercase tracking-wider">What this means</p>
          <ul className="space-y-1.5">
            {[
              "Your product listings are hidden from the storefront",
              "You cannot accept or process new customer orders",
              "Existing order fulfillment operations are paused",
              "Earnings and payout requests are temporarily held",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-ink-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-600 mt-0.5 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:support@floria.in?subject=Account%20Suspension%20Inquiry"
            style={{ color: "#ffffff" }}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-forest-800 hover:bg-forest-900 !text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-forest-800"
          >
            Contact Support
          </a>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-floria-border hover:bg-floria-sand text-ink-700 text-xs font-bold uppercase tracking-wider transition-all focus:outline-none"
          >
            Sign Out
          </button>
        </div>

        <p className="text-xs text-ink-400 mt-6">
          Email:{" "}
          <a
            href="mailto:support@floria.in"
            className="text-forest-800 hover:underline font-bold"
          >
            support@floria.in
          </a>
        </p>
      </div>
    </div>
  );
}
