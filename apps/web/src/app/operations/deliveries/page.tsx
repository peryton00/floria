"use client";

import { useState, useEffect } from "react";
import { OperationsShell } from "@/components/operations/OperationsShell";
import { api } from "@/lib/api";
import { useToast } from "@/lib/contexts/ToastContext";

export default function OperationsDeliveriesPage() {
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [assignee, setAssignee] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.getDeliveries(activeStatus !== "all" ? { status: activeStatus } : undefined);
      if (res.success && res.data) {
        setDeliveries(res.data);
      } else {
        setError(res.error?.message || "Failed to load delivery board");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [activeStatus]);

  const handleAssign = async () => {
    if (!selectedDelivery || !assignee.trim()) return;
    try {
      setActionLoading(true);
      const res = await api.assignDelivery(selectedDelivery.order_id, { assignedTo: assignee.trim() });
      if (res.success) {
        toast.success("Delivery assigned", `Delivery assigned to ${assignee.trim()}.`);
        await fetchDeliveries();
        setSelectedDelivery(null);
        setAssignee("");
      } else {
        toast.error("Assignment failed", res.error?.message || "Failed to assign delivery");
      }
    } catch (e: any) {
      toast.error("Assignment failed", e.message || "Error assigning delivery");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedDelivery) return;
    try {
      setActionLoading(true);
      const res = await api.updateDeliveryStatus(selectedDelivery.id, status);
      if (res.success) {
        toast.success("Delivery status updated", `Delivery marked as ${status.replace(/_/g, " ")}.`);
        await fetchDeliveries();
        setSelectedDelivery(null);
      } else {
        toast.error("Update failed", res.error?.message || "Failed to update delivery status");
      }
    } catch (e: any) {
      toast.error("Update failed", e.message || "Error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { key: "all", label: "All Deliveries" },
    { key: "assigned", label: "Assigned Couriers" },
    { key: "out_for_delivery", label: "Out for Delivery" },
    { key: "delivered", label: "Delivered" },
    { key: "failed", label: "Failed Deliveries" },
  ];

  return (
    <OperationsShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Last-Mile Delivery Management</h1>
          <p className="text-xs text-ink-400 mt-0.5">Assign courier operators, track out-for-delivery packages, and log delivery confirmations.</p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex border-b border-ink-100 space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveStatus(tab.key)}
              className={[
                "pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap",
                activeStatus === tab.key
                  ? "border-forest-700 text-forest-700"
                  : "border-transparent text-ink-400 hover:text-ink-900",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Deliveries Table */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : deliveries.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-400">No delivery assignments in this category.</div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-4">Delivery ID</th>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Assigned Operator</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-cream-50/50">
                    <td className="p-4 font-mono font-bold text-ink-900">{d.id}</td>
                    <td className="p-4 font-mono text-ink-600">{d.order_id}</td>
                    <td className="p-4 font-bold text-ink-800">{d.assigned_to || "Unassigned"}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-forest-50 text-forest-700 border border-forest-100">
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => { setSelectedDelivery(d); setAssignee(d.assigned_to || ""); }}
                        className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[10px] uppercase tracking-wider transition-colors"
                      >
                        Manage Delivery
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Delivery Assignment & Status Drawer */}
        {selectedDelivery && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">Delivery Assignment</h3>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">Order ID: {selectedDelivery.order_id}</p>
                </div>
                <button type="button" onClick={() => setSelectedDelivery(null)} className="text-ink-400 hover:text-ink-900 font-bold text-sm">✕</button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  Assign Courier Partner / Operator ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    placeholder="Enter courier operator name or ID..."
                    className="flex-1 px-3 py-2 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleAssign}
                    className="px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-2 border-t border-ink-100">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-700">Advance Delivery Status</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("out_for_delivery")}
                    className="py-2.5 rounded-xl border border-forest-200 bg-forest-50 hover:bg-forest-100 text-forest-800 font-bold text-[10px] uppercase tracking-wider"
                  >
                    Out for Delivery
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus("delivered")}
                    className="py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white font-bold text-[10px] uppercase tracking-wider"
                  >
                    Mark Delivered
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </OperationsShell>
  );
}
