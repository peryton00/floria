"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSeller } from "@/lib/contexts/SellerContext";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { OrderIcon, SearchIcon, AlertIcon, LeafIcon } from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case "Order Placed":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Nursery Confirmed":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "Preparing":
      return "bg-warning-50 text-warning-700 border-warning-200";
    case "Ready for Pickup":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Picked Up":
    case "Delivered":
      return "bg-success-50 text-success-700 border-success-200";
    case "Cancelled":
      return "bg-error-50 text-error-700 border-error-200";
    default:
      return "bg-ink-100 text-ink-600 border-ink-200";
  }
}

function getNextSellerStatus(currentStatus: string): string | null {
  switch (currentStatus) {
    case "Order Placed":
      return "Nursery Confirmed";
    case "Nursery Confirmed":
      return "Preparing";
    case "Preparing":
      return "Ready for Pickup";
    case "Ready for Pickup":
      return "Picked Up";
    default:
      return null;
  }
}

function getSellerActionLabel(currentStatus: string): string | null {
  switch (currentStatus) {
    case "Order Placed":
      return "Confirm Order";
    case "Nursery Confirmed":
      return "Start Preparing";
    case "Preparing":
      return "Mark Ready for Pickup";
    case "Ready for Pickup":
      return "Mark Picked Up";
    default:
      return null;
  }
}

function OrdersContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isApproved } = useSeller();

  const statusParam = searchParams.get("status") || "all";
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSellerOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      } else {
        setError(res.error?.message || "Failed to load seller orders");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTabChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus === "all") params.delete("status");
    else params.set("status", newStatus);
    router.push(`/seller/orders?${params.toString()}`);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusParam !== "all" && o.status.toLowerCase() !== statusParam.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = o.masterOrderId?.toLowerCase().includes(q);
        const matchesCustomer = o.customer?.name?.toLowerCase().includes(q);
        const matchesProduct = o.items?.some((item: any) =>
          item.product?.name?.toLowerCase().includes(q)
        );
        if (!matchesId && !matchesCustomer && !matchesProduct) return false;
      }
      return true;
    });
  }, [orders, statusParam, searchQuery]);

  const handleAdvanceStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = getNextSellerStatus(currentStatus);
    if (!nextStatus) return;

    try {
      setUpdatingId(orderId);
      const res = await api.updateFulfillmentStatus(orderId, nextStatus);
      if (res.success) {
        toast.success("Order status updated", `Order marked as ${nextStatus}.`);
        await fetchOrders();
      } else {
        toast.error("Status update failed", res.error?.message || `Failed to update status to ${nextStatus}`);
      }
    } catch (err: any) {
      toast.error("Status update failed", err.message || "Error updating status");
    } finally {
      setUpdatingId(null);
    }
  };

  const tabs = [
    { key: "all", label: "All Orders", count: orders.length },
    { key: "Order Placed", label: "New", count: orders.filter((o) => o.status === "Order Placed").length },
    { key: "Nursery Confirmed", label: "Confirmed", count: orders.filter((o) => o.status === "Nursery Confirmed").length },
    { key: "Preparing", label: "Preparing", count: orders.filter((o) => o.status === "Preparing").length },
    { key: "Ready for Pickup", label: "Ready", count: orders.filter((o) => o.status === "Ready for Pickup").length },
    { key: "Picked Up", label: "Completed", count: orders.filter((o) => o.status === "Picked Up" || o.status === "Delivered").length },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Order Fulfillment Queue</h1>
        <p className="text-xs text-ink-400 mt-0.5">Manage customer plant orders assigned to your nursery.</p>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700 flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={fetchOrders} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-ink-100 space-x-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            className={[
              "pb-3 px-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5",
              statusParam === t.key || (statusParam === "all" && t.key === "all")
                ? "border-forest-700 text-forest-700"
                : "border-transparent text-ink-400 hover:text-ink-900",
            ].join(" ")}
          >
            <span>{t.label}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-cream-100 text-ink-600 font-mono">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs flex items-center">
        <div className="w-full relative">
          <input
            type="search"
            placeholder="Search Order ID, Customer Name, Plant Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-100 p-12 text-center text-xs text-ink-400">
          No customer orders found in this category.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const nextStatus = getNextSellerStatus(order.status);
            const actionLabel = getSellerActionLabel(order.status);
            const isUpdating = updatingId === order.masterOrderId;

            return (
              <div key={order.masterOrderId} className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-4">
                {(() => {
                  const netOrderTotal = (order.items || []).reduce(
                    (sum: number, it: any) => sum + (it.seller_net_paise ?? it.pricePaise ?? 0) * it.quantity,
                    0
                  ) || order.seller_payout_paise || order.subtotalPaise;

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-ink-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-ink-900 text-sm">{order.masterOrderId}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusBadgeStyle(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-400 mt-0.5">
                            Placed by <strong className="text-ink-800">{order.customer?.name || "Customer"}</strong> on {order.createdAt}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="font-serif font-bold text-sm text-forest-800">{formatINR(netOrderTotal)}</p>
                          <p className="text-[10px] text-amber-700 font-semibold">Net Payout</p>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2">
                        {(order.items || []).map((item: any, i: number) => {
                          const itemNetPrice = item.seller_net_paise ?? item.pricePaise ?? 0;
                          return (
                            <div key={i} className="flex justify-between items-center bg-cream-50 p-3 rounded-xl text-xs">
                              <div>
                                <p className="font-bold text-ink-900">{item.product?.name || "Plant Product"}</p>
                                <p className="text-[10px] text-ink-500 font-mono">
                                  Qty: {item.quantity} · {formatINR(itemNetPrice)}/unit net
                                </p>
                              </div>
                              <span className="font-bold text-forest-800">{formatINR(itemNetPrice * item.quantity)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}

                {/* Seller Action Control */}
                {actionLabel && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={!isApproved || isUpdating}
                      onClick={() => handleAdvanceStatus(order.masterOrderId, order.status)}
                      className="px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-forest-700"
                    >
                      {isUpdating ? "Updating..." : actionLabel}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SellerOrdersPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-ink-400">Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
