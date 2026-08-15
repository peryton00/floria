"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { SearchIcon } from "@/components/ui/Icons";

export default function AdminOrdersPage() {
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
      const res = await api.getAdminOrders({
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      const res = await api.updateAdminOrder(selectedOrder.id, { status: newStatus });
      if (res.success) {
        alert("Order status overridden successfully.");
        await fetchOrders();
        setSelectedOrder(null);
      } else {
        alert(res.error?.message || "Failed to update order status");
      }
    } catch (e: any) {
      alert(e.message || "Error updating order status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Master Order Oversight</h1>
            <p className="text-xs text-ink-400 mt-0.5">Platform-wide visibility across multi-nursery customer orders and fulfillment states.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Master Orders:</span>
            <span className="px-3 py-1 rounded-full bg-forest-50 text-forest-700 font-bold text-xs border border-forest-100">
              {orders.length} Total
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <form onSubmit={handleSearchSubmit} className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-80 relative">
            <input
              type="search"
              placeholder="Search by Order ID or Customer Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
            >
              <option value="all">All Fulfillment Statuses</option>
              <option value="seller_pending">Seller Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready for pickup">Ready for Pickup</option>
              <option value="picked up">Picked Up</option>
              <option value="packing">Packing</option>
              <option value="out for delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Order Cards Grid */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-400">No master orders found matching the filter criteria.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((o) => {
              const itemsCount = o.order_items?.length || 0;
              const fulfillmentsCount = o.seller_order_fulfillments?.length || 1;
              const customerName = o.delivery_address_snapshot?.full_name || "Customer";
              const city = o.delivery_address_snapshot?.city || "Raipur";
              const totalAmount = o.total_paise || o.subtotal_paise || 0;

              return (
                <div
                  key={o.id}
                  className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-ink-200 transition-colors"
                >
                  <div className="flex items-start justify-between min-w-0 gap-3">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-ink-950 truncate">#{o.id.slice(0, 12)}...</p>
                      <p className="text-[10px] text-ink-400 mt-0.5">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-forest-50 text-forest-700 border border-forest-100">
                      {o.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-ink-600 font-semibold truncate">Customer: {customerName}</p>
                    <p className="text-ink-500">Destination: {city}</p>
                    <p className="text-ink-400 text-[11px]">{fulfillmentsCount} Nursery ({itemsCount} items)</p>
                  </div>

                  <div className="pt-2 border-t border-ink-50 flex justify-between items-center">
                    <span className="font-bold text-forest-800 text-sm">{formatINR(totalAmount)}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(o)}
                      className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[9px] uppercase tracking-wider transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Master Order Detail View & Edit Status */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-ink-100 pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">Master Order Details</h3>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">{selectedOrder.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Delivery & Payment Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-cream-50 rounded-xl p-4 text-xs">
                <div>
                  <p className="font-bold uppercase tracking-wider text-ink-500 mb-1">Customer Delivery Address</p>
                  <p className="font-bold text-ink-900">{selectedOrder.delivery_address_snapshot?.full_name}</p>
                  <p className="text-ink-600">{selectedOrder.delivery_address_snapshot?.line1}</p>
                  <p className="text-ink-600">
                    {selectedOrder.delivery_address_snapshot?.city}, {selectedOrder.delivery_address_snapshot?.state} - {selectedOrder.delivery_address_snapshot?.pincode}
                  </p>
                  <p className="font-mono text-ink-500 mt-1">{selectedOrder.delivery_address_snapshot?.phone}</p>
                </div>

                <div>
                  <p className="font-bold uppercase tracking-wider text-ink-500 mb-1">Payment & Financial Summary</p>
                  <p className="flex justify-between py-0.5"><span className="text-ink-500">Method:</span> <span className="font-bold uppercase">{selectedOrder.notes || "Online"}</span></p>
                  <p className="flex justify-between py-0.5"><span className="text-ink-500">Subtotal:</span> <span className="font-bold">{formatINR(selectedOrder.subtotal_paise || 0)}</span></p>
                  <p className="flex justify-between py-0.5 border-t border-ink-200 pt-1 mt-1 font-bold text-ink-900">
                    <span>Order Total:</span> <span>{formatINR(selectedOrder.total_paise || selectedOrder.subtotal_paise || 0)}</span>
                  </p>
                </div>
              </div>

              {/* Order Status Override Control */}
              <div className="border border-ink-150 rounded-xl p-4 space-y-3 bg-white">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700">Fulfillment Status Control</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-ink-500">Override master status:</span>
                  <select
                    disabled={actionLoading}
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                  >
                    <option value="order placed">Order Placed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready for pickup">Ready for Pickup</option>
                    <option value="picked up">Picked Up</option>
                    <option value="packing">Packing</option>
                    <option value="out for delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Multi-Nursery Order Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700">Multi-Nursery Fulfillment Items</h4>
                <div className="space-y-2">
                  {(selectedOrder.order_items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 border border-ink-100 rounded-xl text-xs bg-white">
                      <div>
                        <p className="font-bold text-ink-900">{item.product_name_snapshot || item.product?.name || "Plant Product"}</p>
                        <p className="text-[10px] text-ink-400">
                          Seller: <span className="font-semibold text-ink-700">{item.seller?.business_name || "Partner Nursery"}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-forest-800">{formatINR(item.line_total_paise || 0)}</p>
                        <p className="text-[10px] text-ink-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
