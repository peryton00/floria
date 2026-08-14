"use client";

import { useState } from "react";
import { useSeller } from "@/lib/contexts/SellerContext";
import { SellerSidebar } from "./SellerSidebar";
import { SellerHeader } from "./SellerHeader";
import { SellerPendingState } from "./SellerPendingState";
import { SellerSuspendedState } from "./SellerSuspendedState";

interface SellerShellProps {
  children: React.ReactNode;
}

/**
 * SellerShell — wraps all /seller/* pages.
 *
 * Routing logic:
 *   not logged in     → children are the login page (layout handles redirect)
 *   status = pending  → SellerPendingState (profile editing allowed via nav)
 *   status = suspended→ SellerSuspendedState
 *   status = approved → full sidebar + content layout
 *
 * ponytail: status derived from SellerContext which reads localStorage.
 *   Swap for Supabase auth check when backend is live.
 */
export function SellerShell({ children }: SellerShellProps) {
  const { isLoading, isLoggedIn, isPending, isSuspended } = useSeller();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Loading state — brief hydration flash prevention
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-forest-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Loading</p>
        </div>
      </div>
    );
  }

  // Not logged in — render login/register pages without shell chrome
  if (!isLoggedIn) {
    return <>{children}</>;
  }

  // Suspended — restricted view, no sidebar
  if (isSuspended) {
    return <SellerSuspendedState />;
  }

  // Pending — limited view with profile editing
  if (isPending) {
    // Allow /seller/profile access for pending sellers so they can update info
    return (
      <div className="min-h-screen bg-cream-100 flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}
        {/* Sidebar — only shows Overview + Profile for pending sellers */}
        <div
          className={[
            "fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:static lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <SellerSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <SellerHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
          <SellerPendingState />
        </div>
      </div>
    );
  }

  // Approved — full portal
  return (
    <div className="min-h-screen bg-cream-100 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <SellerSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <SellerHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main
          id="seller-main-content"
          className="flex-1 p-4 md:p-6 overflow-y-auto"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
