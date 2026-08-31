"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { AdminOrderFinancialBreakdown } from "@floria/types";
import { FloriaIcon } from "@floria/icons";

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
    return `₹${((paise || 0) / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <span className="text-xs font-mono">Loading financial breakdown...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-rose-950/40 border border-rose-800/60 p-4 text-rose-300 text-xs">
        {error || "Unable to load financial data for this master order."}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-6 text-slate-100 shadow-xl">
      {/* Header Bar */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
            Multi-Nursery Financial Breakdown
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Master Order #{data.masterOrderId.slice(0, 8)}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Customer Total Paid</span>
          <p className="text-2xl font-mono font-black text-emerald-400 tracking-tight">{formatINR(data.customerTotalPaise)}</p>
        </div>
      </div>

      {/* Multi-Nursery Attribution Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <FloriaIcon name="storefront" size="xs" /> Attributed Nursery Partners ({data.nurseryBreakdown.length})
        </h3>

        {data.nurseryBreakdown.map((nursery) => (
          <div key={nursery.sellerId} className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-sm font-extrabold text-white">{nursery.sellerName}</span>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded">
                Commission Rate: {nursery.commissionRate}%
              </span>
            </div>

            {/* Line items for this nursery */}
            <div className="space-y-1.5">
              {nursery.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs py-1 text-slate-200">
                  <span>
                    {item.productName} <span className="text-slate-400 font-mono">× {item.quantity}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-100">{formatINR(item.lineTotalPaise)}</span>
                </div>
              ))}
            </div>

            {/* Nursery totals grid */}
            <div className="border-t border-slate-800 pt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Nursery Gross</span>
                <span className="font-mono font-semibold text-slate-200">{formatINR(nursery.sellerGrossPaise)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Platform Comm ({nursery.commissionRate}%)</span>
                <span className="font-mono font-semibold text-rose-400">-{formatINR(nursery.commissionPaise)}</span>
              </div>
              <div className="text-right bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/40">
                <span className="text-emerald-300 block text-[10px] font-bold uppercase tracking-wider">Nursery Net Payout</span>
                <span className="font-mono font-extrabold text-sm text-emerald-400">{formatINR(nursery.sellerNetPaise)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Level Financial Summary */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-2.5 text-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 border-b border-slate-800 pb-1.5 mb-2">
          Platform Revenue &amp; Customer Order Total
        </h3>

        <div className="flex justify-between items-center">
          <span className="text-slate-300">Product Subtotal</span>
          <span className="font-mono font-semibold text-slate-200">{formatINR(data.subtotalPaise)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-300">Platform Maintenance Fee</span>
          <span className="font-mono font-semibold text-slate-200">{formatINR(data.maintenanceFeePaise)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-300">
            Delivery Fee {data.deliveryFeeReason && <span className="text-[10px] font-mono text-slate-500">({data.deliveryFeeReason})</span>}
          </span>
          <span className="font-mono font-semibold text-slate-300">
            {data.deliveryFeePaise > 0 ? formatINR(data.deliveryFeePaise) : "₹0.00 (Free Delivery)"}
          </span>
        </div>

        <div className="flex justify-between items-center text-amber-400 font-bold border-t border-slate-800/80 pt-2">
          <span>Total Platform Commission</span>
          <span className="font-mono">{formatINR(data.totalPlatformCommissionPaise)}</span>
        </div>

        {data.totalFloriaProfitPaise !== undefined && data.totalFloriaProfitPaise > 0 && (
          <div className="flex justify-between items-center text-teal-300 font-bold">
            <span>Total Internal Floria Profit Margin</span>
            <span className="font-mono">+{formatINR(data.totalFloriaProfitPaise)}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-base font-extrabold border-t border-slate-700 pt-3 text-white">
          <span>CUSTOMER ORDER TOTAL</span>
          <span className="font-mono text-emerald-400 text-lg">{formatINR(data.customerTotalPaise)}</span>
        </div>
      </div>
    </div>
  );
}
