"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSeller } from "@/lib/contexts/SellerContext";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { AlertIcon, OrderIcon, CheckIcon } from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";

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

function formatCustomerAddress(addr: any): string {
  if (!addr) return "Raipur, Chhattisgarh";
  if (typeof addr === "string") return addr;
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Raipur, Chhattisgarh";
}

export default function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { toast } = useToast();
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
        toast.success("Order status updated", `Order marked as ${nextStatus}.`);
        await fetchOrder();
      } else {
        toast.error("Status update failed", res.error?.message || `Failed to advance status to ${nextStatus}`);
      }
    } catch (err: any) {
      toast.error("Status update failed", err.message || "Error updating fulfillment status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !orderView) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12">
        <div className="bg-error-50 border border-error-100 rounded-2xl p-6 text-center text-xs text-error-700 space-y-3">
          <AlertIcon size={28} className="mx-auto text-error-500" />
          <p className="font-bold">{error || "Order not found"}</p>
          <p className="text-[11px] text-error-600">The order ID #{masterOrderId} could not be retrieved.</p>
          <Link
            href="/seller/orders"
            className="inline-block px-4 py-2 rounded-xl bg-forest-700 text-white font-bold text-xs uppercase tracking-wider"
          >
            Return to Order Queue
          </Link>
        </div>
      </div>
    );
  }

  const nextStatus = getNextSellerStatus(orderView.status);
  const actionLabel = getSellerActionLabel(orderView.status);
  const currentStepIdx = SELLER_TIMELINE.indexOf(orderView.status);

  return (
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Header & Back Nav */}
      <div className="bg-white p-5 rounded border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <Link href="/seller/orders" className="text-xs text-[#1B4D3E] font-bold hover:underline mb-1.5 inline-flex items-center gap-1">
            ← Back to Orders Queue
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">
              Master Order #{orderView.masterOrderId?.slice(0, 10)}
            </h1>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${getStatusBadgeStyle(orderView.status)}`}>
              {orderView.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Placed on {orderView.createdAt}</p>
        </div>

        {actionLabel && (
          <div>
            <button
              type="button"
              disabled={!isApproved || isUpdating}
              onClick={handleAdvanceStatus}
              style={{ color: "#ffffff" }}
              className="px-4 py-2 rounded bg-[#1B4D3E] hover:bg-[#153e31] !text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs disabled:opacity-40"
            >
              {isUpdating ? "Updating..." : actionLabel}
            </button>
          </div>
        )}
      </div>

      {/* Fulfillment Progress Timeline */}
      <div className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs space-y-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Nursery Fulfillment Timeline</p>
        <div className="flex justify-between items-center relative px-2">
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-[#F1F5F9] z-0" />
          {SELLER_TIMELINE.map((step, idx) => {
            const isCompleted = currentStepIdx >= idx;
            return (
              <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-mono font-bold transition-all shadow-xs ${isCompleted ? "bg-[#1B4D3E] text-white" : "bg-[#F8FAFC] text-slate-400 border border-[#E2E8F0]"}`}>
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span className={`text-[10px] sm:text-xs font-semibold text-center max-w-[80px] leading-tight ${isCompleted ? "text-[#0F172A] font-bold" : "text-slate-400"}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer & Fulfillment Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs space-y-2.5 text-xs">
          <p className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[10px]">Customer Fulfillment Details</p>
          <p className="font-bold text-[#0F172A] text-sm">{orderView.customer?.name || "Customer"}</p>
          <p className="text-slate-600 font-mono text-xs">{orderView.customer?.phone || "N/A"}</p>
          <p className="text-slate-500 leading-relaxed bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0] mt-1">{orderView.customer?.address || "Raipur, Chhattisgarh"}</p>
        </div>

        <div className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs space-y-2.5 text-xs">
          <p className="font-mono font-bold text-slate-500 uppercase tracking-wider text-[10px]">Financial Summary</p>
          <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
            <span className="text-slate-500 font-medium">Payment Method</span>
            <span className="font-mono font-bold text-[#0F172A] uppercase text-[11px]">{orderView.paymentMethod || "Online"}</span>
          </div>
          <div className="flex justify-between py-2 items-center">
            <span className="text-slate-600 font-semibold">Nursery Segment Payout</span>
            <span className="font-mono font-bold text-[#1B4D3E] text-base">{formatINR(orderView.subtotalPaise)}</span>
          </div>
        </div>
      </div>

      {/* Order Line Items */}
      <div className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs space-y-4">
        <h2 className="font-sans font-bold text-sm text-[#0F172A]">Assigned Order Line Items</h2>
        <div className="space-y-2">
          {(orderView.items || []).map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center bg-[#F8FAFC] p-3.5 rounded border border-[#E2E8F0] text-xs">
              <div>
                <p className="font-bold text-[#0F172A]">{item.product?.name || "Plant Variety"}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Quantity: {item.quantity}</p>
              </div>
              <span className="font-mono font-bold text-[#1B4D3E] text-sm">{formatINR((item.pricePaise || 0) * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

