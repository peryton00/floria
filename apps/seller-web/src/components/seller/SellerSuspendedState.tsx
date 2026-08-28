"use client";

import React from "react";
import { AlertIcon } from "@/components/ui/Icons";
import { useSellerAuth } from "@/lib/contexts/SellerAuthContext";

export function SellerSuspendedState() {
  const { sellerProfile, signOut } = useSellerAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-cream-50 border border-error-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-error-100 text-error-700 flex items-center justify-center mx-auto border border-error-200">
          <AlertIcon size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-error-900">
            Nursery Account Suspended
          </h1>
          <p className="text-sm text-ink-600">
            The nursery account for{" "}
            <span className="font-semibold text-ink-800">
              {sellerProfile?.business_name}
            </span>{" "}
            has been temporarily suspended by Floria Administration.
          </p>
        </div>

        <p className="text-xs text-ink-500 bg-error-50/50 p-4 rounded-xl border border-error-100">
          Your product listings are hidden from customer search and checkout. If
          you believe this is in error or wish to appeal, please contact
          partner-support@floria.in.
        </p>

        <button
          type="button"
          onClick={signOut}
          className="w-full py-2.5 px-4 bg-ink-800 hover:bg-ink-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
