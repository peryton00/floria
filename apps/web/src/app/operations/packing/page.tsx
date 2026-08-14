"use client";

import { useState, useEffect } from "react";
import { OperationsShell } from "@/components/operations/OperationsShell";
import { api } from "@/lib/api";

export default function OperationsPackingPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getPackingTasks();
      if (res.success && res.data) {
        setTasks(res.data);
      } else {
        setError(res.error?.message || "Failed to load packing tasks");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdatePacking = async (orderId: string, status: string) => {
    try {
      setActionLoading(true);
      const res = await api.updatePackingTask(orderId, status, selectedTask?.items?.length || 1);
      if (res.success) {
        await fetchTasks();
        setSelectedTask(null);
      } else {
        alert(res.error?.message || "Failed to update packing task");
      }
    } catch (e: any) {
      alert(e.message || "Error updating packing task");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <OperationsShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Central Packing Queue</h1>
          <p className="text-xs text-ink-400 mt-0.5">Consolidate multi-nursery plant items into secure customer packages.</p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {/* Tasks Table */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-400">No packing tasks currently in queue.</div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items Count</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {tasks.map((t) => (
                  <tr key={t.orderId} className="hover:bg-cream-50/50">
                    <td className="p-4 font-mono font-bold text-ink-900">{t.orderId}</td>
                    <td className="p-4 font-semibold text-ink-800">{t.customerName}</td>
                    <td className="p-4 font-bold text-forest-800">{t.items?.length || 0} items</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-forest-50 text-forest-700 border border-forest-100">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTask(t)}
                        className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[10px] uppercase tracking-wider transition-colors"
                      >
                        Inspect & Pack
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Packing Verification Drawer */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">Packing Order {selectedTask.orderId}</h3>
                  <p className="text-xs text-ink-400 mt-0.5">Customer: {selectedTask.customerName}</p>
                </div>
                <button type="button" onClick={() => setSelectedTask(null)} className="text-ink-400 hover:text-ink-900 font-bold text-sm">✕</button>
              </div>

              {/* Items Verification Checklist */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-700">Verification Checklist</p>
                <div className="bg-cream-50 rounded-xl p-3 space-y-2 text-xs">
                  {(selectedTask.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between border-b border-ink-100 pb-1">
                      <span className="font-semibold text-ink-900">{item.product_name_snapshot || "Plant Item"}</span>
                      <span className="font-mono text-ink-500">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdatePacking(selectedTask.orderId, "Packing Verified")}
                  className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Mark Package Complete
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-bold text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OperationsShell>
  );
}
