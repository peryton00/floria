"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, type SellerDashboardData } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { PayoutIcon, AlertIcon } from "@/components/ui/Icons";

export default function SellerPayoutsPage() {
  const [data, setData] = useState<SellerDashboardData | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayouts() {
      try {
        setLoading(true);
        const [dashRes, settingsRes] = await Promise.all([
          api.getSellerDashboard(),
          api.getPlatformSettings().catch(() => ({ success: false, data: { commissionRate: 12 } })),
        ]);

        if (dashRes.success && dashRes.data) {
          setData(dashRes.data);
        } else {
          setError(dashRes.error?.message || "Failed to load seller earnings");
        }

        if (settingsRes.success && settingsRes.data?.commissionRate !== undefined) {
          setCommissionRate(settingsRes.data.commissionRate);
        }
      } catch (e: any) {
        setError(e.message || "Failed to connect to API");
      } finally {
        setLoading(false);
      }
    }
    loadPayouts();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-4 animate-pulse">
        <div className="h-32 bg-ink-100/70 rounded-2xl w-full" />
        <div className="h-64 bg-ink-100/70 rounded-2xl w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-3">
        <AlertIcon size={24} className="text-error-600 mx-auto" />
        <h1 className="font-serif text-lg font-bold text-ink-900">Earnings Data Unavailable</h1>
        <p className="text-xs text-ink-500">{error || "Could not retrieve seller earnings from API."}</p>
      </div>
    );
  }

  const { kpis, profile } = data;
  const totalGrossPaise = kpis.totalRevenuePaise || 0;
  const commissionPaise = Math.round(totalGrossPaise * (commissionRate / 100.0));
  const netEarningsPaise = totalGrossPaise - commissionPaise;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Earnings & Settlement Summary</h1>
        <p className="text-xs text-ink-400 mt-0.5">Real-time revenue, marketplace commission, and net nursery earnings for {profile?.business_name || "your nursery"}.</p>
      </div>

      {/* Earnings Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Gross Sales Revenue</p>
          <p className="text-2xl font-serif font-bold text-ink-900 mt-1">{formatINR(totalGrossPaise)}</p>
          <p className="text-[10px] text-ink-400 mt-0.5">{kpis.totalOrders} total seller order(s)</p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Floria Commission ({commissionRate}%)</p>
          <p className="text-2xl font-serif font-bold text-forest-700 mt-1">{formatINR(commissionPaise)}</p>
          <p className="text-[10px] text-ink-400 mt-0.5">Platform hosting & logistics fee</p>
        </div>

        <div className="bg-forest-900 text-white rounded-2xl p-5 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-cream-200/70">Net Nursery Earnings</p>
          <p className="text-2xl font-serif font-bold text-forest-200 mt-1">{formatINR(netEarningsPaise)}</p>
          <p className="text-[10px] text-cream-100/70 mt-0.5">Eligible for payout settlement</p>
        </div>
      </div>

      {/* Payout Information Notice */}
      <div className="bg-cream-50 rounded-2xl border border-ink-100 p-6 space-y-2 text-xs">
        <h2 className="font-bold text-ink-900 text-sm">Settlement & Payout Policy</h2>
        <p className="text-ink-600 leading-relaxed">
          Payouts are settled directly to your registered bank account on a bi-weekly cycle for all orders marked <strong className="text-ink-900">Picked Up</strong> or <strong className="text-ink-900">Delivered</strong>.
        </p>
        <div className="pt-2">
          <Link href="/seller/profile" className="text-forest-700 font-bold hover:underline">
            View / Update Bank Settlement Details in Profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
