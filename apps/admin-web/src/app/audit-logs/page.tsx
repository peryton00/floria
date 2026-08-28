"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useToast } from "@/lib/contexts/ToastContext";
import { AuditIcon, RefreshIcon, ShieldAlertIcon } from "@/components/ui/Icons";

export default function AdminAuditLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAuditLogs();
      if (res.success && res.data) {
        setLogs(res.data);
      } else {
        setError(res.error?.message || "Failed to load audit events.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to audit repository.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Immutable Audit Trail & Security Events
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            System records of administrative mutations, seller status changes,
            and privilege grants
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-xs font-bold text-ink-700 transition-colors shadow-xs"
        >
          <RefreshIcon size={14} /> Refresh Audit Trail
        </button>
      </div>

      <div className="bg-cream-50 border border-cream-300 rounded-2xl shadow-xs overflow-hidden">
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-200/70 border-b border-cream-300 text-ink-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor ID / Role</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                  <th className="py-3.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {logs.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-cream-100/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-ink-500 whitespace-nowrap">
                      {formatDate(l.created_at)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-forest-900">
                      {l.action}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-ink-800">
                      <div>
                        {l.user_id
                          ? `${l.user_id.substring(0, 8)}...`
                          : "System"}
                      </div>
                      <div className="text-[10px] text-ink-400 uppercase">
                        {l.role || "admin"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-ink-700">
                      {l.entity_type}{" "}
                      {l.entity_id ? `(${l.entity_id.substring(0, 8)})` : ""}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-ink-600 truncate max-w-xs">
                      {l.metadata ? JSON.stringify(l.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 text-xs text-ink-500">
            No audit logs captured yet.
          </div>
        )}
      </div>
    </div>
  );
}
