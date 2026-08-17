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
  ToolsIcon,
  PlanterIcon,
  PayoutIcon,
  StarIcon,
  UserGroupIcon,
  ShieldIcon,
  SettingsIcon,
  LogoutIcon,
} from "@/components/ui/Icons";
import { BarChart3 } from "lucide-react";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

const NAV_ITEMS: SidebarItem[] = [
  { label: "Dashboard",       href: "/seller/dashboard",  icon: <GridIcon size={18} /> },
  { label: "Orders",          href: "/seller/orders",     icon: <OrderIcon size={18} /> },
  { label: "Products",        href: "/seller/products",   icon: <LeafIcon size={18} /> },
  { label: "Inventory",       href: "/seller/inventory",  icon: <ToolsIcon size={18} /> },
  { label: "Categories",      href: "/seller/categories", icon: <PlanterIcon size={18} /> },
  { label: "Earnings",        href: "/seller/earnings",   icon: <PayoutIcon size={18} /> },
  { label: "Payouts",         href: "/seller/payouts",    icon: <PayoutIcon size={18} /> },
  { label: "Analytics",       href: "/seller/analytics",  icon: <BarChart3 size={18} /> },
  { label: "Reviews",         href: "/seller/reviews",    icon: <StarIcon size={18} /> },
  { label: "Nursery Profile", href: "/seller/profile",    icon: <UserGroupIcon size={18} /> },
  { label: "Documents",       href: "/seller/documents",  icon: <ShieldIcon size={18} /> },
  { label: "Settings",        href: "/seller/settings",   icon: <SettingsIcon size={18} /> },
];

interface SellerSidebarProps {
  onClose?: () => void;
}

export function SellerSidebar({ onClose }: SellerSidebarProps) {
  const pathname = usePathname();
  const { sellerProfile, sellerStatus, logout } = useSeller();

  const businessName = sellerProfile?.business_name || "Nursery Partner";

  return (
    <aside
      className="w-64 bg-[#1E3A2B] text-white/80 flex flex-col flex-shrink-0 min-h-screen border-r border-white/10 font-sans antialiased"
      aria-label="Seller navigation"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Floria seller dashboard home"
          onClick={onClose}
        >
          <div className="w-8 h-8 rounded bg-[#274D39] border border-[#DDE7DD]/20 flex items-center justify-center p-1.5 flex-shrink-0">
            <Image
              src="/floria-logo.png"
              alt="Floria Logo"
              width={20}
              height={20}
              className="object-contain brightness-[5]"
            />
          </div>
          <div>
            <span className="font-sans text-sm font-bold text-white tracking-tight block leading-tight">
              Floria Console
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#DDE7DD] font-semibold block leading-none mt-0.5">
              Seller Cockpit v2
            </span>
          </div>
        </Link>

        {/* Mobile close */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Close navigation"
          >
            ✕
          </button>
        )}
      </div>

      {/* Nursery Quick Status Pill */}
      {sellerProfile && (
        <div className="px-4 py-3 border-b border-white/10 bg-black/15 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {businessName}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-[#DDE7DD] font-medium truncate mt-0.5 leading-none">
              {sellerStatus === "approved" ? "Verified Partner" : sellerStatus || "Seller"}
            </p>
          </div>
          {sellerStatus && <SellerStatusBadge status={sellerStatus} size="sm" />}
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Seller portal navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold tracking-wide transition-all",
                isActive
                  ? "bg-[#274D39] text-white font-bold shadow-xs border-l-2 border-[#DDE7DD]"
                  : "hover:bg-white/10 hover:text-white text-white/70",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={isActive ? "text-[#DDE7DD]" : "text-white/70"}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/10">
        <div className="min-w-0 pr-2">
          <p className="text-xs font-bold text-white truncate leading-tight">{businessName}</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-[#DDE7DD] font-medium truncate mt-0.5 leading-none">
            Nursery Seller
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          title="Sign out of seller portal"
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          aria-label="Sign out"
        >
          <LogoutIcon size={16} />
        </button>
      </div>
    </aside>
  );
}
