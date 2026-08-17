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
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Title & Range Switcher Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Sales &amp; Orders Analytics</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Evaluate your nursery sales revenue growth and botanical variety performance.</p>
        </div>

        {/* Date Ranges */}
        <div className="flex items-center gap-1.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] p-1 shadow-xs">
          {(["today", "7d", "30d", "90d", "12m"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={[
                "px-3 py-1 rounded text-[11px] font-mono font-bold uppercase tracking-wider transition-all",
                range === r
                  ? "bg-[#1B4D3E] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-200/60",
              ].join(" ")}
            >
              {r === "today" ? "Today" : r === "12m" ? "12M" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gross Revenue", value: formatINR(summary.grossRevenuePaise), sub: "Total sales volume", icon: <TrendingUp size={18} />, color: "bg-forest-50 text-forest-700 border border-forest-100" },
          { label: "Total Orders", value: summary.ordersCount, sub: "Verified orders", icon: <ShoppingBag size={18} />, color: "bg-sky-50 text-sky-700 border border-sky-100" },
          { label: "Plants Sold", value: summary.unitsSold, sub: "Item quantities", icon: <Leaf size={18} />, color: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
          { label: "Avg Order Value", value: formatINR(aov), sub: "Per-order average", icon: <Calendar size={18} />, color: "bg-amber-50 text-amber-700 border border-amber-100" }
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs hover:border-slate-400 transition-all flex items-start justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{kpi.label}</p>
              <p className="font-mono text-xl font-bold text-[#0F172A] mt-1.5 tracking-tight truncate">{kpi.value}</p>
              <p className="text-[11px] text-slate-400 mt-1 truncate">{kpi.sub}</p>
            </div>
            <div className={`w-9 h-9 rounded ${kpi.color} flex items-center justify-center flex-shrink-0 shadow-xs`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* SVG Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs space-y-4">
          <h2 className="font-sans text-sm font-bold text-[#0F172A]">Revenue Growth Trend (₹)</h2>
          <div className="pt-2">
            <LineChart
              data={chartData.revenue}
              height={180}
              strokeColor="#1B4D3E"
              fillColor="rgba(27, 77, 62, 0.08)"
              valueFormatter={(val) => `₹${Math.round(val)}`}
            />
          </div>
        </div>

        <div className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs space-y-4">
          <h2 className="font-sans text-sm font-bold text-[#0F172A]">Orders Frequency Trend</h2>
          <div className="pt-2">
            <BarChart
              data={chartData.orders}
              height={180}
              barColor="#1B4D3E"
              valueFormatter={(val) => `${Math.round(val)}`}
            />
          </div>
        </div>
      </div>

      {/* Bottom Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top selling products */}
        <div className="bg-white rounded border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <h2 className="font-sans text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Award size={16} className="text-amber-600" /> Best Performing Botanical Varieties
            </h2>
          </div>
          
          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-500">
              No sales data recorded yet for this timeframe.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0] text-xs">
              {topProducts.map((p: any, idx: number) => (
                <div key={idx} className="p-3.5 sm:px-5 flex justify-between items-center hover:bg-slate-50/80 transition-colors">
                  <div>
                    <span className="font-bold text-[#0F172A]">{p.name}</span>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{p.quantity} units sold</p>
                  </div>
                  <span className="font-mono font-bold text-[#1B4D3E]">{formatINR(p.revenuePaise)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category distribution */}
        <div className="bg-white rounded border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <h2 className="font-sans text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <PieChart size={16} className="text-[#1B4D3E]" /> Category Breakdown
            </h2>
          </div>
          
          {categories.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-500">
              No category sales recorded yet for this timeframe.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0] text-xs">
              {categories.map((c: any, idx: number) => (
                <div key={idx} className="p-3.5 sm:px-5 flex justify-between items-center hover:bg-slate-50/80 transition-colors">
                  <div>
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{c.quantity} plants sold</p>
                  </div>
                  <span className="font-mono font-bold text-[#1B4D3E]">{formatINR(c.revenuePaise)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

