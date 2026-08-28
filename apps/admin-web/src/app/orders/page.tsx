"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { useToast } from "@/lib/contexts/ToastContext";
import { OrdersIcon, SearchIcon, RefreshIcon } from "@/components/ui/Icons";

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      } else {
        setError(res.error?.message || "Failed to load platform orders.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to order service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    const id = (o.id || "").toLowerCase();
    const cust = (o.customer_name || o.customer_email || "").toLowerCase();
    return (
      id.includes(searchTerm.toLowerCase()) ||
      cust.includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Order Oversight & Fulfillment
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Global view of customer orders, nursery fulfillment states, and
            courier logistics progression
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-xs font-bold text-ink-700 transition-colors shadow-xs"
        >
          <RefreshIcon size={14} /> Refresh Orders
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <SearchIcon
            size={16}
            className="absolute left-3 top-2.5 text-ink-400"
          />
          <input
            type="text"
            placeholder="Search Order ID or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
          />
        </div>

        <div className="text-xs font-bold text-ink-500">
          Total Orders: {orders.length}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-200/70 border-b border-cream-300 text-ink-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-cream-100/60 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-ink-900">
                        {o.id.substring(0, 8)}...
                      </div>
                      <div className="text-[10px] text-ink-500">
                        {formatDate(o.created_at)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-ink-900">
                        {o.customer_name || o.customer_email || "Customer"}
                      </div>
                      <div className="text-[11px] text-ink-500">
                        {o.shipping_city || "Delivery"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-ink-900">
                      {formatINR(o.total_amount_paise || o.totalPaise || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          o.payment_status === "PAID" ||
                          o.payment_status === "paid"
                            ? "bg-forest-100 text-forest-800 border border-forest-200"
                            : "bg-warning-100 text-warning-700 border border-warning-200"
                        }`}
                      >
                        {o.payment_status || "PENDING"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cream-200 text-ink-800 border border-cream-300">
                        {o.fulfillment_status || o.status || "placed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 text-xs text-ink-500">
            No orders found matching query.
          </div>
        )}
      </div>
    </div>
  );
}
