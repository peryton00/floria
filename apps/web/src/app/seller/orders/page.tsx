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
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Order Fulfillment Queue</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Manage and advance customer plant orders assigned to your nursery.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-1">
            {orders.length} Nursery Orders
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-xs font-semibold text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={fetchOrders} className="font-bold underline text-red-900">Retry</button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-96 relative">
          <input
            type="search"
            placeholder="Search by Order ID, Customer, Plant Variety..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 font-mono text-xs rounded border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] focus:border-[#1B4D3E] bg-[#F8FAFC] placeholder:text-slate-400 font-sans"
          />
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] p-1 shadow-xs overflow-x-auto max-w-full">
          {tabs.map((t) => {
            const isActive = statusParam === t.key || (statusParam === "all" && t.key === "all");
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleTabChange(t.key)}
                className={[
                  "px-3 py-1 rounded text-[11px] font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5",
                  isActive
                    ? "bg-[#1B4D3E] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-200/60",
                ].join(" ")}
              >
                <span>{t.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-[#1B4D3E] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded border border-[#E2E8F0] p-12 text-center text-xs font-semibold text-slate-500 shadow-xs">
          No customer orders found in this fulfillment status.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const nextStatus = getNextSellerStatus(order.status);
            const actionLabel = getSellerActionLabel(order.status);
            const isUpdating = updatingId === order.masterOrderId;

            const netOrderTotal = (order.items || []).reduce(
              (sum: number, it: any) => sum + (it.seller_net_paise ?? it.pricePaise ?? 0) * it.quantity,
              0
            ) || order.seller_payout_paise || order.subtotalPaise;

            return (
              <div key={order.masterOrderId} className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs space-y-4 hover:border-slate-400 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#E2E8F0] pb-3.5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-[#0F172A] text-sm">#{order.masterOrderId?.slice(0, 10)}</span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${getStatusBadgeStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Ordered by <strong className="text-slate-800">{order.customer?.name || "Customer"}</strong> · {order.createdAt}
                    </p>
                  </div>

                  <div className="text-left sm:text-right bg-[#F8FAFC] px-3 py-1.5 rounded border border-[#E2E8F0] self-start sm:self-auto">
                    <p className="font-mono font-bold text-sm text-[#1B4D3E]">{formatINR(netOrderTotal)}</p>
                    <p className="font-mono text-[9px] text-amber-800 font-bold uppercase tracking-wider">Net Payout</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {(order.items || []).map((item: any, i: number) => {
                    const itemNetPrice = item.seller_net_paise ?? item.pricePaise ?? 0;
                    return (
                      <div key={i} className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0] text-xs">
                        <div>
                          <p className="font-bold text-[#0F172A]">{item.product?.name || "Plant Variety"}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Qty: {item.quantity} · {formatINR(itemNetPrice)}/unit net
                          </p>
                        </div>
                        <span className="font-mono font-bold text-[#1B4D3E] text-xs">{formatINR(itemNetPrice * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Seller Action Control */}
                {actionLabel && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={!isApproved || isUpdating}
                      onClick={() => handleAdvanceStatus(order.masterOrderId, order.status)}
                      style={{ color: "#ffffff" }}
                      className="px-4 py-2 rounded bg-[#1B4D3E] hover:bg-[#153e31] !text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs disabled:opacity-40"
                    >
                      {isUpdating ? "Advancing Status..." : actionLabel}
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
    <Suspense fallback={<div className="py-12 text-center text-xs text-slate-400">Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}

