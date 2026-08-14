"use client";

import { useSeller } from "@/lib/contexts/SellerContext";
import { SellerStatusBadge } from "./SellerStatusBadge";
import { BellIcon } from "@/components/ui/Icons";

interface SellerHeaderProps {
  onMenuToggle: () => void;
}

export function SellerHeader({ onMenuToggle }: SellerHeaderProps) {
  const { sellerProfile, sellerStatus, logout } = useSeller();

  return (
    <header className="h-14 bg-white border-b border-ink-100 flex items-center justify-between px-4 lg:px-6 z-20 sticky top-0">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="lg:hidden text-ink-500 hover:text-ink-900 p-1.5 -ml-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-700"
        aria-label="Toggle navigation menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page context — visible on mobile when sidebar is hidden */}
      <div className="lg:hidden">
        <span className="font-serif text-sm font-semibold text-ink-900">Seller Portal</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notification placeholder */}
        <button
          type="button"
          className="relative text-ink-400 hover:text-ink-700 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-forest-700"
          aria-label="Notifications (coming soon)"
          title="Notifications (coming soon)"
        >
          <BellIcon size={18} />
        </button>

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
              title="Click to sign out (demo)"
              className="w-8 h-8 rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center font-bold text-xs text-forest-700 hover:bg-forest-100 transition-colors focus:outline-none focus:ring-2 focus:ring-forest-700"
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
