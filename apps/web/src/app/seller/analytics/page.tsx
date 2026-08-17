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
      <div className="max-w-5xl mx-auto py-12 space-y-6 animate-pulse font-ui">
        <div className="h-10 w-48 bg-floria-sand/70 rounded-xl border border-floria-border" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-floria-sand/70 rounded-2xl w-full border border-floria-border" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-floria-sand/70 rounded-3xl w-full border border-floria-border" />
          <div className="h-72 bg-floria-sand/70 rounded-3xl w-full border border-floria-border" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 bg-floria-linen rounded-3xl border border-floria-border p-8 shadow-xs font-ui">
        <AlertTriangle size={28} className="text-rose-600 mx-auto" />
        <h1 className="font-serif text-lg font-bold text-ink-900">Analytics Offline</h1>
        <p className="text-xs text-ink-500">{error || "Could not retrieve live sales aggregations."}</p>
      </div>
    );
  }

  const { summary, topProducts, categories } = data;
  const aov = summary.ordersCount > 0 ? summary.grossRevenuePaise / summary.ordersCount : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-ui">
      {/* Title & Range Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">Sales & Orders Analytics</h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">Evaluate your nursery sales revenue growth and botanical variety performance.</p>
        </div>

        {/* Date Ranges */}
        <div className="flex bg-floria-sand/80 p-1 rounded-2xl border border-floria-border shadow-2xs">
          {(["today", "7d", "30d", "90d", "12m"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${range === r ? "bg-floria-linen text-forest-900 shadow-xs border border-floria-border/80 font-extrabold" : "text-ink-500 hover:text-ink-900"}`}
            >
              {r === "today" ? "Today" : r === "12m" ? "12M" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {[
          { label: "Gross Revenue", value: formatINR(summary.grossRevenuePaise), sub: "Total sales volume", icon: <TrendingUp size={16} />, color: "bg-forest-50 text-forest-800 border-forest-200/70" },
          { label: "Total Orders", value: summary.ordersCount, sub: "Verified orders", icon: <ShoppingBag size={16} />, color: "bg-sky-50 text-sky-800 border-sky-200/70" },
          { label: "Plants Sold", value: summary.unitsSold, sub: "Item quantities", icon: <Leaf size={16} />, color: "bg-emerald-50 text-emerald-800 border-emerald-200/70" },
          { label: "Avg Order Value", value: formatINR(aov), sub: "Per-order average", icon: <Calendar size={16} />, color: "bg-amber-50 text-amber-800 border-amber-200/70" }
        ].map((kpi) => (
          <div key={kpi.label} className="bg-floria-linen rounded-3xl border border-floria-border p-4 sm:p-5 flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink-500 leading-tight">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-xl ${kpi.color} border flex items-center justify-center shadow-2xs`}>
                {kpi.icon}
              </div>
            </div>
            <div className="mt-3.5">
              <p className="text-xl sm:text-2xl font-serif font-bold text-ink-900 leading-tight">{kpi.value}</p>
              <p className="text-[10px] text-ink-400 mt-1">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SVG Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-floria-linen rounded-3xl border border-floria-border p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-base font-bold text-ink-900">Revenue Growth Trend (₹)</h2>
          <div className="pt-2">
            <LineChart
              data={chartData.revenue}
              height={180}
              strokeColor="#1E3A2B"
              fillColor="rgba(30, 58, 43, 0.08)"
              valueFormatter={(val) => `₹${Math.round(val)}`}
            />
          </div>
        </div>

        <div className="bg-floria-linen rounded-3xl border border-floria-border p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-base font-bold text-ink-900">Orders Frequency Trend</h2>
          <div className="pt-2">
            <BarChart
              data={chartData.orders}
              height={180}
              barColor="#254A37"
              valueFormatter={(val) => `${Math.round(val)}`}
            />
          </div>
        </div>
      </div>

      {/* Bottom Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top selling products */}
        <div className="bg-floria-linen rounded-3xl border border-floria-border p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-base font-bold text-ink-900 flex items-center gap-2">
            <Award size={18} className="text-amber-700" /> Best Performing Botanical Varieties
          </h2>
          
          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-xs font-medium text-ink-500 bg-floria-soft-sand rounded-2xl border border-floria-border">
              No sales data recorded yet for this timeframe.
            </div>
          ) : (
            <div className="divide-y divide-floria-border text-xs">
              {topProducts.map((p: any, idx: number) => (
                <div key={idx} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-ink-900 text-xs sm:text-sm">{p.name}</span>
                    <p className="text-[11px] text-ink-500 font-mono mt-0.5">{p.quantity} units sold</p>
                  </div>
                  <span className="font-serif font-bold text-forest-800 text-xs sm:text-sm">{formatINR(p.revenuePaise)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category distribution */}
        <div className="bg-floria-linen rounded-3xl border border-floria-border p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-base font-bold text-ink-900 flex items-center gap-2">
            <PieChart size={18} className="text-forest-800" /> Category Breakdown
          </h2>
          
          {categories.length === 0 ? (
            <div className="p-8 text-center text-xs font-medium text-ink-500 bg-floria-soft-sand rounded-2xl border border-floria-border">
              No category sales recorded yet for this timeframe.
            </div>
          ) : (
            <div className="divide-y divide-floria-border text-xs">
              {categories.map((c: any, idx: number) => (
                <div key={idx} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-ink-800 text-xs sm:text-sm">{c.name}</span>
                    <p className="text-[11px] text-ink-500 font-mono mt-0.5">{c.quantity} plants sold</p>
                  </div>
                  <span className="font-serif font-bold text-forest-800 text-xs sm:text-sm">{formatINR(c.revenuePaise)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
