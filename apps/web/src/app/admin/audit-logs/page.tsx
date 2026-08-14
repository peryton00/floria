"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
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

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">System Audit Trail</h1>
            <p className="text-xs text-ink-400 mt-0.5">Immutable, append-only system audit events for security and compliance oversight.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Logged Events:</span>
            <span className="px-3 py-1 rounded-full bg-forest-50 text-forest-700 font-bold text-xs border border-forest-100">
              {logs.length} Audit Entries
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-700">Filter by Actor Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="operations">Operations</option>
              <option value="seller">Seller</option>
              <option value="customer">Customer</option>
              <option value="system">System</option>
            </select>
          </div>
          <span className="text-[11px] font-bold text-forest-700 uppercase tracking-wider bg-forest-50 px-3 py-1 rounded-full border border-forest-100">
            Append-Only Verified
          </span>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-400">No audit log records found.</div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Actor Role</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Resource Type</th>
                  <th className="p-4">Resource ID</th>
                  <th className="p-4 text-right">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-cream-50/50">
                    <td className="p-4 font-mono text-ink-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-forest-50 text-forest-700 border border-forest-100">
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-ink-900">{log.action}</td>
                    <td className="p-4 text-ink-600">{log.resource_type}</td>
                    <td className="p-4 font-mono text-ink-500 max-w-xs truncate">{log.resource_id || "N/A"}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[10px] uppercase tracking-wider transition-colors"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Audit Log Payload Viewer */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-ink-100 pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">{selectedLog.action}</h3>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="bg-cream-50 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-ink-500">Actor User ID:</span> <span className="font-mono text-ink-900">{selectedLog.actor_user_id || "System"}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Actor Role:</span> <span className="font-bold uppercase text-ink-900">{selectedLog.actor_role}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Resource Type:</span> <span className="font-semibold text-ink-900">{selectedLog.resource_type}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Resource ID:</span> <span className="font-mono text-ink-900">{selectedLog.resource_id || "N/A"}</span></div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">Metadata Payload</p>
                <pre className="p-3 bg-ink-900 text-cream-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
