"use client";

import Link from "next/link";
import { useSeller } from "@/lib/contexts/SellerContext";

export function SellerSuspendedState() {
  const { sellerProfile, logout } = useSeller();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#F9F8F3] flex flex-col items-center justify-center px-4 py-12 font-sans antialiased text-[#212529]">
      <div className="max-w-lg w-full bg-white rounded border border-red-200 shadow-xs p-8 sm:p-10 text-center">
        {/* Icon */}
        <div className="w-14 h-14 rounded bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4 text-red-700 shadow-xs">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-800 border border-red-200 px-3 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          Account Suspended
        </div>

        <h1 className="font-sans text-xl sm:text-2xl font-bold text-[#0F172A] mb-1.5 tracking-tight">
          Seller Account Suspended
        </h1>

        {sellerProfile && (
          <p className="text-xs font-bold text-[#1B4D3E] mb-3 font-mono">
            {sellerProfile.business_name}
          </p>
        )}

        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Your nursery account is currently unavailable for marketplace operations.
          Product listing, inventory management, and order fulfillment actions
          are locked until this issue is resolved.
        </p>

        <div className="bg-red-50/60 border border-red-100 rounded p-4 text-left mb-6 space-y-2">
          <p className="text-xs font-bold text-red-900 uppercase tracking-wider">What this means</p>
          <ul className="space-y-1.5">
            {[
              "Your product listings are hidden from the storefront",
              "You cannot accept or process new customer orders",
              "Existing order fulfillment operations are paused",
              "Earnings and payout requests are temporarily held",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-slate-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600 mt-0.5 flex-shrink-0">
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
            className="inline-flex items-center justify-center px-5 py-2.5 rounded bg-[#1B4D3E] hover:bg-[#153e31] !text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            Contact Support
          </a>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Sign Out
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Email:{" "}
          <a
            href="mailto:support@floria.in"
            className="text-[#1B4D3E] hover:underline font-bold"
          >
            support@floria.in
          </a>
        </p>
      </div>
    </div>
  );
}

