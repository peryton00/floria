"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSellerAuth } from "@/lib/contexts/SellerAuthContext";
import { SellerHeader } from "./SellerHeader";
import { SellerSidebar } from "./SellerSidebar";
import { SellerPendingState } from "./SellerPendingState";
import { SellerSuspendedState } from "./SellerSuspendedState";

export function SellerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    authState,
    isLoading,
    sellerProfile,
    isApproved,
    isPending,
    isSuspended,
  } = useSellerAuth();

  // Public/Auth routes don't render the portal shell
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return <main className="min-h-screen bg-cream-100">{children}</main>;
  }

  if (isLoading || authState === "INITIALIZING") {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-forest-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
            Loading Seller Portal...
          </span>
        </div>
      </div>
    );
  }

  if (
    authState === "UNAUTHENTICATED" ||
    authState === "SESSION_EXPIRED" ||
    !sellerProfile
  ) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-cream-50 border border-cream-300 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <h1 className="font-serif text-xl font-bold text-ink-900">
            Seller Authentication Required
          </h1>
          <p className="text-xs text-ink-600">
            Please sign in with your verified Floria Nursery Partner account.
          </p>
          <a
            href="/login"
            className="inline-block py-2.5 px-6 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
          >
            Go to Seller Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      <SellerHeader />
      <div className="flex flex-1">
        <SellerSidebar />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {isPending ? (
            <SellerPendingState />
          ) : isSuspended ? (
            <SellerSuspendedState />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
