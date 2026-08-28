"use client";

import React from "react";
import Link from "next/link";
import { AlertIcon, DocumentIcon, UserIcon } from "@/components/ui/Icons";
import { useSellerAuth } from "@/lib/contexts/SellerAuthContext";

export function SellerPendingState() {
  const { sellerProfile, signOut } = useSellerAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-cream-50 border border-cream-300 rounded-2xl p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-warning-100 text-warning-700 flex items-center justify-center mx-auto border border-warning-200">
          <AlertIcon size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-ink-900">
            Application Under Review
          </h1>
          <p className="text-sm text-ink-600">
            Welcome,{" "}
            <span className="font-semibold text-ink-800">
              {sellerProfile?.business_name || "Partner"}
            </span>
            ! Your nursery partner application is currently being evaluated by
            the Floria Operations Team.
          </p>
        </div>

        <div className="bg-cream-200/60 rounded-xl p-4 text-xs text-ink-600 text-left space-y-2 border border-cream-300">
          <div className="font-bold uppercase tracking-wider text-ink-800 flex items-center gap-1.5">
            <DocumentIcon size={14} className="text-forest-700" /> Required
            Verifications:
          </div>
          <ul className="list-disc pl-4 space-y-1">
            <li>Nursery business address inspection</li>
            <li>Plant phytosanitary & trade license check</li>
            <li>Bank account settlement verification</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/profile"
            className="w-full py-2.5 px-4 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <UserIcon size={14} /> Review Nursery Profile
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="w-full py-2.5 px-4 bg-cream-200 hover:bg-cream-300 text-ink-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
