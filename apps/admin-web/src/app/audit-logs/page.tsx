"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { FloriaIcon } from "@floria/icons";

type CategoryFilter = "all" | "auth" | "changes" | "security";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAuditLogs(roleFilter !== "all" ? { role: roleFilter } : undefined);

      if (res.success && res.data) {
        setLogs(res.data);
      } else {
        setError(res.error?.message || "Failed to load audit logs");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [roleFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const act = (log.action || "").toUpperCase();
      
      // Category filter
      if (categoryFilter === "auth") {
        const isAuth = act.includes("LOGIN") || act.includes("LOGOUT") || act.includes("SIGNIN") || act.includes("LINK") || act.includes("AUTH");
        if (!isAuth) return false;
      } else if (categoryFilter === "changes") {
        const isAuth = act.includes("LOGIN") || act.includes("LOGOUT") || act.includes("SIGNIN") || act.includes("LINK");
        const isSec = act.includes("FAILED") || act.includes("LIMITED") || act.includes("FORBIDDEN");
        if (isAuth || isSec) return false;
      } else if (categoryFilter === "security") {
        const isSec = act.includes("FAILED") || act.includes("LIMITED") || act.includes("FORBIDDEN");
        if (!isSec) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAction = (log.action || "").toLowerCase().includes(q);
        const matchActor = (log.actor_user_id || "").toLowerCase().includes(q);
        const matchRole = (log.actor_role || "").toLowerCase().includes(q);
        const matchResource = (log.resource_type || "").toLowerCase().includes(q) || (log.resource_id || "").toLowerCase().includes(q);
        if (!matchAction && !matchActor && !matchRole && !matchResource) return false;
      }

      return true;
    });
  }, [logs, categoryFilter, searchQuery]);

  const getBadgeStyle = (action: string) => {
    const act = (action || "").toUpperCase();
    if (act.includes("LOGIN") || act.includes("SIGNIN")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (act.includes("LOGOUT")) {
      return "bg-slate-100 text-slate-700 border-slate-200";
    }
    if (act.includes("FAILED") || act.includes("SUSPENDED") || act.includes("FORBIDDEN") || act.includes("REJECTED")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (act.includes("ORDER") || act.includes("FULFILLMENT") || act.includes("DELIVERY")) {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    if (act.includes("PAYMENT") || act.includes("PAYOUT") || act.includes("REFUND") || act.includes("COMMISSION") || act.includes("PROFIT")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  };

  return (
    <AdminShell>
      <div className="space-y-5 font-ui max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-ink-100 pb-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Audit Trail & Security Log</h1>
            <p className="text-xs text-ink-500 mt-0.5">
              Append-only event ledger strictly capturing login/logout authentication and system state modifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="px-3 py-1.5 rounded-lg border border-ink-200 hover:bg-cream-100 text-xs font-bold text-ink-700 transition-colors flex items-center gap-1.5"
            >
              <FloriaIcon name="refresh" size="xs" />
              <span>Refresh Logs</span>
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-forest-50 text-forest-700 font-bold text-xs border border-forest-100">
              {filteredLogs.length} / {logs.length} Entries
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 bg-cream-100 p-1 rounded-xl border border-ink-100 overflow-x-auto">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  categoryFilter === "all" ? "bg-white text-forest-900 shadow-xs" : "text-ink-500 hover:text-ink-800"
                }`}
              >
                All Events ({logs.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("auth")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  categoryFilter === "auth" ? "bg-white text-blue-900 shadow-xs" : "text-ink-500 hover:text-ink-800"
                }`}
              >
                <FloriaIcon name="lock" size="xs" />
                <span>Login &amp; Logout</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("changes")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  categoryFilter === "changes" ? "bg-white text-emerald-900 shadow-xs" : "text-ink-500 hover:text-ink-800"
                }`}
              >
                <FloriaIcon name="activity" size="xs" />
                <span>Data Changes</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("security")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  categoryFilter === "security" ? "bg-white text-rose-900 shadow-xs" : "text-ink-500 hover:text-ink-800"
                }`}
              >
                <FloriaIcon name="warning" size="xs" />
                <span>Security Alerts</span>
              </button>
            </div>

            {/* Role & Search Filter */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search action, user ID, resource..."
                className="px-3 py-1.5 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white w-52"
              />

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white font-medium"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="operations">Operations</option>
                <option value="seller">Seller</option>
                <option value="customer">Customer</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dual-Axis Scrollable Table Component */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-2">
              <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-ink-500 font-medium">Fetching system audit ledger...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-xs text-ink-400 font-medium">
              No audit log records match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[620px] scrollbar-thin">
              <table className="w-full min-w-[960px] border-collapse text-left text-xs whitespace-nowrap">
                <thead className="sticky top-0 z-10 bg-cream-100 text-ink-600 font-bold uppercase tracking-wider border-b border-ink-200 shadow-xs">
                  <tr>
                    <th className="py-3.5 px-4">Timestamp (UTC)</th>
                    <th className="py-3.5 px-4">Actor & Role</th>
                    <th className="py-3.5 px-4">Action Event</th>
                    <th className="py-3.5 px-4">Resource Type</th>
                    <th className="py-3.5 px-4">Resource ID</th>
                    <th className="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 font-ui">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-cream-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-ink-500">
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "medium",
                        })}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-50 text-forest-700 border border-forest-100">
                            {log.actor_role}
                          </span>
                          <span className="font-mono text-[11px] text-ink-600 truncate max-w-[140px]" title={log.actor_user_id || "System"}>
                            {log.actor_user_id ? `${log.actor_user_id.slice(0, 8)}...` : "System"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border ${getBadgeStyle(log.action)}`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-ink-700">
                        {log.resource_type}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-ink-500 max-w-[180px] truncate" title={log.resource_id || "N/A"}>
                        {log.resource_id || "—"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-800 font-bold text-[10px] uppercase tracking-wider transition-colors shadow-2xs"
                        >
                          Inspect Payload
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Audit Log Payload Viewer */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-xl w-full shadow-2xl space-y-4 font-ui animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-start border-b border-ink-100 pb-3">
                <div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border mb-1 ${getBadgeStyle(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                  <p className="text-xs text-ink-500 font-mono">Log ID: {selectedLog.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="w-7 h-7 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center text-ink-600 font-bold text-xs transition-colors"
                >
                  <FloriaIcon name="close" size="xs" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-cream-50 rounded-xl p-3.5 text-xs">
                <div>
                  <span className="text-ink-400 text-[10px] uppercase font-bold block">Timestamp</span>
                  <span className="font-mono text-ink-900 font-medium">
                    {new Date(selectedLog.created_at).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400 text-[10px] uppercase font-bold block">Actor Role</span>
                  <span className="font-bold text-forest-800 uppercase">{selectedLog.actor_role}</span>
                </div>
                <div>
                  <span className="text-ink-400 text-[10px] uppercase font-bold block">Actor User ID</span>
                  <span className="font-mono text-ink-900">{selectedLog.actor_user_id || "System"}</span>
                </div>
                <div>
                  <span className="text-ink-400 text-[10px] uppercase font-bold block">Resource Type / ID</span>
                  <span className="font-medium text-ink-900">{selectedLog.resource_type} {selectedLog.resource_id ? `(${selectedLog.resource_id})` : ""}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">Metadata Payload</p>
                <pre className="p-4 bg-ink-900 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56 shadow-inner leading-relaxed">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-forest-800 hover:bg-forest-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

