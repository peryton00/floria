"use client";

import React from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/contexts/AdminAuthContext";
import { LogoutIcon, ShieldCheckIcon, UsersIcon } from "@/components/ui/Icons";

export function AdminHeader() {
  const { user, signOut } = useAdminAuth();

  return (
    <header className="h-16 bg-cream-50 border-b border-cream-300 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-forest-900 text-white font-serif font-bold text-lg flex items-center justify-center shadow-xs">
            F
          </div>
          <span className="font-serif font-bold text-lg text-ink-900 tracking-tight">
            Floria{" "}
            <span className="font-sans text-xs font-semibold text-forest-800 uppercase tracking-widest ml-1">
              Admin Console
            </span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-ink-900 leading-tight">
                {user.fullName || user.email || "Admin"}
              </span>
              <span className="text-[10px] font-mono text-forest-800 uppercase font-semibold">
                {user.role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs border border-forest-200">
              <ShieldCheckIcon size={16} />
            </div>
          </div>
        )}

        <div className="h-4 w-px bg-cream-300 hidden sm:block" />

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
