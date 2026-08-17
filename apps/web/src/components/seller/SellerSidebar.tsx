"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSeller } from "@/lib/contexts/SellerContext";
import { SellerStatusBadge } from "./SellerStatusBadge";
import {
  LayoutDashboard,
  ShoppingBag,
  Leaf,
  Boxes,
  FolderTree,
  DollarSign,
  History,
  BarChart3,
  Star,
  User,
  FileText,
  Settings
} from "lucide-react";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

const NAV_ITEMS: SidebarItem[] = [
  { label: "Overview",        href: "/seller/dashboard",  icon: <LayoutDashboard size={18} /> },
  { label: "Orders",          href: "/seller/orders",     icon: <ShoppingBag size={18} /> },
  { label: "Products",        href: "/seller/products",   icon: <Leaf size={18} /> },
  { label: "Inventory",       href: "/seller/inventory",  icon: <Boxes size={18} /> },
  { label: "Categories",      href: "/seller/categories", icon: <FolderTree size={18} /> },
  { label: "Earnings",        href: "/seller/earnings",   icon: <DollarSign size={18} /> },
  { label: "Payouts",         href: "/seller/payouts",    icon: <History size={18} /> },
  { label: "Analytics",       href: "/seller/analytics",  icon: <BarChart3 size={18} /> },
  { label: "Reviews",         href: "/seller/reviews",    icon: <Star size={18} /> },
  { label: "Nursery Profile", href: "/seller/profile",    icon: <User size={18} /> },
  { label: "Documents",       href: "/seller/documents",  icon: <FileText size={18} /> },
  { label: "Settings",        href: "/seller/settings",   icon: <Settings size={18} /> },
];

interface SellerSidebarProps {
  onClose?: () => void;
}

export function SellerSidebar({ onClose }: SellerSidebarProps) {
  const pathname = usePathname();
  const { sellerProfile, sellerStatus, isApproved } = useSeller();

  return (
    <aside
      className="w-64 bg-gradient-to-b from-[#183023] via-[#1E3A2B] to-[#14261C] text-white/80 flex flex-col flex-shrink-0 min-h-screen border-r border-white/10 font-ui shadow-md"
      aria-label="Seller navigation"
    >
      {/* Brand */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="Floria home"
          onClick={onClose}
        >
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform">
            <Image
              src="/floria-logo.png"
              alt="Floria"
              width={20}
              height={20}
              className="object-contain brightness-[5] opacity-95"
            />
          </div>
          <div>
            <span className="font-serif text-sm font-bold text-white tracking-tight leading-none block">
              Floria Nursery
            </span>
            <span className="text-[10px] font-bold text-[#DDE7DD]/70 uppercase tracking-widest leading-tight block mt-0.5">
              Seller Studio
            </span>
          </div>
        </Link>
        {/* Mobile close */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
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
        <div className="px-4 py-3.5 border-b border-white/10 bg-black/20 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A4E3B] border border-[#DDE7DD]/30 flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow-2xs">
              {sellerProfile.business_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {sellerProfile.business_name}
              </p>
              {sellerStatus && (
                <div className="mt-1 flex items-center gap-1.5">
                  <SellerStatusBadge status={sellerStatus} size="sm" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Seller portal navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isDisabled = item.comingSoon && !isApproved;

          if (item.comingSoon) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-white/30 cursor-not-allowed"
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
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all focus:outline-none focus:ring-1 focus:ring-white/30",
                isActive
                  ? "bg-white/[0.14] text-white font-bold shadow-2xs border-l-[3px] border-emerald-400 pl-3"
                  : "text-white/75 hover:bg-white/[0.08] hover:text-white",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={isActive ? "text-emerald-300" : "text-white/60"}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to store */}
      <div className="p-3.5 border-t border-white/10 bg-black/10">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Back to Store</span>
          </span>
          <span className="text-[10px] text-white/40">↗</span>
        </Link>
      </div>
    </aside>
  );
}
