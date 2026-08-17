"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import {
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function SellerEarningsPage() {
  const [earnings, setEarnings] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [earnRes, ordersRes] = await Promise.all([
          api.getSellerEarnings(),
          api.getSellerOrders(),
        ]);

        if (earnRes.success && earnRes.data) {
          setEarnings(earnRes.data);
        } else {
          throw new Error(earnRes.error?.message || "Failed to load earnings metrics");
        }

        if (ordersRes.success && ordersRes.data) {
          setOrders(ordersRes.data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to connect to API");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse font-ui">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-floria-sand/70 rounded-2xl w-full border border-floria-border" />
          ))}
        </div>
        <div className="h-64 bg-floria-sand/70 rounded-3xl w-full border border-floria-border" />
      </div>
    );
  }

  if (error || !earnings) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 bg-floria-linen rounded-3xl border border-floria-border p-8 shadow-xs font-ui">
        <AlertCircle size={28} className="text-rose-600 mx-auto" />
        <h1 className="font-serif text-lg font-bold text-ink-900">Earnings Data Unavailable</h1>
        <p className="text-xs text-ink-500">{error || "Could not retrieve live accounting metrics."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-ui">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">Nursery Earnings Ledger</h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">Historical order revenues, platform commission deductions, and net payouts settled to your nursery account.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-floria-linen rounded-3xl border border-floria-border p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink-500">Gross Sales Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-800 border border-forest-200/70 flex items-center justify-center shadow-2xs">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-ink-900">{formatINR(earnings.totalGrossRevenuePaise)}</p>
            <p className="text-[10px] sm:text-[11px] text-ink-400 mt-1">From {earnings.ordersCount} completed order(s)</p>
          </div>
        </div>

        <div className="bg-floria-linen rounded-3xl border border-floria-border p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink-500">Platform Commission</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/70 flex items-center justify-center shadow-2xs">
              <Percent size={16} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-amber-800">{formatINR(earnings.totalCommissionPaise)}</p>
            <p className="text-[10px] sm:text-[11px] text-ink-400 mt-1">Aggregated per-order fee snapshot</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#183023] via-[#1E3A2B] to-[#254A37] text-white rounded-3xl p-5 sm:p-6 shadow-sm border border-forest-700/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#DDE7DD]/80">Net Seller Earnings</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 text-white flex items-center justify-center shadow-2xs">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#DDE7DD]">{formatINR(earnings.totalNetEarningsPaise)}</p>
            <p className="text-[10px] sm:text-[11px] text-white/70 mt-1">Total eligible for settlement payout</p>
          </div>
        </div>
      </div>

      {/* Breakdowns List */}
      <section className="bg-floria-linen rounded-3xl border border-floria-border p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-floria-border pb-3.5 flex justify-between items-center">
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-ink-900">Per-Order Fee Breakdown</h2>
            <p className="text-xs text-ink-500">Itemized list of order segment revenues and commission snapshot deductions.</p>
          </div>
          <span className="text-xs text-ink-500 font-mono flex items-center gap-1.5 bg-floria-soft-sand px-2.5 py-1 rounded-full border border-floria-border">
            <Calendar size={13} /> Live Sync
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-xs font-medium text-ink-500 bg-floria-soft-sand rounded-2xl border border-floria-border">
            No transaction records recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-floria-border">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-floria-soft-sand text-ink-600 font-bold uppercase tracking-wider border-b border-floria-border">
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Gross Segment</th>
                  <th className="p-3.5">Commission Rate</th>
                  <th className="p-3.5">Fee Deducted</th>
                  <th className="p-3.5 text-right">Net Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-floria-border bg-floria-linen">
                {orders.map((o) => {
                  const gross = o.subtotalPaise || 0;
                  const commission = (o as any).commissionPaise ?? (o.commissionRateSnapshot !== undefined ? Math.round(gross * o.commissionRateSnapshot) : 0);
                  const net = (o as any).sellerPayoutPaise ?? (gross - commission);
                  const rateStr = o.commissionRateSnapshot !== undefined ? `${(o.commissionRateSnapshot * 100).toFixed(1)}%` : "—";

                  return (
                    <tr key={o.masterOrderId} className="hover:bg-floria-soft-sand/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-ink-900">#{o.masterOrderId?.slice(0, 10)}</td>
                      <td className="p-3.5 text-ink-600">{o.createdAt}</td>
                      <td className="p-3.5 font-semibold text-ink-800">{formatINR(gross)}</td>
                      <td className="p-3.5 font-mono text-ink-500">{rateStr}</td>
                      <td className="p-3.5 text-amber-800 font-semibold">-{formatINR(commission)}</td>
                      <td className="p-3.5 font-serif font-bold text-forest-800 text-right text-xs sm:text-sm">{formatINR(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
