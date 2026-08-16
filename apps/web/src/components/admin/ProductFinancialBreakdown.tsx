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
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl p-6 text-stone-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400">Admin Financial Inspection</span>
            <h2 className="text-xl font-bold text-stone-100 mt-1">Product Unified Price &amp; Profit Breakdown</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-sm">Calculating server-authoritative financials...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-950/40 border border-red-800/60 p-4 text-red-300 text-sm">
            <p className="font-semibold">Calculation Error</p>
            <p className="mt-1 text-red-400">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="rounded-xl bg-stone-950/60 border border-stone-800/80 p-4 flex flex-col gap-1">
              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-stone-100">{data.product.name}</span>
                <span className="text-xs font-mono text-stone-400">ID: {data.product.id.slice(0, 8)}...</span>
              </div>
              <p className="text-xs text-stone-400">Nursery Partner: <span className="text-emerald-400 font-medium">{data.product.sellerName}</span></p>
            </div>

            {/* Seller Base Pricing & Net Payout */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 border-b border-stone-800/60 pb-1">
                Seller Base Price &amp; Commission Settlement
              </h3>
              <div className="flex justify-between text-sm py-1">
                <span className="text-stone-400">Seller Base Price</span>
                <span className="font-mono text-stone-200">{formatINR(data.pricing.sellerBasePricePaise)}</span>
              </div>
              <div className="flex justify-between text-sm py-1 text-amber-400">
                <span className="text-stone-400">Seller Commission ({data.commission.rate}%)</span>
                <span className="font-mono">-{formatINR(data.commission.amountPaise)}</span>
              </div>
              <div className="flex justify-between text-sm py-1 font-semibold border-t border-stone-800/40 pt-2 text-emerald-300">
                <span>Seller Net Payout</span>
                <span className="font-mono font-bold text-base">{formatINR(data.sellerEarnings.netPaise)}</span>
              </div>
            </div>

            {/* Floria Internal Margin & Recovery */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 border-b border-stone-800/60 pb-1">
                Floria Internal Pricing Components (Admin Only)
              </h3>
              <div className="flex justify-between text-sm py-1">
                <span className="text-stone-400">Floria Profit Margin ({data.pricing.floriaProfitRate}%)</span>
                <span className="font-mono text-emerald-400">+{formatINR(data.pricing.floriaProfitPaise)}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-stone-400">Free Delivery Recovery</span>
                <span className="font-mono text-emerald-400">
                  {data.pricing.deliveryRecoveryPaise > 0 ? `+${formatINR(data.pricing.deliveryRecoveryPaise)}` : "₹0.00 (Not Applied)"}
                </span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-stone-400">Product Free Delivery Eligible (Threshold &gt;= ₹599)</span>
                <span className={`font-semibold ${data.pricing.isFreeDeliveryEligible ? "text-emerald-400" : "text-amber-400"}`}>
                  {data.pricing.isFreeDeliveryEligible ? "YES (Free Delivery Eligible)" : "NO (Paid Delivery)"}
                </span>
              </div>
            </div>

            {/* Customer Product Price */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 border-b border-stone-800/60 pb-1">
                Customer Product Price
              </h3>
              <div className="flex justify-between text-base font-bold border-t border-stone-700 pt-3 text-stone-100">
                <span>FINAL LISTING PRODUCT PRICE</span>
                <span className="font-mono text-emerald-400 text-lg">{formatINR(data.pricing.customerProductPricePaise)}</span>
              </div>
            </div>

            {/* Formula Legend Footer */}
            <div className="rounded-xl bg-stone-950/80 border border-stone-800/60 p-3 text-[11px] text-stone-400 space-y-1 font-mono">
              <p><span className="text-stone-300 font-semibold">Seller Net</span> = Base Price − Commission ({data.commission.rate}%)</p>
              <p><span className="text-stone-300 font-semibold">Floria Profit</span> = Base Price × {data.pricing.floriaProfitRate}%</p>
              <p><span className="text-stone-300 font-semibold">Customer Price</span> = Base Price + Profit + Delivery Recovery</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
