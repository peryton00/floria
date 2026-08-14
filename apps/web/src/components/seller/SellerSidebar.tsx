"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSeller } from "@/lib/contexts/SellerContext";
import { SellerStatusBadge } from "./SellerStatusBadge";
import {
  GridIcon,
  OrderIcon,
  LeafIcon,
  PayoutIcon,
  SettingsIcon,
} from "@/components/ui/Icons";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

const NAV_ITEMS: SidebarItem[] = [
  { label: "Overview",       href: "/seller/dashboard", icon: <GridIcon size={18} /> },
  { label: "Orders",         href: "/seller/orders",    icon: <OrderIcon size={18} /> },
  { label: "Products",       href: "/seller/products",  icon: <LeafIcon size={18} /> },
  { label: "Earnings",       href: "/seller/payouts",   icon: <PayoutIcon size={18} />,  comingSoon: true },
  { label: "Nursery Profile",href: "/seller/profile",   icon: <SettingsIcon size={18} /> },
];

interface SellerSidebarProps {
  onClose?: () => void;
}

export function SellerSidebar({ onClose }: SellerSidebarProps) {
  const pathname = usePathname();
  const { sellerProfile, sellerStatus, isApproved } = useSeller();

  return (
    <aside
      className="w-60 bg-[#1A2B1A] text-white/70 flex flex-col flex-shrink-0 min-h-screen"
      aria-label="Seller navigation"
    >
      {/* Brand */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Floria home"
          onClick={onClose}
        >
          <Image
            src="/floria-logo.png"
            alt="Floria"
            width={22}
            height={22}
            className="object-contain brightness-[5] opacity-80"
          />
          <span className="font-serif text-sm font-semibold text-white tracking-tight leading-none">
            Seller Portal
          </span>
        </Link>
        {/* Mobile close */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-white/50 hover:text-white p-1"
            aria-label="Close navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nursery info */}
      {sellerProfile && (
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-forest-700 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
              {sellerProfile.business_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {sellerProfile.business_name}
              </p>
              {sellerStatus && (
                <div className="mt-1">
                  <SellerStatusBadge status={sellerStatus} size="sm" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5" aria-label="Seller portal navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isDisabled = item.comingSoon && !isApproved;

          if (item.comingSoon) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-white/30 cursor-not-allowed"
                aria-disabled="true"
                title="Available in next phase"
              >
                {item.icon}
                <span>{item.label}</span>
                <span className="ml-auto text-[9px] font-bold bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-white/30",
                isActive
                  ? "bg-forest-700 text-white shadow-sm"
                  : "hover:bg-white/5 hover:text-white",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to store */}
      <div className="p-4 border-t border-white/10">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Store
        </Link>
      </div>
    </aside>
  );
}
