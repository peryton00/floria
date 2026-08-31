"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { FloriaIcon } from "@floria/icons";

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
        <FloriaIcon name="error" size={28} className="text-rose-600 mx-auto" />
        <h1 className="font-serif text-lg font-bold text-ink-900">Earnings Data Unavailable</h1>
        <p className="text-xs text-ink-500">{error || "Could not retrieve live accounting metrics."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Nursery Earnings Ledger</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Historical order revenues, platform commission deductions, and net payouts settled to your nursery account.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-1">
            {earnings.ordersCount} Completed Orders
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs hover:border-slate-400 transition-all flex items-start justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Gross Sales Revenue</p>
            <p className="font-mono text-xl font-bold text-[#0F172A] mt-1.5 tracking-tight">{formatINR(earnings.totalGrossRevenuePaise)}</p>
            <p className="text-[11px] text-slate-400 mt-1">From {earnings.ordersCount} completed order(s)</p>
          </div>
          <div className="w-9 h-9 rounded bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center flex-shrink-0 shadow-xs">
            <FloriaIcon name="trending_up" size={18} />
          </div>
        </div>

        <div className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs hover:border-slate-400 transition-all flex items-start justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Platform Commission</p>
            <p className="font-mono text-xl font-bold text-amber-700 mt-1.5 tracking-tight">{formatINR(earnings.totalCommissionPaise)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Aggregated per-order fee snapshot</p>
          </div>
          <div className="w-9 h-9 rounded bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center flex-shrink-0 shadow-xs">
            <FloriaIcon name="percent" size={18} />
          </div>
        </div>

        <div className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs hover:border-slate-400 transition-all flex items-start justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Net Seller Earnings</p>
            <p className="font-mono text-xl font-bold text-[#1B4D3E] mt-1.5 tracking-tight">{formatINR(earnings.totalNetEarningsPaise)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Total eligible for settlement payout</p>
          </div>
          <div className="w-9 h-9 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center flex-shrink-0 shadow-xs">
            <FloriaIcon name="wallet" size={18} />
          </div>
        </div>
      </div>

      {/* Breakdowns List */}
      <div className="bg-white rounded border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 flex justify-between items-center border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div>
            <h2 className="font-sans text-sm font-bold text-[#0F172A]">Per-Order Fee Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">Itemized list of order segment revenues and commission snapshot deductions.</p>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-600 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-[#E2E8F0]">
            <FloriaIcon name="calendar" size={12} /> Live Accounting Sync
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-slate-500">
            No transaction records recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-slate-600 font-mono text-[10px] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Gross Revenue</th>
                  <th className="p-3.5">Platform Fee</th>
                  <th className="p-3.5">Net Seller Payout</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {orders.map((o) => {
                  const gross = (o.items || []).reduce((s: number, it: any) => s + (it.pricePaise || 0) * it.quantity, 0) || o.subtotalPaise || 0;
                  const net = (o.items || []).reduce((s: number, it: any) => s + (it.seller_net_paise ?? it.pricePaise ?? 0) * it.quantity, 0) || o.seller_payout_paise || gross;
                  const comm = gross - net;

                  return (
                    <tr key={o.masterOrderId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#0F172A]">#{o.masterOrderId?.slice(0, 10)}</td>
                      <td className="p-3.5 text-slate-600">{o.createdAt}</td>
                      <td className="p-3.5 font-mono font-semibold text-slate-800">{formatINR(gross)}</td>
                      <td className="p-3.5 font-mono text-amber-700">-{formatINR(comm)}</td>
                      <td className="p-3.5 font-mono font-bold text-[#1B4D3E]">{formatINR(net)}</td>
                      <td className="p-3.5 text-right">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
