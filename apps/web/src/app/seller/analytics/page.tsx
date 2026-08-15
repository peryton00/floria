"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { LineChart, BarChart } from "@/components/admin/SvgCharts";
import {
  TrendingUp,
  ShoppingBag,
  Leaf,
  Calendar,
  AlertTriangle,
  Award,
  PieChart
} from "lucide-react";

type RangeType = "7d" | "30d" | "90d" | "12m" | "today";

export default function SellerAnalyticsPage() {
  const [range, setRange] = useState<RangeType>("30d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getSellerAnalytics({ range });
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error?.message || "Failed to retrieve analytics metrics");
        }
      } catch (err: any) {
        setError(err.message || "Failed to connect to API");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [range]);

  const chartData = useMemo(() => {
    if (!data || !data.series) return { revenue: [], orders: [] };

    const revenue = data.series.map((s: any) => {
      // format date label for display
      const dateParts = s.date.split("-");
      const label = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : s.date;
      return {
        label,
        value: s.grossRevenuePaise / 100,
      };
    });

    const orders = data.series.map((s: any) => {
      const dateParts = s.date.split("-");
      const label = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : s.date;
      return {
        label,
        value: s.ordersCount,
      };
    });

    return { revenue, orders };
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-ink-100/70 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-ink-100/70 rounded-xl w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-ink-100/70 rounded-2xl w-full" />
          <div className="h-72 bg-ink-100/70 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 bg-white rounded-2xl border border-ink-100 p-8 shadow-xs">
        <AlertTriangle size={24} className="text-error-600 mx-auto" />
        <h1 className="font-serif text-lg font-bold text-ink-900">Analytics Offline</h1>
        <p className="text-xs text-ink-500">{error || "Could not retrieve live sales aggregations."}</p>
      </div>
    );
  }

  const { summary, topProducts, categories } = data;
  const aov = summary.ordersCount > 0 ? summary.grossRevenuePaise / summary.ordersCount : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Title & Range Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Sales & Orders Analytics</h1>
          <p className="text-xs text-ink-400 mt-0.5">Evaluate your nursery sales revenue growth and inventory category performance.</p>
        </div>

        {/* Date Ranges */}
        <div className="flex bg-cream-100/80 p-1 rounded-xl border border-ink-100/50">
          {(["today", "7d", "30d", "90d", "12m"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${range === r ? "bg-white text-forest-900 shadow-xs" : "text-ink-500 hover:text-ink-900"}`}
            >
              {r === "today" ? "Today" : r === "12m" ? "12M" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Gross Revenue", value: formatINR(summary.grossRevenuePaise), sub: "Total segment sales", icon: <TrendingUp size={16} />, color: "bg-forest-50 text-forest-800" },
          { label: "Total Orders", value: summary.ordersCount, sub: "Unique orders", icon: <ShoppingBag size={16} />, color: "bg-blue-50 text-blue-800" },
          { label: "Plants Sold", value: summary.unitsSold, sub: "Item quantities", icon: <Leaf size={16} />, color: "bg-purple-50 text-purple-800" },
          { label: "Avg Order Value", value: formatINR(aov), sub: "Average transaction", icon: <Calendar size={16} />, color: "bg-warning-50 text-warning-800" }
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-ink-100 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold uppercase tracking-wider text-ink-400 leading-tight">{kpi.label}</span>
              <div className={`w-7 h-7 rounded-lg ${kpi.color} flex items-center justify-center`}>
                {kpi.icon}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xl font-serif font-bold text-ink-900 leading-tight">{kpi.value}</p>
              <p className="text-[10px] text-ink-400 mt-0.5">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SVG Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-4">
          <h2 className="font-serif text-sm font-bold text-ink-900">Revenue Growth Trend (₹)</h2>
          <div className="pt-2">
            <LineChart
              data={chartData.revenue}
              height={180}
              strokeColor="#1b4332"
              fillColor="rgba(27, 67, 50, 0.05)"
              valueFormatter={(val) => `₹${Math.round(val)}`}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-4">
          <h2 className="font-serif text-sm font-bold text-ink-900">Orders Frequency Trend</h2>
          <div className="pt-2">
            <BarChart
              data={chartData.orders}
              height={180}
              barColor="#40916c"
              valueFormatter={(val) => `${Math.round(val)}`}
            />
          </div>
        </div>
      </div>

      {/* Bottom Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top selling products */}
        <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-3">
          <h2 className="font-serif text-sm font-bold text-ink-900 flex items-center gap-1.5">
            <Award size={16} className="text-warning-600" /> Best Performing Plants
          </h2>
          
          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-400 bg-cream-50 rounded-xl">
              No sales data recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-ink-100 text-xs">
              {topProducts.map((p: any, idx: number) => (
                <div key={idx} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-ink-900">{p.name}</span>
                    <p className="text-[10px] text-ink-400 mt-0.5">{p.quantity} units sold</p>
                  </div>
                  <span className="font-bold text-forest-800">{formatINR(p.revenuePaise)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category distribution */}
        <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-3">
          <h2 className="font-serif text-sm font-bold text-ink-900 flex items-center gap-1.5">
            <PieChart size={16} className="text-forest-700" /> Category Breakdown
          </h2>
          
          {categories.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-400 bg-cream-50 rounded-xl">
              No sales data recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-ink-100 text-xs">
              {categories.map((c: any, idx: number) => (
                <div key={idx} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-ink-700">{c.name}</span>
                    <p className="text-[10px] text-ink-400 mt-0.5">{c.quantity} plants sold</p>
                  </div>
                  <span className="font-bold text-forest-800">{formatINR(c.revenuePaise)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
