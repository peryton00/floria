"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { useToast } from "@/lib/contexts/ToastContext";
import { OrderListSkeleton } from "@/components/ui/loading";
import {
  OrderIcon,
  ArrowRightIcon,
  RefreshIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
} from "@/components/ui/Icons";

export default function SellerOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSellerOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      } else {
        setError(res.error?.message || "Failed to load seller orders.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to orders service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((ord) => {
    if (filterStatus === "all") return true;
    return ord.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "placed":
      case "order_placed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning-100 text-warning-800 border border-warning-200">
            ⏳ Awaiting Confirmation
          </span>
        );
      case "nursery_confirmed":
      case "confirmed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cream-300 text-ink-800 border border-cream-400">
            📦 Preparing Package
          </span>
        );
      case "ready_for_pickup":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-100 text-forest-800 border border-forest-200">
            🚚 Ready for Courier
          </span>
        );
      case "picked_up":
      case "out_for_delivery":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-200 text-forest-900 border border-forest-300">
            🌿 In Transit
          </span>
        );
      case "delivered":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success-100 text-success-700 border border-success-200">
            ✓ Delivered
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cream-200 text-ink-700">
            {status}
          </span>
        );
    }
  };

  if (loading && orders.length === 0) {
    return <OrderListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Order Fulfillment Queue
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Accept customer orders, package botanical specimens, and schedule
            courier pickups
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-xs font-bold text-ink-700 transition-colors shadow-xs"
        >
          <RefreshIcon size={14} /> Refresh Queue
        </button>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-200 rounded-xl text-xs text-error-700 font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchOrders}
            className="underline uppercase font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl p-4 flex gap-2 overflow-x-auto shadow-xs">
        <button
          type="button"
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            filterStatus === "all"
              ? "bg-forest-800 text-white"
              : "bg-cream-200 text-ink-700 hover:bg-cream-300"
          }`}
        >
          All Orders ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("placed")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            filterStatus === "placed"
              ? "bg-warning-500 text-ink-900"
              : "bg-cream-200 text-ink-700 hover:bg-cream-300"
          }`}
        >
          Awaiting Action
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("ready_for_pickup")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            filterStatus === "ready_for_pickup"
              ? "bg-forest-800 text-white"
              : "bg-cream-200 text-ink-700 hover:bg-cream-300"
          }`}
        >
          Ready for Pickup
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("delivered")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            filterStatus === "delivered"
              ? "bg-success-700 text-white"
              : "bg-cream-200 text-ink-700 hover:bg-cream-300"
          }`}
        >
          Completed
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((ord) => {
            const orderId = ord.order_id || ord.id;
            const shortId = orderId.substring(0, 8);

            return (
              <div
                key={ord.id}
                className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-forest-700/40 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-ink-900 bg-cream-200 px-2 py-0.5 rounded-md">
                      #{shortId}
                    </span>
                    {getStatusBadge(ord.status)}
                    <span className="text-[11px] text-ink-500">
                      {formatDate(ord.created_at)}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-ink-900">
                      Customer: {ord.customer_name || "Floria Customer"}
                    </div>
                    <div className="text-xs text-ink-600">
                      {ord.items?.length || 1} botanical item(s) • Total:{" "}
                      <span className="font-bold text-ink-900">
                        {formatINR(ord.subtotal_paise || ord.total_paise || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <Link
                    href={`/orders/${orderId}`}
                    className="w-full md:w-auto px-4 py-2 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors text-center flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    Fulfill Order <ArrowRightIcon size={14} />
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-cream-50 border border-cream-300 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-cream-200 text-ink-500 flex items-center justify-center mx-auto">
              <OrderIcon size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold text-ink-900">
              No Orders Found
            </h3>
            <p className="text-xs text-ink-500 max-w-sm mx-auto">
              There are no orders matching your current filter. New customer
              orders will arrive here in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
