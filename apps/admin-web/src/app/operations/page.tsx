"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useToast } from "@/lib/contexts/ToastContext";
import { LogisticsIcon, RefreshIcon, MapPin } from "@/components/ui/Icons";

export default function AdminOperationsPage() {
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDeliveries();
      if (res.success && res.data) {
        setDeliveries(res.data);
      } else {
        setError(res.error?.message || "Failed to load logistics assignments.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to logistics service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Delivery Operations & Dispatch
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Real-time courier assignments, proof-of-delivery (POD) records, and
            urban plant routing
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDeliveries}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-xs font-bold text-ink-700 transition-colors shadow-xs"
        >
          <RefreshIcon size={14} /> Refresh Deliveries
        </button>
      </div>

      <div className="bg-cream-50 border border-cream-300 rounded-2xl shadow-xs overflow-hidden">
        {deliveries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-200/70 border-b border-cream-300 text-ink-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Delivery Ref</th>
                  <th className="py-3.5 px-4">Courier Partner</th>
                  <th className="py-3.5 px-4">Destination Pincode</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {deliveries.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-cream-100/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-ink-900">
                      {d.id.substring(0, 8)}...
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-ink-800">
                      {d.courier_name || d.courier_id || "Unassigned"}
                    </td>
                    <td className="py-3.5 px-4 text-ink-700">
                      {d.destination_pincode || d.pincode || "560001"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          d.status === "delivered"
                            ? "bg-forest-100 text-forest-800 border border-forest-200"
                            : d.status === "out_for_delivery"
                              ? "bg-warning-100 text-warning-800 border border-warning-200"
                              : "bg-cream-200 text-ink-700"
                        }`}
                      >
                        {d.status || "assigned"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-ink-500">
                      {formatDate(d.updated_at || d.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 text-xs text-ink-500">
            No delivery records found in logistics ledger.
          </div>
        )}
      </div>
    </div>
  );
}
