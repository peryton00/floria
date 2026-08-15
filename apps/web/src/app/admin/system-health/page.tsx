"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";

export default function AdminSystemHealthPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const res = await api.getAdminHealth();
      if (res.success && res.data) {
        setMetrics(res.data);
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
    // Auto refresh every 5 seconds for real-time monitoring
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const ramPercent = metrics?.system?.memory?.percentage ?? 0;
  const sysUptime = metrics?.system?.uptime ?? 0;
  const sysDays = Math.floor(sysUptime / (3600 * 24));
  const sysHours = Math.floor((sysUptime % (3600 * 24)) / 3600);
  const sysMinutes = Math.floor((sysUptime % 3600) / 60);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">System Health & Diagnostics</h1>
            <p className="text-xs text-ink-400 mt-0.5">Real-time status of backend API container, database ping, CPU allocation, and memory footprint.</p>
          </div>
          <button
            type="button"
            onClick={fetchHealth}
            className="px-3.5 py-1.5 border border-ink-200 text-ink-700 bg-white hover:bg-cream-100 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            Refresh Logs
          </button>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Memory footprints */}
            <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">RAM Allocation footprint</h2>
                <p className="text-[10px] text-ink-400 mt-0.5">Used physical RAM compared to total host capacity.</p>
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
                  <span>Total: {metrics?.system?.memory?.total ?? 0} MB</span>
                </div>
              </div>
            </div>

            {/* CPU & Latency */}
            <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">CPU & Database Ping</h2>
                <p className="text-[10px] text-ink-400 mt-0.5">Active load averages and database connectivity times.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-cream-50 rounded-xl space-y-1">
                  <p className="text-[9px] font-bold text-ink-400 uppercase tracking-wider">CPU Threads</p>
                  <p className="text-lg font-bold text-ink-900 font-mono">{metrics?.system?.cpuCount ?? 1} Cores</p>
                </div>
                <div className="p-3 bg-cream-50 rounded-xl space-y-1">
                  <p className="text-[9px] font-bold text-ink-400 uppercase tracking-wider">Database Ping</p>
                  <p className="text-lg font-bold text-forest-800 font-mono">{metrics?.database?.latencyMs ?? 0} ms</p>
                </div>
              </div>
            </div>

            {/* Container Info */}
            <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">Uptime & Environment Details</h2>
                <p className="text-[10px] text-ink-400 mt-0.5">Node process execution timeline and architecture settings.</p>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between py-1 border-b border-ink-50">
                  <span className="text-ink-500 font-medium">Uptime</span>
                  <span className="font-mono font-bold text-ink-800">
                    {sysDays}d {sysHours}h {sysMinutes}m
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-ink-50">
                  <span className="text-ink-500 font-medium">Platform OS</span>
                  <span className="font-mono text-ink-800 uppercase text-[10px]">{metrics?.system?.platform ?? "N/A"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-500 font-medium">CPU Arch</span>
                  <span className="font-mono text-ink-800 uppercase text-[10px]">{metrics?.system?.arch ?? "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
