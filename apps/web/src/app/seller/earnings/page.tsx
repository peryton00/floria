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
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-ink-100/70 rounded-xl w-full" />
          ))}
        </div>
        <div className="h-64 bg-ink-100/70 rounded-2xl w-full" />
      </div>
    );
  }

  if (error || !earnings) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 bg-white rounded-2xl border border-ink-100 p-8 shadow-xs">
        <AlertCircle size={24} className="text-error-600 mx-auto" />
        <h1 className="font-serif text-lg font-bold text-ink-900">Earnings Data Unavailable</h1>
        <p className="text-xs text-ink-500">{error || "Could not retrieve live accounting metrics."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Nursery Earnings Ledger</h1>
        <p className="text-xs text-ink-400 mt-0.5">Historical order revenues, platform commission snapshots, and net payouts settled to your account.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Gross Sales Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-serif font-bold text-ink-900">{formatINR(earnings.totalGrossRevenuePaise)}</p>
            <p className="text-[10px] text-ink-400 mt-0.5">From {earnings.ordersCount} completed orders</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Platform Commission</span>
            <div className="w-8 h-8 rounded-lg bg-warning-50 text-warning-800 flex items-center justify-center">
              <Percent size={16} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-serif font-bold text-warning-800">{formatINR(earnings.totalCommissionPaise)}</p>
            <p className="text-[10px] text-ink-400 mt-0.5">Aggregated per-order snapshots</p>
          </div>
        </div>

        <div className="bg-forest-900 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cream-200/70">Net Seller Earnings</span>
            <div className="w-8 h-8 rounded-lg bg-forest-800 text-forest-200 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-serif font-bold text-forest-200">{formatINR(earnings.totalNetEarningsPaise)}</p>
            <p className="text-[10px] text-cream-100/70 mt-0.5">Total eligible for settlement</p>
          </div>
        </div>
      </div>

      {/* Breakdowns List */}
      <section className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-4">
        <div className="border-b border-ink-100 pb-3 flex justify-between items-center">
          <div>
            <h2 className="font-serif text-base font-bold text-ink-900">Per-Order Fee Breakdown</h2>
            <p className="text-xs text-ink-400">Itemized list of order segment revenues and commission snap deductions.</p>
          </div>
          <span className="text-xs text-ink-500 font-mono flex items-center gap-1">
            <Calendar size={12} /> Live Sync
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-400 bg-cream-50 rounded-xl">
            No transaction records recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Gross Segment</th>
                  <th className="p-3">Platform Fee Rate</th>
                  <th className="p-3">Fee Deducted</th>
                  <th className="p-3 text-right">Net Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {orders.map((o) => {
                  const gross = o.subtotalPaise || 0;
                  const commission = (o as any).commissionPaise ?? (o.commissionRateSnapshot !== undefined ? Math.round(gross * o.commissionRateSnapshot) : 0);
                  const net = (o as any).sellerPayoutPaise ?? (gross - commission);
                  const rateStr = o.commissionRateSnapshot !== undefined ? `${(o.commissionRateSnapshot * 100).toFixed(1)}%` : "—";

                  return (
                    <tr key={o.masterOrderId} className="hover:bg-cream-50/50">
                      <td className="p-3 font-mono font-bold text-ink-900">{o.masterOrderId}</td>
                      <td className="p-3 text-ink-600">{o.createdAt}</td>
                      <td className="p-3 font-semibold text-ink-700">{formatINR(gross)}</td>
                      <td className="p-3 font-mono text-ink-500">{rateStr}</td>
                      <td className="p-3 text-warning-700 font-semibold">-{formatINR(commission)}</td>
                      <td className="p-3 font-bold text-forest-800 text-right">{formatINR(net)}</td>
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
