"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  SellersIcon,
  ProductsIcon,
  CategoriesIcon,
  OrdersIcon,
  LogisticsIcon,
  UsersIcon,
  FinanceIcon,
  AuditIcon,
  HealthIcon,
  SettingsIcon,
} from "@/components/ui/Icons";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Nursery Partners", href: "/sellers", icon: SellersIcon },
  { label: "Catalog Moderation", href: "/products", icon: ProductsIcon },
  { label: "Category Taxonomy", href: "/categories", icon: CategoriesIcon },
  { label: "Order Oversight", href: "/orders", icon: OrdersIcon },
  { label: "Delivery Logistics", href: "/operations", icon: LogisticsIcon },
  { label: "User Management", href: "/users", icon: UsersIcon },
  { label: "Finance & Ledger", href: "/finance", icon: FinanceIcon },
  { label: "Audit Logs", href: "/audit-logs", icon: AuditIcon },
  { label: "System Health", href: "/system-health", icon: HealthIcon },
  { label: "Platform Settings", href: "/settings", icon: SettingsIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-cream-50 border-r border-cream-300 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-ink-500">
          Governance & Oversight
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-forest-900 text-white shadow-xs"
                  : "text-ink-700 hover:bg-cream-200/80 hover:text-forest-900"
              }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-forest-200" : "text-ink-500"}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-3 bg-cream-200/60 rounded-xl border border-cream-300 text-[11px] text-ink-600 space-y-1">
        <div className="font-bold text-ink-800">Security Notice</div>
        <div className="text-[10px] text-ink-500">
          All administrative mutations are recorded in the immutable audit
          ledger.
        </div>
      </div>
    </aside>
  );
}
