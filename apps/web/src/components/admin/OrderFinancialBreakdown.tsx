"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { AdminOrderFinancialBreakdown } from "@floria/types";

interface Props {
  orderId: string;
}

export function OrderFinancialBreakdown({ orderId }: Props) {
  const [data, setData] = useState<AdminOrderFinancialBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBreakdown() {
      try {
        setLoading(true);
        const res = await api.getAdminOrderFinancialBreakdown(orderId);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error?.message || "Failed to load order financial breakdown.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      loadBreakdown();
    }
  }, [orderId]);

  const formatINR = (paise: number) => {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6 flex items-center justify-center gap-3 text-stone-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <span className="text-sm">Calculating server-authoritative order breakdown...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6 text-stone-400 text-sm">
        <p className="text-red-400 font-semibold">Financial Breakdown Unavailable</p>
        <p className="mt-1 text-xs">{error || "No financial breakdown record found for this order."}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6 text-stone-100 space-y-6">
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div>
          <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400">Multi-Nursery Financial Breakdown</span>
          <h2 className="text-lg font-bold text-stone-100 mt-1">Master Order #{data.masterOrderId.slice(0, 8)}</h2>
        </div>
        <div className="text-right">
          <span className="text-xs text-stone-400">Customer Total</span>
          <p className="text-xl font-mono font-bold text-emerald-400">{formatINR(data.customerTotalPaise)}</p>
        </div>
      </div>

      {/* Multi-Nursery Attribution Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Attributed Nursery Partners ({data.nurseryBreakdown.length})
        </h3>

        {data.nurseryBreakdown.map((nursery) => (
          <div key={nursery.sellerId} className="rounded-xl bg-stone-950/80 border border-stone-800 p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-stone-800/60 pb-2">
              <span className="text-sm font-bold text-stone-200">{nursery.sellerName}</span>
              <span className="text-xs font-mono text-stone-400">Commission Rate: {nursery.commissionRate}%</span>
            </div>

            {/* Line items for this nursery */}
            <div className="space-y-1">
              {nursery.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs py-1 text-stone-300">
                  <span>{item.productName} <span className="text-stone-500 font-mono">× {item.quantity}</span></span>
                  <span className="font-mono">{formatINR(item.lineTotalPaise)}</span>
                </div>
              ))}
            </div>

            {/* Nursery totals */}
            <div className="border-t border-stone-800/60 pt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase">Nursery Gross</span>
                <span className="font-mono font-semibold text-stone-200">{formatINR(nursery.sellerGrossPaise)}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase">Platform Comm ({nursery.commissionRate}%)</span>
                <span className="font-mono font-semibold text-amber-400">-{formatINR(nursery.commissionPaise)}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block text-[10px] uppercase">Nursery Net Payout</span>
                <span className="font-mono font-bold text-emerald-400">{formatINR(nursery.sellerNetPaise)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Level Summary */}
      <div className="rounded-xl bg-stone-950/60 border border-stone-800 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-400">Product Subtotal</span>
          <span className="font-mono">{formatINR(data.subtotalPaise)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-400">Delivery Fee</span>
          <span className="font-mono text-stone-300">
            {data.deliveryFeePaise > 0 ? formatINR(data.deliveryFeePaise) : "₹0.00 (Free)"}
          </span>
        </div>
        <div className="flex justify-between text-amber-400 font-semibold border-t border-stone-800/60 pt-2">
          <span>Total Platform Commission</span>
          <span className="font-mono">{formatINR(data.totalPlatformCommissionPaise)}</span>
        </div>
        <div className="flex justify-between text-base font-bold border-t border-stone-700 pt-3 text-stone-100">
          <span>CUSTOMER TOTAL</span>
          <span className="font-mono text-emerald-400">{formatINR(data.customerTotalPaise)}</span>
        </div>
      </div>
    </div>
  );
}
