"use client";

import { useSeller } from "@/lib/contexts/SellerContext";
import { SellerStatusBadge } from "./SellerStatusBadge";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface SellerHeaderProps {
  onMenuToggle: () => void;
}

export function SellerHeader({ onMenuToggle }: SellerHeaderProps) {
  const { sellerProfile, sellerStatus, logout } = useSeller();

  return (
    <header className="h-14 bg-floria-linen/90 backdrop-blur-md border-b border-floria-border flex items-center justify-between px-4 lg:px-6 z-20 sticky top-0 font-ui shadow-2xs">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="lg:hidden text-ink-600 hover:text-ink-900 p-1.5 -ml-1 rounded-xl hover:bg-floria-sand transition-colors focus:outline-none focus:ring-2 focus:ring-forest-800"
        aria-label="Toggle navigation menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page context — visible on mobile when sidebar is hidden */}
      <div className="lg:hidden">
        <span className="font-serif text-sm font-bold text-ink-900">Seller Studio</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3 ml-auto">
        <NotificationBell userRole="seller" />

        {/* Nursery info + status */}
        {sellerProfile && (
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-ink-900 leading-tight">
                {sellerProfile.business_name}
              </p>
              {sellerStatus && (
                <div className="mt-0.5 flex justify-end">
                  <SellerStatusBadge status={sellerStatus} size="sm" />
                </div>
              )}
            </div>
            {/* Avatar */}
            <button
              type="button"
              onClick={logout}
              title="Click to sign out"
              className="w-9 h-9 rounded-xl bg-forest-50 border border-forest-200/80 flex items-center justify-center font-bold text-xs text-forest-800 hover:bg-forest-100 hover:scale-105 active:scale-95 transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-forest-800"
              aria-label={`${sellerProfile.business_name} — click to sign out`}
            >
              {sellerProfile.business_name.charAt(0).toUpperCase()}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
