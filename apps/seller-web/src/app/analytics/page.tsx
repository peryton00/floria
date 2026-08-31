"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { LineChart, BarChart } from "@/components/admin/SvgCharts";
import { FloriaIcon } from "@floria/icons";

type RangeType = "7d" | "30d" | "90d" | "12m" | "today";

function generateTimelineBuckets(
  range: RangeType,
  backendSeries: Array<{ date: string; grossRevenuePaise: number; ordersCount: number; unitsSold?: number }>,
) {
  const seriesMap = new Map<
    string,
    { grossRevenuePaise: number; ordersCount: number; unitsSold: number }
  >();

  (backendSeries || []).forEach((s) => {
    seriesMap.set(s.date, {
      grossRevenuePaise: s.grossRevenuePaise || 0,
      ordersCount: s.ordersCount || 0,
      unitsSold: s.unitsSold || 0,
    });
  });

  const now = new Date();
  let daysCount = 30;
  if (range === "7d") daysCount = 7;
  else if (range === "30d") daysCount = 30;
  else if (range === "90d") daysCount = 90;
  else if (range === "12m") daysCount = 365;
  else if (range === "today") daysCount = 1;

  const points: Array<{
    label: string;
    date: string;
    revenue: number;
    orders: number;
    units: number;
  }> = [];

  if (range === "12m") {
    for (let m = 11; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });

      let rev = 0;
      let ord = 0;
      let units = 0;
      seriesMap.forEach((val, dt) => {
        if (dt.startsWith(yearMonth)) {
          rev += (val.grossRevenuePaise || 0) / 100;
          ord += val.ordersCount || 0;
          units += val.unitsSold || 0;
        }
      });
      points.push({
        label,
        date: yearMonth,
        revenue: Math.round(rev),
        orders: ord,
        units,
      });
    }
  } else if (range === "today") {
    const todayStr = now.toISOString().split("T")[0];
    const todayData = seriesMap.get(todayStr) || {
      grossRevenuePaise: 0,
      ordersCount: 0,
      unitsSold: 0,
    };
    points.push({
      label: "12 AM",
      date: `${todayStr}-00`,
      revenue: 0,
      orders: 0,
      units: 0,
    });
    points.push({
      label: "6 AM",
      date: `${todayStr}-06`,
      revenue: 0,
      orders: 0,
      units: 0,
    });
    points.push({
      label: "12 PM",
      date: `${todayStr}-12`,
      revenue: Math.round(((todayData.grossRevenuePaise || 0) / 100) * 0.4),
      orders: Math.floor((todayData.ordersCount || 0) * 0.4),
      units: Math.floor((todayData.unitsSold || 0) * 0.4),
    });
    points.push({
      label: "6 PM",
      date: `${todayStr}-18`,
      revenue: Math.round(((todayData.grossRevenuePaise || 0) / 100) * 0.8),
      orders: Math.floor((todayData.ordersCount || 0) * 0.8),
      units: Math.floor((todayData.unitsSold || 0) * 0.8),
    });
    points.push({
      label: "Now",
      date: `${todayStr}-now`,
      revenue: Math.round((todayData.grossRevenuePaise || 0) / 100),
      orders: todayData.ordersCount || 0,
      units: todayData.unitsSold || 0,
    });
  } else {
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dateParts = dateStr.split("-");
      const label = `${dateParts[2]}/${dateParts[1]}`;
      const entry = seriesMap.get(dateStr) || {
        grossRevenuePaise: 0,
        ordersCount: 0,
        unitsSold: 0,
      };
      points.push({
        label,
        date: dateStr,
        revenue: Math.round((entry.grossRevenuePaise || 0) / 100),
        orders: entry.ordersCount || 0,
        units: entry.unitsSold || 0,
      });
    }
  }

  return points;
}

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

  const timeline = useMemo(() => {
    return generateTimelineBuckets(range, data?.series || []);
  }, [range, data]);

  const chartData = useMemo(() => {
    const revenue = timeline.map((p) => ({
      label: p.label,
      value: p.revenue,
    }));

    const orders = timeline.map((p) => ({
      label: p.label,
      value: p.orders,
    }));

    return { revenue, orders };
  }, [timeline]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-6 animate-pulse font-ui">
        <div className="h-10 w-48 bg-floria-sand/70 rounded-xl border border-floria-border" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-floria-sand/70 rounded-2xl w-full border border-floria-border"
            />
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
        <FloriaIcon
          name="warning"
          size={28}
          className="text-rose-600 mx-auto"
        />
        <h1 className="font-serif text-lg font-bold text-ink-900">
          Analytics Offline
        </h1>
        <p className="text-xs text-ink-500">
          {error || "Could not retrieve live sales aggregations."}
        </p>
      </div>
    );
  }

  const { summary, topProducts, categories } = data;
  const grossRevenuePaise = summary?.grossRevenuePaise || 0;
  const ordersCount = summary?.ordersCount || 0;
  const unitsSold = summary?.unitsSold || 0;
  const aov = ordersCount > 0 ? Math.round(grossRevenuePaise / ordersCount) : 0;

  return (
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Title & Range Switcher Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">
              Sales &amp; Orders Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate your nursery sales revenue growth and botanical variety performance.
          </p>
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
          {
            label: "Gross Revenue",
            value: formatINR(grossRevenuePaise),
            sub: "Total sales volume",
            icon: <FloriaIcon name="trending_up" size={18} />,
            color: "bg-forest-50 text-forest-700 border border-forest-100",
          },
          {
            label: "Total Orders",
            value: ordersCount,
            sub: "Verified orders",
            icon: <FloriaIcon name="orders" size={18} />,
            color: "bg-sky-50 text-sky-700 border border-sky-100",
          },
          {
            label: "Plants Sold",
            value: unitsSold,
            sub: "Item quantities",
            icon: <FloriaIcon name="plant" size={18} />,
            color: "bg-emerald-50 text-emerald-700 border border-emerald-100",
          },
          {
            label: "Avg Order Value",
            value: formatINR(aov),
            sub: "Per-order average",
            icon: <FloriaIcon name="calendar" size={18} />,
            color: "bg-amber-50 text-amber-700 border border-amber-100",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs hover:border-slate-400 transition-all flex items-start justify-between"
          >
            <div className="min-w-0 flex-1 pr-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                {kpi.label}
              </p>
              <p className="font-mono text-xl font-bold text-[#0F172A] mt-1.5 tracking-tight truncate">
                {kpi.value}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {kpi.sub}
              </p>
            </div>
            <div
              className={`w-9 h-9 rounded ${kpi.color} flex items-center justify-center flex-shrink-0 shadow-xs`}
            >
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
              <FloriaIcon name="star" size={16} className="text-amber-600" /> Best Performing Botanical Varieties
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
              <FloriaIcon name="analytics" size={16} className="text-[#1B4D3E]" /> Category Breakdown
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
