"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { useToast } from "@/lib/contexts/ToastContext";
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  AlertIcon,
} from "@/components/ui/Icons";

export default function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSellerOrderById(id);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setError(res.error?.message || "Failed to load order details.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to order service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleStatusTransition = async (nextStatus: string, label: string) => {
    if (!order) return;
    try {
      setUpdating(true);
      const res = await api.updateFulfillmentStatus(
        order.order_id || order.id,
        nextStatus,
      );
      if (res.success) {
        toast.success("Status Updated", `Order status set to '${label}'.`);
        await fetchOrderDetail();
      } else {
        toast.error(
          "Transition Failed",
          res.error?.message || "Failed to update fulfillment status.",
        );
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Could not update status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-error-50 text-error-600 flex items-center justify-center mx-auto border border-error-100">
          <AlertIcon size={24} />
        </div>
        <h1 className="font-serif text-xl font-bold text-ink-900">
          Order Not Found
        </h1>
        <p className="text-xs text-ink-500">
          {error || "Could not locate the requested order."}
        </p>
        <Link
          href="/orders"
          className="inline-block px-5 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
        >
          Back to Queue
        </Link>
      </div>
    );
  }

  const orderId = order.order_id || order.id;
  const status = order.status;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/orders"
          className="p-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-ink-700 transition-colors"
        >
          <ArrowLeftIcon size={18} />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900">
            Fulfill Order #{typeof orderId === "string" ? orderId.substring(0, 8) : String(orderId || "Details")}
          </h1>
          <p className="text-xs text-ink-500">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>
      </div>

      {/* Fulfillment Status Banner & Action Buttons */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-ink-500">
            Current Fulfillment State
          </div>
          <div className="text-lg font-serif font-bold text-forest-900 mt-0.5">
            {status === "placed" || status === "order_placed"
              ? "1. Awaiting Nursery Confirmation"
              : ""}
            {status === "nursery_confirmed" || status === "confirmed"
              ? "2. Preparing Plants in Nursery"
              : ""}
            {status === "ready_for_pickup"
              ? "3. Packaged & Ready for Courier"
              : ""}
            {status === "picked_up" || status === "out_for_delivery"
              ? "4. Handed to Courier (In Transit)"
              : ""}
            {status === "delivered" ? "5. Completed & Delivered" : ""}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {(status === "placed" || status === "order_placed") && (
            <button
              type="button"
              disabled={updating}
              onClick={() =>
                handleStatusTransition("nursery_confirmed", "Nursery Confirmed")
              }
              className="w-full md:w-auto px-5 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              {updating ? "Confirming..." : "✓ Confirm & Accept Order"}
            </button>
          )}

          {(status === "nursery_confirmed" || status === "confirmed") && (
            <button
              type="button"
              disabled={updating}
              onClick={() =>
                handleStatusTransition("ready_for_pickup", "Ready for Pickup")
              }
              className="w-full md:w-auto px-5 py-2.5 bg-terracotta-700 hover:bg-terracotta-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              {updating ? "Updating..." : "📦 Mark Ready for Courier Pickup"}
            </button>
          )}

          {status === "ready_for_pickup" && (
            <div className="px-4 py-2 bg-cream-200 text-forest-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <ClockIcon size={16} /> Awaiting Floria Courier Arrival
            </div>
          )}

          {status === "delivered" && (
            <div className="px-4 py-2 bg-success-100 text-success-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircleIcon size={16} /> Successfully Delivered
            </div>
          )}
        </div>
      </div>

      {/* Order Items Table */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-base font-bold text-ink-900 border-b border-cream-300 pb-2">
          Ordered Plant Items
        </h2>

        <div className="divide-y divide-cream-300">
          {(order.items || []).map((item: any, idx: number) => (
            <div
              key={idx}
              className="py-3 flex items-center justify-between gap-4"
            >
              <div>
                <div className="font-bold text-ink-900 text-sm">
                  {item.product_name || item.name || "Botanical Plant"}
                </div>
                <div className="text-xs text-ink-500">
                  Qty: {item.quantity} ×{" "}
                  {formatINR(item.unit_price_paise || item.price_paise || 0)}
                </div>
              </div>
              <div className="font-bold text-ink-900 text-sm">
                {formatINR(
                  (item.unit_price_paise || item.price_paise || 0) *
                    (item.quantity || 1),
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-cream-300 flex justify-between items-center text-sm font-bold text-ink-900">
          <span>Subtotal</span>
          <span>
            {formatINR(order.subtotal_paise || order.total_paise || 0)}
          </span>
        </div>
      </div>

      {/* Delivery Destination Address */}
      {order.delivery_address && (
        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-xs space-y-2">
          <h2 className="font-serif text-base font-bold text-ink-900 border-b border-cream-300 pb-2">
            Delivery Destination
          </h2>
          <div className="text-xs text-ink-700 space-y-1">
            <div className="font-bold">
              {order.delivery_address.full_name || order.customer_name}
            </div>
            <div>{order.delivery_address.line1}</div>
            {order.delivery_address.line2 && (
              <div>{order.delivery_address.line2}</div>
            )}
            <div>
              {order.delivery_address.city}, {order.delivery_address.state} —{" "}
              {order.delivery_address.pincode}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
