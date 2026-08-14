"use client";

import { useState, useEffect } from "react";
import { OperationsShell } from "@/components/operations/OperationsShell";
import { api } from "@/lib/api";
import { SearchIcon } from "@/components/ui/Icons";

export default function OperationsOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOperationsOrders({
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (res.success && res.data) {
        setOrders(res.data);
      } else {
        setError(res.error?.message || "Failed to load master orders");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      const res = await api.updateOperationsOrderStatus(orderId, newStatus);
      if (res.success) {
        await fetchOrders();
        setSelectedOrder(null);
      } else {
        alert(res.error?.message || "Invalid status transition");
      }
    } catch (e: any) {
      alert(e.message || "Error updating order status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <OperationsShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Master Order Logistics</h1>
          <p className="text-xs text-ink-400 mt-0.5">Track multi-nursery consolidation and advance fulfillment state machine.</p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="w-full sm:w-72 relative">
            <input
              type="search"
              placeholder="Search Order ID or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white w-full sm:w-auto"
          >
            <option value="all">All Operational Statuses</option>
            <option value="ready for pickup">Ready for Pickup</option>
            <option value="picked up">Picked Up</option>
            <option value="packing">Packing</option>
            <option value="out for delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-400">No operational orders matching filter.</div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-cream-50/50">
                    <td className="p-4 font-mono font-bold text-ink-900">{o.id}</td>
                    <td className="p-4 font-semibold text-ink-800">{o.delivery_address_snapshot?.full_name || "Customer"}</td>
                    <td className="p-4 text-ink-600">{o.order_items?.length || 0} items</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-forest-50 text-forest-700 border border-forest-100">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(o)}
                        className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[10px] uppercase tracking-wider transition-colors"
                      >
                        Inspect & Advance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Order Fulfillment Transition Drawer */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">Master Order {selectedOrder.id}</h3>
                  <p className="text-xs text-ink-400 mt-0.5">Current Status: <span className="font-bold text-ink-900 uppercase">{selectedOrder.status}</span></p>
                </div>
                <button type="button" onClick={() => setSelectedOrder(null)} className="text-ink-400 hover:text-ink-900 font-bold text-sm">✕</button>
              </div>

              <div className="bg-cream-50 rounded-xl p-4 text-xs space-y-1">
                <p className="font-bold text-ink-900">Delivery Recipient:</p>
                <p className="text-ink-700">{selectedOrder.delivery_address_snapshot?.full_name}</p>
                <p className="text-ink-500">{selectedOrder.delivery_address_snapshot?.line1}, {selectedOrder.delivery_address_snapshot?.city}</p>
              </div>

              {/* State Machine Transition Actions */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-700">Allowed Operations State Machine Actions</p>
                
                {(selectedOrder.status === "picked up" || selectedOrder.status === "picked_up") && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedOrder.id, "packing")}
                    className="w-full py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Advance to: Packing
                  </button>
                )}

                {selectedOrder.status === "packing" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedOrder.id, "out for delivery")}
                    className="w-full py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Advance to: Out for Delivery
                  </button>
                )}

                {(selectedOrder.status === "out for delivery" || selectedOrder.status === "out_for_delivery") && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedOrder.id, "delivered")}
                    className="w-full py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Advance to: Delivered
                  </button>
                )}

                {selectedOrder.status === "delivered" && (
                  <div className="p-3 bg-success-50 text-success-700 rounded-xl text-center font-bold text-xs uppercase tracking-wider">
                    ✓ Order Fulfillment Completed
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </OperationsShell>
  );
}
