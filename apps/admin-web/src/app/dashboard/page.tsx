"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import {
  DashboardIcon,
  SellersIcon,
  ProductsIcon,
  OrdersIcon,
  UsersIcon,
  FinanceIcon,
  AlertIcon,
  ArrowRightIcon,
  RefreshIcon,
  ShieldAlertIcon,
} from "@/components/ui/Icons";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminDashboard();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || "Failed to load platform metrics.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to admin services.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-cream-300 rounded-lg w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-cream-200 rounded-2xl border border-cream-300"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-error-50 text-error-600 flex items-center justify-center mx-auto border border-error-100">
          <AlertIcon size={24} />
        </div>
        <h1 className="font-serif text-xl font-bold text-ink-900">
          Admin Dashboard Unavailable
        </h1>
        <p className="text-xs text-ink-500">
          {error || "Could not retrieve live metrics."}
        </p>
        <button
          type="button"
          onClick={fetchDashboard}
          className="px-5 py-2.5 bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { metrics, pendingSellers, recentAudits } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Platform Governance Console
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Real-time marketplace oversight, seller approvals, moderation queues
            & financial reconciliation
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-xs font-bold text-ink-700 transition-colors shadow-xs"
        >
          <RefreshIcon size={14} /> Refresh Metrics
        </button>
      </div>

      {/* Pending Review Alert Banner */}
      {pendingSellers && pendingSellers.length > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-500 text-ink-900 flex items-center justify-center shrink-0">
              <ShieldAlertIcon size={20} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-warning-900">
                {pendingSellers.length} Nursery Partner Applications Awaiting
                Review
              </div>
              <div className="text-xs text-warning-800">
                Inspect business trade licenses and approve verified plant
                growers.
              </div>
            </div>
          </div>
          <Link
            href="/sellers?tab=pending"
            className="px-4 py-2 bg-warning-500 hover:bg-warning-600 text-ink-900 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shrink-0"
          >
            Review Nurseries →
          </Link>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-ink-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Gross Merchandise Volume
            </span>
            <div className="p-2 rounded-xl bg-cream-200 text-forest-800">
              <FinanceIcon size={18} />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-ink-900">
            {formatINR(metrics?.totalGmvPaise || metrics?.gmvPaise || 0)}
          </div>
          <div className="text-[10px] text-ink-500">
            Total marketplace sales volume
          </div>
        </div>

        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-ink-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Active Nurseries
            </span>
            <div className="p-2 rounded-xl bg-cream-200 text-forest-800">
              <SellersIcon size={18} />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-ink-900">
            {metrics?.approvedSellersCount || metrics?.totalSellers || 0}
          </div>
          <div className="text-[10px] text-ink-500">
            {metrics?.pendingSellersCount || 0} pending applications
          </div>
        </div>

        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-ink-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Catalog Listings
            </span>
            <div className="p-2 rounded-xl bg-cream-200 text-forest-800">
              <ProductsIcon size={18} />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-ink-900">
            {metrics?.totalProducts || 0}
          </div>
          <div className="text-[10px] text-ink-500">
            Botanical items across nurseries
          </div>
        </div>

        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-ink-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Customer Orders
            </span>
            <div className="p-2 rounded-xl bg-cream-200 text-forest-800">
              <OrdersIcon size={18} />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-ink-900">
            {metrics?.totalOrders || 0}
          </div>
          <div className="text-[10px] text-ink-500">
            Lifetime processed transactions
          </div>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/sellers"
          className="bg-cream-50 hover:bg-cream-100 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-2 transition-all group"
        >
          <div className="flex items-center justify-between text-forest-900 font-serif font-bold text-base">
            <span>Nursery Partners</span>
            <ArrowRightIcon
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </div>
          <p className="text-xs text-ink-500">
            Verify seller credentials, inspect documents, and enforce commission
            terms.
          </p>
        </Link>

        <Link
          href="/products"
          className="bg-cream-50 hover:bg-cream-100 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-2 transition-all group"
        >
          <div className="flex items-center justify-between text-forest-900 font-serif font-bold text-base">
            <span>Catalog Moderation</span>
            <ArrowRightIcon
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </div>
          <p className="text-xs text-ink-500">
            Audit plant photos, verify taxonomic descriptions, and moderate
            prohibited items.
          </p>
        </Link>

        <Link
          href="/audit-logs"
          className="bg-cream-50 hover:bg-cream-100 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-2 transition-all group"
        >
          <div className="flex items-center justify-between text-forest-900 font-serif font-bold text-base">
            <span>Security & Audit Trail</span>
            <ArrowRightIcon
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </div>
          <p className="text-xs text-ink-500">
            Review immutable system event logs, admin mutations, and security
            alerts.
          </p>
        </Link>
      </div>
    </div>
  );
}
