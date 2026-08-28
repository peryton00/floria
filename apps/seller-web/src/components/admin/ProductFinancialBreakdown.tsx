"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { AdminProductFinancialCalculation } from "@floria/types";

interface Props {
  productId: string;
  onClose: () => void;
}

export function ProductFinancialBreakdown({ productId, onClose }: Props) {
  const [data, setData] = useState<AdminProductFinancialCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCalculation() {
      try {
        setLoading(true);
        const res = await api.getAdminProductFinancialCalculation(productId);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error?.message || "Failed to load product financial calculation.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadCalculation();
    }
  }, [productId]);

  const formatINR = (paise: number) => {
    return `₹${((paise || 0) / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto space-y-6 relative focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
              Admin Financial Inspection
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Product Unified Price &amp; Profit Breakdown
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-xs font-mono text-slate-400">Calculating server-authoritative financials...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-rose-950/50 border border-rose-800/80 p-4 text-rose-300 text-xs space-y-1">
            <p className="font-bold text-rose-200">Calculation Error</p>
            <p className="text-rose-400">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Product Meta Card */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-white">{data.product.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nursery Partner: <strong className="text-emerald-400 font-semibold">{data.product.sellerName}</strong>
                </p>
              </div>
              <span className="text-[11px] font-mono bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700/60">
                ID: {data.product.id.slice(0, 8)}...
              </span>
            </div>

            {/* Section 1: Seller Base Pricing & Net Payout */}
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span>🏪</span> Seller Base Price &amp; Commission Settlement
                </h4>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded">
                  {data.commission.rate}% Commission Cut
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-300 font-medium">Seller Entered Base Price</span>
                  <span className="font-mono text-slate-100 font-bold text-sm">{formatINR(data.pricing.sellerBasePricePaise)}</span>
                </div>

                <div className="flex justify-between items-center py-0.5 text-rose-400">
                  <span className="text-slate-400">Floria Seller Commission ({data.commission.rate}%)</span>
                  <span className="font-mono font-semibold">-{formatINR(data.commission.amountPaise)}</span>
                </div>

                <div className="flex justify-between items-center border-t border-slate-800 pt-2.5 mt-1 bg-emerald-950/30 p-2.5 rounded-lg border-emerald-900/40">
                  <div>
                    <span className="text-emerald-300 font-bold text-xs block">Nursery Net Payout</span>
                    <span className="text-[10px] text-emerald-400/80">Amount credited to nursery ledger</span>
                  </div>
                  <span className="font-mono font-extrabold text-base text-emerald-400">
                    {formatINR(data.sellerEarnings.netPaise)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Floria Platform Economics (Admin Only) */}
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <span>⚙️</span> Floria Internal Pricing Components (Admin Only)
                </h4>
                <span className="text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded">
                  Internal Economics
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Floria Internal Profit Margin ({data.pricing.floriaProfitRate}%)</span>
                  <span className="font-mono font-bold text-teal-300">+{formatINR(data.pricing.floriaProfitPaise)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Hidden Delivery Recovery Fee</span>
                  <span className="font-mono font-bold text-sky-300">
                    {data.pricing.deliveryRecoveryPaise > 0 ? `+${formatINR(data.pricing.deliveryRecoveryPaise)}` : "₹0.00 (Below Threshold)"}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-slate-800/80 pt-2">
                  <span className="text-slate-400">Product Free Delivery Qualification</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                      data.pricing.isFreeDeliveryEligible
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {data.pricing.isFreeDeliveryEligible ? "✓ YES (Free Delivery)" : "✕ NO (Paid Delivery)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Final Customer Product Price Banner */}
            <div className="rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/40 p-4 flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Final Storefront Listing Price
                </span>
                <h4 className="text-sm font-extrabold text-white mt-0.5">CUSTOMER PRODUCT PRICE</h4>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-black text-emerald-400 tracking-tight">
                  {formatINR(data.pricing.customerProductPricePaise)}
                </span>
              </div>
            </div>

            {/* Math Formula Explainer Legend Footer */}
            <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-3.5 text-[11px] text-slate-400 space-y-1.5 font-mono leading-relaxed">
              <p className="text-slate-300 font-bold text-[10px] uppercase tracking-wider border-b border-slate-800 pb-1 mb-1">
                📌 Financial Calculation Formula Legend
              </p>
              <p>
                <strong className="text-amber-300">Seller Net Payout</strong> = Base Price ({formatINR(data.pricing.sellerBasePricePaise)}) − Commission ({data.commission.rate}%)
              </p>
              <p>
                <strong className="text-teal-300">Floria Profit</strong> = Base Price × {data.pricing.floriaProfitRate}% margin
              </p>
              <p>
                <strong className="text-emerald-300">Customer Listing Price</strong> = Base Price + Floria Profit + Delivery Recovery
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
