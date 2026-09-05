"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plant,
  ShoppingCart,
  TrendUp,
  Package,
  ArrowRight,
  CheckCircle,
  CurrencyInr,
} from "@phosphor-icons/react";

interface WorkspaceTab {
  id: string;
  name: string;
  headline: string;
  description: string;
  mockup: React.ReactNode;
}

export function BusinessWorkspacePreview() {
  const [activeTabId, setActiveTabId] = useState("products");

  const tabs: WorkspaceTab[] = [
    {
      id: "products",
      name: "Products & Inventory",
      headline: "Live catalog & instant inventory adjustments",
      description:
        "Easily publish new plants, flowers, pots, and gardening tools. Update prices, stock counts, and care details anytime from mobile or desktop.",
      mockup: (
        <div className="space-y-3 font-sans text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-cream-300">
            <span className="font-semibold text-ink-600 uppercase tracking-wider text-[11px]">
              Active Inventory (48 items)
            </span>
            <span className="font-medium text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px]">
              In Stock & Live
            </span>
          </div>

          {[
            {
              name: "Fiddle Leaf Fig (Ficus lyrata)",
              category: "Indoor Plants",
              stock: "18 in stock",
              price: "₹1,150",
            },
            {
              name: "Handmade Terracotta Planter",
              category: "Pots & Planters",
              stock: "32 in stock",
              price: "₹580",
            },
            {
              name: "Wildflower Garden Bouquet",
              category: "Floral",
              stock: "8 in stock",
              price: "₹890",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-cream-50 border border-cream-200/80"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-forest-100 flex items-center justify-center text-forest-800 font-bold text-xs">
                  🌿
                </div>
                <div>
                  <p className="font-semibold text-ink-900">{item.name}</p>
                  <p className="text-[11px] text-ink-500">{item.category} · {item.stock}</p>
                </div>
              </div>
              <div className="text-right font-semibold text-forest-900">
                {item.price}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "orders",
      name: "Orders & Delivery",
      headline: "Seamless dispatch with Floria courier pickup",
      description:
        "Receive real-time order alerts. When ready, mark for pickup and our verified delivery partner collects and delivers directly to the buyer.",
      mockup: (
        <div className="space-y-3 font-sans text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-cream-300">
            <span className="font-semibold text-ink-600 uppercase tracking-wider text-[11px]">
              Today's Orders
            </span>
            <span className="font-medium text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded text-[11px]">
              2 Awaiting Courier Pickup
            </span>
          </div>

          {[
            {
              id: "ORD-9412",
              items: "Monstera Deliciosa + Ceramic Saucer",
              customer: "Rahul M.",
              status: "Ready for Pickup",
            },
            {
              id: "ORD-9411",
              items: "Fresh Rose Bouquet (Dozen)",
              customer: "Ananya D.",
              status: "Preparing",
            },
            {
              id: "ORD-9409",
              items: "Organic Neem Fertilizer (1kg)",
              customer: "Vikram P.",
              status: "Delivered",
            },
          ].map((ord, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-cream-50 border border-cream-200/80 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-forest-900">{ord.id}</span>
                  <span className="text-ink-500">· {ord.customer}</span>
                </div>
                <p className="text-[11px] text-ink-600 mt-0.5">{ord.items}</p>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  ord.status === "Delivered"
                    ? "bg-forest-100 text-forest-800"
                    : ord.status === "Ready for Pickup"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-cream-200 text-ink-700"
                }`}
              >
                {ord.status}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "analytics",
      name: "Payouts & Analytics",
      headline: "Transparent weekly bank transfers & reports",
      description:
        "Track sales trends, top-selling botanical items, and weekly bank settlements with zero surprise deductions.",
      mockup: (
        <div className="space-y-3 font-sans text-xs">
          <div className="grid grid-cols-2 gap-3 pb-1">
            <div className="p-3.5 bg-cream-50 rounded-xl border border-cream-200/80">
              <span className="text-[11px] font-medium text-ink-500 uppercase tracking-wider">
                This Week's Sales
              </span>
              <p className="font-serif text-2xl font-bold text-forest-900 mt-1">₹34,800</p>
              <span className="text-[10px] font-medium text-forest-700">↑ 24% vs last week</span>
            </div>
            <div className="p-3.5 bg-cream-50 rounded-xl border border-cream-200/80">
              <span className="text-[11px] font-medium text-ink-500 uppercase tracking-wider">
                Scheduled Payout
              </span>
              <p className="font-serif text-2xl font-bold text-ink-900 mt-1">Monday</p>
              <span className="text-[10px] font-medium text-ink-500">Direct Bank Settlement</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-forest-900 text-cream-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} weight="fill" className="text-emerald-400" />
              <span className="text-xs font-medium">Verified Settlement Account</span>
            </div>
            <span className="font-mono text-[11px] text-cream-200">HDFC •••• 5021</span>
          </div>
        </div>
      ),
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <section id="workspace" className="py-20 sm:py-28 lg:py-32 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-20">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 leading-[1.12] tracking-tight">
            Your business. All in one place.
          </h2>
          <p className="text-lg sm:text-xl text-ink-600 font-normal leading-relaxed mt-4">
            Once you join, Floria Business provides an operational cockpit designed
            specifically for botanical, floral, and gardening stores.
          </p>
        </div>

        {/* Tab Navigation (Understated typographic tabs, no heavy pill buttons) */}
        <div className="flex items-center gap-6 sm:gap-10 border-b border-cream-300/80 mb-10 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`pb-4 text-sm sm:text-base font-semibold transition-colors relative whitespace-nowrap cursor-pointer focus:outline-none ${
                  isActive
                    ? "text-forest-900 font-bold"
                    : "text-ink-600 hover:text-ink-900"
                }`}
              >
                <span>{tab.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest-800" />
                )}
              </button>
            );
          })}
        </div>

        {/* Workspace Preview Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Description */}
          <div className="lg:col-span-5 space-y-5">
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ink-900 leading-snug">
              {currentTab.headline}
            </h3>
            <p className="text-sm sm:text-base text-ink-600 font-normal leading-relaxed">
              {currentTab.description}
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold text-forest-800 hover:text-forest-900 group"
              >
                <span>Explore seller tools with your account</span>
                <ArrowRight size={15} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right High-Fidelity Cockpit Preview Frame */}
          <div className="lg:col-span-7">
            <div className="bg-cream-100 rounded-3xl border border-cream-300 shadow-md p-6 sm:p-8">
              {/* Browser / App Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-cream-300/80">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-mono text-ink-500 ml-2">
                    seller.floria.in/cockpit
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest-800 bg-forest-100 px-2 py-0.5 rounded">
                  Operational Cockpit
                </span>
              </div>

              {/* Dynamic Tab Mockup */}
              {currentTab.mockup}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
