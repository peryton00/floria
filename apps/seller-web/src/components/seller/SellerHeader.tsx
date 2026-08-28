"use client";

import React from "react";
import Link from "next/link";
import { useSellerAuth } from "@/lib/contexts/SellerAuthContext";
import { SellerStatusBadge } from "./SellerStatusBadge";
import { LogoutIcon, UserIcon, StoreIcon } from "@/components/ui/Icons";

export function SellerHeader() {
  const { sellerProfile, signOut } = useSellerAuth();

  return (
    <header className="h-16 bg-cream-50 border-b border-cream-300 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-forest-800 text-white font-serif font-bold text-lg flex items-center justify-center shadow-xs">
            F
          </div>
          <span className="font-serif font-bold text-lg text-forest-900 tracking-tight">
            Floria{" "}
            <span className="font-sans text-xs font-semibold text-terracotta-700 uppercase tracking-widest ml-1">
              Seller
            </span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {sellerProfile && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-ink-900 leading-tight">
                {sellerProfile.business_name}
              </span>
              <span className="text-[10px] text-ink-500">
                {sellerProfile.contact_email}
              </span>
            </div>
            <SellerStatusBadge status={sellerProfile.status} />
          </div>
        )}

        <div className="h-4 w-px bg-cream-300 hidden sm:block" />

        <Link
          href="/profile"
          className="p-2 text-ink-600 hover:text-forest-800 hover:bg-cream-200 rounded-lg transition-colors"
          title="Nursery Profile"
        >
          <UserIcon size={18} />
        </Link>

        <button
          type="button"
          onClick={signOut}
          className="p-2 text-ink-600 hover:text-error-700 hover:bg-error-50 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogoutIcon size={18} />
        </button>
      </div>
    </header>
  );
}
