"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { SearchIcon, CloseIcon } from "@/components/ui/Icons";
import { OrderFinancialBreakdown } from "@/components/admin/OrderFinancialBreakdown";
import { useToast } from "@/lib/contexts/ToastContext";
import { TableSkeleton } from "@/components/ui/loading";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";

function formatOrderStatusDisplay(status: string): string {
  if (!status) return "Order Placed";
  const s = status.toLowerCase().replace(/_/g, " ");
  if (s === "seller pending" || s === "seller_pending" || s === "order placed") return "Order Placed";
  if (s === "nursery confirmed") return "Nursery Confirmed";
  if (s === "preparing") return "Preparing";
  if (s === "ready for pickup" || s === "ready_for_pickup") return "Ready for Pickup";
  if (s === "picked up" || s === "picked_up") return "Picked Up";
  if (s === "packing") return "Packing";
  if (s === "out for delivery") return "Out for Delivery";
  if (s === "delivered") return "Delivered";
  if (s === "cancelled") return "Cancelled";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (pageNum = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const res = await api.getAdminOrders({
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        limit: 25,
        page: pageNum,
      });

      if (res.success && res.data) {
        const rows = res.data;
        if (pageNum === 1) {
          setOrders(rows);
        } else {
          setOrders((prev) => {
            const existing = new Set(prev.map((o) => o.id));
            const fresh = rows.filter((o: any) => !existing.has(o.id));
            return [...prev, ...fresh];
          });
        }
        setPage(pageNum);
        setHasMore(rows.length === 25);
      } else {
        if (pageNum === 1) {
          setError(res.error?.message || "Failed to load master orders");
        }
      }
    } catch (e: any) {
      if (pageNum === 1) {
        setError(e.message || "Failed to connect to API");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreOrders = () => {
    if (loading || loadingMore || !hasMore) return;
    fetchOrders(page + 1);
  };

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMoreOrders,
    hasMore,
    isLoading: loading || loadingMore,
  });

  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(1);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      const res = await api.updateAdminOrder(selectedOrder.id, { status: newStatus });
      if (res.success) {
        toast.success("Order status updated", `Order status updated to ${newStatus}.`);
        await fetchOrders();
        setSelectedOrder(null);
      } else {
        toast.error("Update failed", res.error?.message || "Failed to update order status");
      }
    } catch (e: any) {
      toast.error("Update failed", e.message || "Error updating order status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Master Order Dispatch & Oversight</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Platform-wide visibility across nationwide multi-nursery split shipments, tracking, and fulfillment.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-1">
              {orders.length} Master Orders
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <form onSubmit={handleSearchSubmit} className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-96 relative">
            <input
              type="search"
              placeholder="Search by Order ID, Customer Name, or City..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 font-mono text-xs rounded border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] focus:border-[#1B4D3E] bg-[#F8FAFC] placeholder:text-slate-400 font-sans"
            />
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] bg-[#F8FAFC] font-semibold text-slate-700"
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
              className="px-4 py-2 bg-[#1B4D3E] hover:bg-[#14392E] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-xs"
            >
              Search
            </button>
          </div>
        </form>

        {/* Order Cards Grid */}
        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded border border-[#E2E8F0]">
            No master orders found matching the filter criteria.
          </div>
        ) : (
          <>
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
                  className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-400 transition-all"
                >
                  <div className="flex items-start justify-between min-w-0 gap-3">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-[#0F172A] text-xs truncate">#{o.id.slice(0, 14)}...</p>
                      <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-[#1B4D3E] border border-emerald-200 whitespace-nowrap">
                      {formatOrderStatusDisplay(o.status)}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                    <p className="text-slate-700 font-semibold truncate">Customer: {customerName}</p>
                    <p className="text-slate-500">Destination: <span className="font-bold text-slate-700">{city}</span></p>
                    <p className="font-mono text-[11px] text-slate-500">{fulfillmentsCount} Nursery Shipment · {itemsCount} items</p>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                    <span className="font-mono font-bold text-emerald-800 text-sm">{formatINR(totalAmount)}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(o)}
                      className="px-3 py-1 rounded border border-[#E2E8F0] hover:bg-[#1B4D3E] hover:text-white text-[#0F172A] font-mono font-bold text-[10px] uppercase tracking-wider transition-colors shadow-xs"
                    >
                      Inspect Order →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite Scroll Sentinel */}
          <div
            ref={sentinelRef}
            className="py-6 flex items-center justify-center text-ink-400"
          >
            {loadingMore ? (
              <div className="flex items-center gap-2 text-xs font-mono text-forest-700">
                <span className="w-4 h-4 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading more master orders...</span>
              </div>
            ) : hasMore ? (
              <span className="text-[11px] text-ink-400 font-mono">
                Scroll to load older orders
              </span>
            ) : orders.length > 0 ? (
              <span className="text-[11px] text-ink-400 font-mono">
                All master orders loaded ({orders.length} total)
              </span>
            ) : null}
          </div>
          </>
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
                  className="text-ink-400 hover:text-ink-900 transition-colors p-1"
                  aria-label="Close modal"
                >
                  <CloseIcon size={16} />
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
                          Seller: <span className="font-semibold text-ink-700">{item.product?.seller?.business_name || item.seller?.business_name || "Partner Nursery"}</span>
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

              {/* Multi-Nursery Financial Breakdown Panel */}
              <div className="pt-2">
                <OrderFinancialBreakdown orderId={selectedOrder.id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
