"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSeller } from "@/lib/contexts/SellerContext";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { AlertIcon, OrderIcon, CheckIcon } from "@/components/ui/Icons";

const SELLER_TIMELINE = [
  "Order Placed",
  "Nursery Confirmed",
  "Preparing",
  "Ready for Pickup",
  "Picked Up",
];

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

export default function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const masterOrderId = resolvedParams.id;

  const { isApproved } = useSeller();
  const [orderView, setOrderView] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSellerOrderById(masterOrderId);
      if (res.success && res.data) {
        setOrderView(res.data);
      } else {
        setError(res.error?.message || "Order unavailable");
      }
    } catch (e: any) {
      setError(e.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [masterOrderId]);

  const handleAdvanceStatus = async () => {
    if (!orderView) return;
    const nextStatus = getNextSellerStatus(orderView.status);
    if (!nextStatus) return;

    try {
      setIsUpdating(true);
      const res = await api.updateFulfillmentStatus(masterOrderId, nextStatus);
      if (res.success) {
        await fetchOrder();
      } else {
        alert(res.error?.message || `Failed to advance status to ${nextStatus}`);
      }
    } catch (err: any) {
      alert(err.message || "Error updating fulfillment status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 flex justify-center">
        <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !orderView) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 bg-white rounded-2xl border border-ink-100 p-8 shadow-xs">
        <AlertIcon size={24} className="text-error-600 mx-auto" />
        <h1 className="font-serif text-xl font-bold text-ink-900">Order Unavailable</h1>
        <p className="text-xs text-ink-500">{error || "The requested order was not found or is unavailable for your nursery portal."}</p>
        <Link
          href="/seller/orders"
          className="inline-block px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const nextStatus = getNextSellerStatus(orderView.status);
  const actionLabel = getSellerActionLabel(orderView.status);
  const currentStepIdx = SELLER_TIMELINE.indexOf(orderView.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link href="/seller/orders" className="text-xs font-bold text-forest-700 hover:text-forest-900">
          ← Back to Orders Queue
        </Link>
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusBadgeStyle(orderView.status)}`}>
          {orderView.status}
        </span>
      </div>

      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Master Order {orderView.masterOrderId}</h1>
        <p className="text-xs text-ink-400 mt-0.5">Placed on {orderView.createdAt}</p>
      </div>

      {/* Fulfillment Progress Timeline */}
      <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-700">Nursery Fulfillment Timeline</h2>
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-cream-100 z-0" />
          {SELLER_TIMELINE.map((step, idx) => {
            const isCompleted = currentStepIdx >= idx;
            return (
              <div key={step} className="relative z-10 flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isCompleted ? "bg-forest-700 text-white" : "bg-cream-100 text-ink-400"}`}>
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span className={`text-[10px] font-semibold text-center max-w-[70px] ${isCompleted ? "text-ink-900 font-bold" : "text-ink-400"}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {actionLabel && (
          <div className="pt-4 border-t border-ink-100 flex justify-end">
            <button
              type="button"
              disabled={!isApproved || isUpdating}
              onClick={handleAdvanceStatus}
              className="px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
            >
              {isUpdating ? "Updating..." : actionLabel}
            </button>
          </div>
        )}
      </div>

      {/* Customer & Fulfillment Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-2 text-xs">
          <h2 className="font-bold text-ink-900 uppercase tracking-wider text-[10px]">Customer Fulfillment Details</h2>
          <p className="font-bold text-ink-900 text-sm">{orderView.customer?.name || "Customer"}</p>
          <p className="text-ink-600 font-mono">{orderView.customer?.phone || "N/A"}</p>
          <p className="text-ink-500 leading-relaxed">{orderView.customer?.address || "Raipur, Chhattisgarh"}</p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-2 text-xs">
          <h2 className="font-bold text-ink-900 uppercase tracking-wider text-[10px]">Payment Summary</h2>
          <div className="flex justify-between py-1 border-b border-ink-100">
            <span className="text-ink-500">Payment Method:</span>
            <span className="font-bold text-ink-900">{orderView.paymentMethod || "Online"}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-ink-500">Nursery Line Items Subtotal:</span>
            <span className="font-bold text-forest-800 text-sm">{formatINR(orderView.subtotalPaise)}</span>
          </div>
        </div>
      </div>

      {/* Order Line Items */}
      <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-3">
        <h2 className="font-bold text-xs uppercase tracking-wider text-ink-700">Order Items (Nursery Segment)</h2>
        <div className="space-y-2">
          {(orderView.items || []).map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center bg-cream-50 p-3 rounded-xl text-xs">
              <div>
                <p className="font-bold text-ink-900">{item.product?.name || "Plant Item"}</p>
                <p className="text-[10px] text-ink-500 font-mono">Qty: {item.quantity}</p>
              </div>
              <span className="font-bold text-forest-800">{formatINR((item.pricePaise || 0) * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
