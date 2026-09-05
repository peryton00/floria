"use client";

import React, { useState } from "react";
import {
  Plant,
  Package,
  ShoppingCart,
  TrendUp,
  Star,
  CheckCircle,
  CurrencyInr,
  Clock,
  ArrowRight,
} from "@phosphor-icons/react";
import Link from "next/link";

interface FeatureTab {
  id: string;
  name: string;
  icon: React.ElementType;
  title: string;
  description: string;
  bullets: string[];
  mockupContent: React.ReactNode;
}

export function BusinessWorkspacePreview() {
  const [activeTabId, setActiveTabId] = useState("catalog");

  const tabs: FeatureTab[] = [
    {
      id: "catalog",
      name: "Catalog & Pricing",
      icon: Plant,
      title: "Effortless botanical catalog management",
      description:
        "Upload high-resolution photography, set custom pricing, configure sunlight and care instructions, and manage botanical variations seamlessly.",
      bullets: [
        "AI-optimized image variants for fast loading",
        "Set custom discounted compare-at prices",
        "Categorize by indoor, outdoor, air-purifying, bonsai & floral",
      ],
      mockupContent: (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-cream-300">
            <span className="text-xs font-bold uppercase text-ink-500">Live Products (42)</span>
            <span className="text-xs font-bold text-forest-800 bg-forest-100 px-2 py-0.5 rounded">All In Stock</span>
          </div>
          {[
            { name: "Monstera Deliciosa (Swiss Cheese)", price: "₹899", stock: "14 available", status: "Active" },
            { name: "Handcrafted Ceramic Planter (Terracotta)", price: "₹650", stock: "28 available", status: "Active" },
            { name: "Fresh Pastel Garden Rose Bouquet", price: "₹1,250", stock: "6 available", status: "Active" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-cream-50 border border-cream-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-forest-100 flex items-center justify-center text-forest-800 font-bold text-xs">
                  🌿
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-900">{item.name}</p>
                  <p className="text-[11px] text-ink-500">{item.stock}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-forest-900">{item.price}</p>
                <span className="text-[10px] font-bold text-forest-700 bg-forest-100/60 px-1.5 py-0.5 rounded">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "orders",
      name: "Orders & Delivery",
      icon: ShoppingCart,
      title: "Real-time dispatch and courier coordination",
      description:
        "Receive instant notifications when customers place orders. Mark packages as ready for pickup with one click for our verified logistics fleet.",
      bullets: [
        "Live order lifecycle states (Confirmed -> Preparing -> Ready -> Delivered)",
        "Zero logistics hassle — assigned Floria courier pickup",
        "Automated customer SMS and notification updates",
      ],
      mockupContent: (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-cream-300">
            <span className="text-xs font-bold uppercase text-ink-500">Incoming Deliveries</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">3 Ready for Pickup</span>
          </div>
          {[
            { id: "FLR-ORD-8821", customer: "Priya S.", items: "2 items (Fiddle Leaf Fig + Pot)", time: "12 mins ago", badge: "Ready for Pickup" },
            { id: "FLR-ORD-8820", customer: "Amit K.", items: "1 item (Ceramic Planter Set)", time: "35 mins ago", badge: "Preparing" },
            { id: "FLR-ORD-8818", customer: "Sneha R.", items: "3 items (Bouquet & Fertilizer)", time: "1 hr ago", badge: "Dispatched" },
          ].map((ord, i) => (
            <div key={i} className="p-3 rounded-xl bg-cream-50 border border-cream-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-forest-900">{ord.id}</span>
                  <span className="text-[11px] text-ink-500">• {ord.customer}</span>
                </div>
                <p className="text-[11px] text-ink-600 mt-0.5">{ord.items}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                  {ord.badge}
                </span>
                <p className="text-[10px] text-ink-400 mt-1">{ord.time}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "earnings",
      name: "Financials & Payouts",
      icon: CurrencyInr,
      title: "Transparent earnings and automatic bank transfers",
      description:
        "Track daily gross revenue, net payouts, platform governance deductions, and downloadable GST invoice summaries with 100% financial clarity.",
      bullets: [
        "Automated weekly bank account settlements",
        "Clear ledger statements with zero hidden charges",
        "Live financial dashboard showing payout milestones",
      ],
      mockupContent: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 pb-2">
            <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
              <p className="text-[10px] font-bold uppercase text-ink-500">This Week's Net</p>
              <p className="text-lg font-serif font-bold text-forest-900 mt-0.5">₹24,850</p>
              <span className="text-[10px] text-forest-700 font-bold">↑ 18% vs last week</span>
            </div>
            <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
              <p className="text-[10px] font-bold uppercase text-ink-500">Next Payout</p>
              <p className="text-lg font-serif font-bold text-ink-900 mt-0.5">Monday</p>
              <span className="text-[10px] text-ink-500">Bank Transfer Direct</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-forest-900 text-cream-50 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} weight="fill" className="text-emerald-400" />
              <span>Settlement Account Verified</span>
            </div>
            <span className="font-mono text-[11px] text-cream-200">HDFC •••• 4129</span>
          </div>
        </div>
      ),
    },
  ];

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <section id="workspace" className="py-16 sm:py-24 bg-cream-100 border-b border-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-forest-800 bg-forest-100/80 border border-forest-200 px-3.5 py-1.5 rounded-full shadow-2xs">
            Seller Workspace
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 mt-4 leading-tight">
            Everything your business needs to grow.
          </h2>
          <p className="text-base sm:text-lg text-ink-600 mt-4 leading-relaxed">
            Gain full control of your store with a dedicated workspace engineered
            for high operational speed.
          </p>
        </div>

        {/* Interactive Tab Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 border-b border-cream-300 mb-8 sm:mb-12">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap focus:outline-none cursor-pointer ${
                  isActive
                    ? "bg-forest-800 text-cream-50 shadow-xs"
                    : "bg-cream-50 text-ink-700 hover:bg-cream-200 hover:text-forest-900 border border-cream-300/80"
                }`}
              >
                <Icon size={16} weight={isActive ? "fill" : "duotone"} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Detail & Visual Mockup Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-cream-50 rounded-3xl border border-cream-300/90 p-6 sm:p-10 shadow-sm">
          {/* Left Column: Feature Highlights */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
                Capability Spotlight
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-1">
                {activeTab.title}
              </h3>
              <p className="text-sm sm:text-base text-ink-600 mt-3 leading-relaxed">
                {activeTab.description}
              </p>
            </div>

            <ul className="space-y-3 pt-2">
              {activeTab.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-800 font-medium">
                  <CheckCircle size={18} weight="fill" className="text-forest-700 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-3 bg-forest-800 hover:bg-forest-900 text-cream-50 text-sm font-semibold rounded-xl transition-all shadow-xs"
              >
                <span>Access Seller Portal</span>
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>
          </div>

          {/* Right Column: High-Fidelity UI Mockup Frame */}
          <div className="lg:col-span-6">
            <div className="bg-cream-100 rounded-2xl border border-cream-300 shadow-md p-5 sm:p-6 relative">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-cream-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-mono text-ink-500 ml-2 font-medium">
                    floria.in/seller/workspace
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase bg-forest-100 text-forest-800 px-2 py-0.5 rounded">
                  Live Preview
                </span>
              </div>

              {/* Mockup Canvas */}
              {activeTab.mockupContent}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
