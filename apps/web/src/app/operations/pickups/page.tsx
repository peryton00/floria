"use client";

import { useState, useEffect } from "react";
import { OperationsShell } from "@/components/operations/OperationsShell";
import { api } from "@/lib/api";
import { LeafIcon } from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";

export default function OperationsPickupsPage() {
  const { toast } = useToast();
  const [pickups, setPickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPickup, setSelectedPickup] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const res = await api.getPickups();
      if (res.success && res.data) {
        setPickups(res.data);
      } else {
        setError(res.error?.message || "Failed to load pickup queue");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      const res = await api.updatePickupStatus(orderId, newStatus, notes);
      if (res.success) {
        toast.success("Pickup updated", `Pickup marked as ${newStatus}.`);
        await fetchPickups();
        setSelectedPickup(null);
        setNotes("");
      } else {
        toast.error("Update failed", res.error?.message || "Failed to update pickup status");
      }
    } catch (e: any) {
      toast.error("Update failed", e.message || "Error processing pickup update");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <OperationsShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Nursery Pickup Queue</h1>
          <p className="text-xs text-ink-400 mt-0.5">Collect prepared plant items from partner nurseries across the city.</p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {/* Pickup Queue Board */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pickups.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-400">No pickups currently waiting in queue.</div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Partner Nursery</th>
                  <th className="p-4">Pickup Location</th>
                  <th className="p-4">Items Qty</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {pickups.map((p) => (
                  <tr key={p.orderId} className="hover:bg-cream-50/50">
                    <td className="p-4 font-mono font-bold text-ink-900">{p.orderId}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <LeafIcon size={14} className="text-forest-700" />
                        <span className="font-bold text-ink-800">{p.sellerName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-ink-600">{p.pickupAddress}</td>
                    <td className="p-4 font-bold text-ink-900">{p.itemsCount} units</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-forest-50 text-forest-700 border border-forest-100">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPickup(p)}
                        className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[10px] uppercase tracking-wider transition-colors"
                      >
                        Update Pickup
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Pickup Action Drawer */}
        {selectedPickup && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">Pickup: {selectedPickup.orderId}</h3>
                  <p className="text-xs text-ink-400 mt-0.5">Nursery: {selectedPickup.sellerName}</p>
                </div>
                <button type="button" onClick={() => setSelectedPickup(null)} className="text-ink-400 hover:text-ink-900 font-bold text-sm">✕</button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  Pickup Notes / Dispatch Remarks
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter pickup verification notes..."
                  className="w-full p-3 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedPickup.orderId, "Picked Up")}
                  className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Mark Items Picked Up
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPickup(null)}
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
