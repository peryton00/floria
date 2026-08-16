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
            <h2 className="text-xl font-bold text-stone-100 mt-1">Product Price Breakdown</h2>
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

            {/* Base Product Pricing */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 border-b border-stone-800/60 pb-1">
                Base Product Price
              </h3>
              <div className="flex justify-between text-sm py-1">
                <span className="text-stone-400">Nursery Base Price</span>
                <span className="font-mono text-stone-200">{formatINR(data.pricing.basePricePaise)}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-stone-400">Seller Discount</span>
                <span className="font-mono text-stone-200">{data.pricing.discountPaise > 0 ? `-${formatINR(data.pricing.discountPaise)}` : "₹0.00"}</span>
              </div>
              <div className="flex justify-between text-sm py-1 font-semibold border-t border-stone-800/40 pt-2 text-stone-100">
                <span>Seller Selling Price</span>
                <span className="font-mono text-emerald-400">{formatINR(data.pricing.sellingPricePaise)}</span>
              </div>
            </div>

            {/* Platform Commission */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 border-b border-stone-800/60 pb-1">
                Platform Commission (Configured in Settings)
              </h3>
              <div className="flex justify-between text-sm py-1">
                <span className="text-stone-400">Platform Commission Rate</span>
                <span className="font-mono text-stone-200">{data.commission.rate}%</span>
              </div>
              <div className="flex justify-between text-sm py-1 font-semibold text-amber-400">
                <span>Commission Amount</span>
                <span className="font-mono">{formatINR(data.commission.amountPaise)}</span>
              </div>
            </div>

            {/* Seller Net Earnings */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 border-b border-stone-800/60 pb-1">
                Seller Net Earnings
              </h3>
              <div className="flex justify-between text-sm py-1">
                <span className="text-stone-400">Seller Gross</span>
                <span className="font-mono text-stone-200">{formatINR(data.sellerEarnings.grossPaise)}</span>
              </div>
              <div className="flex justify-between text-sm py-1 text-amber-400">
                <span className="text-stone-400">Floria Platform Commission ({data.commission.rate}%)</span>
                <span className="font-mono">-{formatINR(data.commission.amountPaise)}</span>
              </div>
              <div className="flex justify-between text-sm py-1 font-bold border-t border-stone-800/40 pt-2 text-emerald-300">
                <span>Seller Net Payout</span>
                <span className="font-mono text-base">{formatINR(data.sellerEarnings.netPaise)}</span>
              </div>
            </div>

            {/* Customer Charges */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 border-b border-stone-800/60 pb-1">
                Customer Charges
              </h3>
              <div className="flex justify-between text-sm py-1">
                <span className="text-stone-400">Product Price</span>
                <span className="font-mono text-stone-200">{formatINR(data.pricing.sellingPricePaise)}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-stone-400">Delivery Fee</span>
                <span className="font-mono text-stone-300">
                  {data.configuredRules.deliveryConfigured ? formatINR(data.customerCharges.deliveryFeePaise) : "₹0.00 (Free)"}
                </span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-stone-400">Tax</span>
                <span className="font-mono text-stone-400">
                  {data.configuredRules.taxConfigured ? formatINR(data.customerCharges.taxPaise) : "Not Configured"}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-stone-700 pt-3 text-stone-100">
                <span>CUSTOMER TOTAL</span>
                <span className="font-mono text-emerald-400 text-lg">{formatINR(data.customerCharges.totalPaise)}</span>
              </div>
            </div>

            {/* Formula Legend Footer */}
            <div className="rounded-xl bg-stone-950/80 border border-stone-800/60 p-3 text-[11px] text-stone-400 space-y-1 font-mono">
              <p><span className="text-stone-300 font-semibold">Selling Price</span> = Base Price − Discount</p>
              <p><span className="text-stone-300 font-semibold">Commission</span> = Selling Price × {data.commission.rate}%</p>
              <p><span className="text-stone-300 font-semibold">Seller Net</span> = Selling Price − Commission</p>
              <p><span className="text-stone-300 font-semibold">Customer Total</span> = Selling Price + Delivery + Tax</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
