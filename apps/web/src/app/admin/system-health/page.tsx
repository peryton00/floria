"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import {
  Activity,
  Database,
  Cpu,
  Server,
  Layers,
  AlertTriangle,
  Clock,
  RefreshCw,
  Box,
  ShoppingBag,
  Store,
  Users,
  FolderTree,
  FileText
} from "lucide-react";

export default function AdminSystemHealthPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchHealth = async () => {
    try {
      setError(null);
      const res = await api.getAdminHealth();
      if (res.success && res.data) {
        setMetrics(res.data);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setError(res.error?.message || "Failed to load health metrics");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend diagnostics API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    if (!autoRefresh) return;
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const ramPercent = metrics?.system?.memory?.percentage ?? 0;
  const sysUptime = metrics?.system?.uptime ?? 0;
  const sysDays = Math.floor(sysUptime / (3600 * 24));
  const sysHours = Math.floor((sysUptime % (3600 * 24)) / 3600);
  const sysMinutes = Math.floor((sysUptime % 3600) / 60);

  const procMemory = metrics?.system?.processMemory;
  const dbRecords = metrics?.database?.records;
  const queues = metrics?.operationalQueues;

  return (
    <AdminShell>
      <div className="space-y-6 pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight flex items-center gap-2">
              <Activity className="text-forest-700" size={24} /> System Health & Database Diagnostics
            </h1>
            <p className="text-xs text-ink-400 mt-0.5">
              Live telemetry monitoring backend container health, V8 heap usage, PostgreSQL table counts, and business alert queues.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors flex items-center gap-1.5 ${
                autoRefresh
                  ? "bg-success-50 text-success-700 border-success-200"
                  : "bg-cream-50 text-ink-500 border-ink-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-success-500 animate-pulse" : "bg-ink-300"}`} />
              {autoRefresh ? "Auto-Refresh 5s" : "Paused"}
            </button>

            <button
              type="button"
              onClick={fetchHealth}
              className="px-3.5 py-1.5 border border-ink-200 text-ink-700 bg-white hover:bg-cream-100 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700 flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading && !metrics ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Stat Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-ink-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Database Ping</span>
                  <Database size={16} className="text-forest-700" />
                </div>
                <p className="text-xl font-bold font-mono text-forest-800">
                  {metrics?.database?.latencyMs ?? 0} <span className="text-xs font-normal">ms</span>
                </p>
                <p className="text-[10px] text-success-600 font-medium">PostgreSQL Connected</p>
              </div>

              <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-ink-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Host RAM Used</span>
                  <Server size={16} className="text-blue-700" />
                </div>
                <p className="text-xl font-bold font-mono text-ink-900">{ramPercent}%</p>
                <p className="text-[10px] text-ink-400 font-mono">
                  {metrics?.system?.memory?.used ?? 0} MB / {metrics?.system?.memory?.total ?? 0} MB
                </p>
              </div>

              <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-ink-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">V8 Heap Used</span>
                  <Cpu size={16} className="text-purple-700" />
                </div>
                <p className="text-xl font-bold font-mono text-ink-900">
                  {procMemory?.heapUsedMb ?? 0} <span className="text-xs font-normal">MB</span>
                </p>
                <p className="text-[10px] text-ink-400 font-mono">
                  Heap Total: {procMemory?.heapTotalMb ?? 0} MB
                </p>
              </div>

              <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-ink-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Container Uptime</span>
                  <Clock size={16} className="text-amber-700" />
                </div>
                <p className="text-xl font-bold font-mono text-ink-900">
                  {sysDays}d {sysHours}h {sysMinutes}m
                </p>
                <p className="text-[10px] text-ink-400">Node Process Active</p>
              </div>
            </div>

            {/* Operational Alert Monitors */}
            <div className="bg-cream-50 rounded-2xl border border-ink-100 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-serif text-sm font-bold text-ink-900 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-warning-600" /> Operational & Business Queue Alerts
                </h2>
                <span className="text-[10px] text-ink-400 font-mono">Last Sync: {lastUpdated}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-ink-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <p className="text-xs font-bold text-ink-900">Pending Seller Onboarding</p>
                    <p className="text-[10px] text-ink-400 mt-0.5">Nursery applications awaiting review</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-xs font-mono ${
                    (queues?.pendingApplications ?? 0) > 0
                      ? "bg-warning-50 text-warning-700 border border-warning-200"
                      : "bg-success-50 text-success-700"
                  }`}>
                    {queues?.pendingApplications ?? 0}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-ink-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <p className="text-xs font-bold text-ink-900">Preparing Orders SLA</p>
                    <p className="text-[10px] text-ink-400 mt-0.5">Orders in active nursery preparation</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full font-bold text-xs font-mono bg-blue-50 text-blue-800 border border-blue-100">
                    {queues?.preparingOrders ?? 0}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-ink-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <p className="text-xs font-bold text-ink-900">Low Stock Escalations</p>
                    <p className="text-[10px] text-ink-400 mt-0.5">Products at or below threshold</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-xs font-mono ${
                    (queues?.lowStockAlerts ?? 0) > 0
                      ? "bg-error-50 text-error-700 border border-error-200"
                      : "bg-cream-100 text-ink-600"
                  }`}>
                    {queues?.lowStockAlerts ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Database Table Record Counts */}
            <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-4">
              <div>
                <h2 className="font-serif text-base font-bold text-ink-900 flex items-center gap-2">
                  <Layers size={18} className="text-forest-700" /> Database Table Record Counts (Supabase / Postgres)
                </h2>
                <p className="text-xs text-ink-400 mt-0.5">Exact row count distribution fetched dynamically via PostgreSQL database query.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-cream-50/70 rounded-xl border border-ink-100/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-forest-700">
                    <Box size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-600">Products</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-ink-900">{dbRecords?.products ?? 0}</p>
                </div>

                <div className="p-3 bg-cream-50/70 rounded-xl border border-ink-100/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-700">
                    <ShoppingBag size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-600">Orders</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-ink-900">{dbRecords?.orders ?? 0}</p>
                </div>

                <div className="p-3 bg-cream-50/70 rounded-xl border border-ink-100/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-700">
                    <Store size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-600">Sellers</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-ink-900">{dbRecords?.sellers ?? 0}</p>
                </div>

                <div className="p-3 bg-cream-50/70 rounded-xl border border-ink-100/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-700">
                    <Users size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-600">Users</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-ink-900">{dbRecords?.users ?? 0}</p>
                </div>

                <div className="p-3 bg-cream-50/70 rounded-xl border border-ink-100/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <FolderTree size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-600">Categories</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-ink-900">{dbRecords?.categories ?? 0}</p>
                </div>

                <div className="p-3 bg-cream-50/70 rounded-xl border border-ink-100/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-ink-700">
                    <FileText size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-600">Audit Logs</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-ink-900">{dbRecords?.auditLogs ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Memory & Host Architecture Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* RAM Distribution */}
              <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs space-y-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900 flex items-center gap-2">
                    <Server size={14} /> Physical Host Memory Footprint
                  </h2>
                  <p className="text-[10px] text-ink-400 mt-0.5">Used physical RAM vs total host memory capacity.</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-ink-600">RAM Utilized</span>
                    <span className="text-forest-800">{ramPercent}%</span>
                  </div>
                  <div className="w-full bg-cream-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-forest-700 h-full rounded-full transition-all duration-500"
                      style={{ width: `${ramPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-ink-400 font-mono">
                    <span>Used: {metrics?.system?.memory?.used ?? 0} MB</span>
                    <span>Free: {metrics?.system?.memory?.free ?? 0} MB</span>
                    <span>Total: {metrics?.system?.memory?.total ?? 0} MB</span>
                  </div>
                </div>
              </div>

              {/* V8 Process Memory Breakdown */}
              <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs space-y-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900 flex items-center gap-2">
                    <Cpu size={14} /> V8 Process Memory Breakdown
                  </h2>
                  <p className="text-[10px] text-ink-400 mt-0.5">Node.js process heap & RSS memory metrics.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs font-mono">
                  <div className="p-2.5 bg-cream-50 rounded-lg flex justify-between items-center">
                    <span className="text-ink-500 font-sans text-[11px]">RSS (Resident)</span>
                    <span className="font-bold text-ink-900">{procMemory?.rssMb ?? 0} MB</span>
                  </div>
                  <div className="p-2.5 bg-cream-50 rounded-lg flex justify-between items-center">
                    <span className="text-ink-500 font-sans text-[11px]">Heap Total</span>
                    <span className="font-bold text-ink-900">{procMemory?.heapTotalMb ?? 0} MB</span>
                  </div>
                  <div className="p-2.5 bg-cream-50 rounded-lg flex justify-between items-center">
                    <span className="text-ink-500 font-sans text-[11px]">Heap Used</span>
                    <span className="font-bold text-forest-800">{procMemory?.heapUsedMb ?? 0} MB</span>
                  </div>
                  <div className="p-2.5 bg-cream-50 rounded-lg flex justify-between items-center">
                    <span className="text-ink-500 font-sans text-[11px]">External</span>
                    <span className="font-bold text-purple-800">{procMemory?.externalMb ?? 0} MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
