"use client";

import { useRouter } from "next/navigation";
import { useSeller } from "@/lib/contexts/SellerContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SearchIcon } from "@/components/ui/Icons";

interface SellerHeaderProps {
  onMenuToggle: () => void;
}

export function SellerHeader({ onMenuToggle }: SellerHeaderProps) {
  const { sellerProfile, sellerStatus, logout } = useSeller();
  const router = useRouter();

  const businessName = sellerProfile?.business_name || "Nursery Partner";
  const isApproved = sellerStatus === "approved";

  return (
    <header className="h-14 bg-white border-b border-[#E2DDD5] flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0 shadow-xs font-sans antialiased">
      {/* Mobile hamburger & status badge */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden p-1.5 rounded border border-[#E2DDD5] text-[#212529] hover:bg-[#EFECE4] transition-colors"
          aria-label="Open mobile navigation menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <span
          className={[
            "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border",
            isApproved
              ? "bg-emerald-50 text-[#1E3A2B] border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200",
          ].join(" ")}
        >
          ● {isApproved ? "Nursery Verified" : "Approval Pending"}
        </span>
      </div>

      {/* Search bar on desktop */}
      <div className="hidden md:flex items-center relative w-72 max-w-sm">
        <input
          type="text"
          placeholder="Quick search orders, products, SKUs..."
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-[#E2DDD5] focus:outline-none focus:ring-1 focus:ring-[#1E3A2B] focus:border-[#1E3A2B] bg-[#EFECE4] font-sans placeholder:text-[#6C756F] text-[#212529]"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const target = e.currentTarget.value.trim();
              if (target) {
                router.push(`/seller/orders?search=${encodeURIComponent(target)}`);
              }
            }
          }}
        />
        <SearchIcon size={12} className="absolute left-2.5 text-[#6C756F]" />
      </div>

      {/* Right User & Notification Controls */}
      <div className="flex items-center gap-3.5">
        <NotificationBell userRole="seller" />
        <div className="h-4 w-px bg-[#E2DDD5]" />
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-[#212529] leading-tight truncate max-w-[160px]">
            {businessName}
          </p>
          <p className="font-mono text-[9px] text-[#1E3A2B] font-bold uppercase tracking-wider mt-0.5 leading-none">
            SELLER
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          title="Sign out"
          className="w-7 h-7 rounded bg-[#1E3A2B] text-white flex items-center justify-center font-bold text-xs shadow-xs hover:opacity-90 transition-opacity"
          aria-label="User profile and sign out"
        >
          {businessName.charAt(0).toUpperCase()}
        </button>
      </div>
    </header>
  );
}

