"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { CustomerShell } from "@/components/layout/CustomerShell";
import {
  useOrders,
  OrderStatus,
  ORDER_STATUS_TIMELINE,
} from "@/lib/contexts/OrderContext";
import { formatINR } from "@/lib/format";
import {
  LeafIcon,
  ShieldIcon,
  CheckCircleIcon,
  BagIcon,
  TruckIcon,
} from "@/components/ui/Icons";

interface Props {
  params: Promise<{ id: string }>;
}

function getStatusBadgeStyle(status: OrderStatus) {
  switch (status) {
    case "Payment Pending":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "Order Placed":
    case "Nursery Confirmed":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Preparing":
    case "Ready for Pickup":
    case "Picked Up":
    case "Packing":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "Out for Delivery":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Delivered":
      return "bg-forest-50 text-forest-700 border-forest-200";
    case "Cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-ink-50 text-ink-700 border-ink-200";
  }
}

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type {
  OrderRecord,
  OrderNurseryGroup,
} from "@/lib/contexts/OrderContext";

function mapApiOrderToRecord(o: any): OrderRecord {
  const addr = o.delivery_address_snapshot || {};
  const fulfillments: any[] = o.seller_order_fulfillments || [];
  const groupsMap = new Map<string, OrderNurseryGroup>();

  (o.order_items || []).forEach((item: any) => {
    const sellerId =
      item.seller_id ||
      item.seller_id_snapshot ||
      item.product?.seller_id ||
      item.seller?.id ||
      o.seller_id ||
      "seller_default";
    const sellerName =
      item.seller?.business_name ||
      item.product?.seller?.business_name ||
      "Nursery";

    const fulfillment = fulfillments.find(
      (f: any) => f.seller_id === sellerId || fulfillments.length === 1,
    );
    const rawStatus = fulfillment?.status || o.status || "Order Placed";
    const st = (rawStatus || "").toLowerCase().replace(/_/g, " ");

    let displayStatus: OrderStatus = "Order Placed";
    if (st.includes("ready") || st.includes("pickup") || st.includes("dispatch")) {
      displayStatus = "Ready for Pickup";
    } else if (st.includes("preparing") || st.includes("processing")) {
      displayStatus = "Preparing";
    } else if (st.includes("nursery confirmed") || st.includes("confirmed")) {
      displayStatus = "Nursery Confirmed";
    } else if (st.includes("picked up") || st.includes("picked")) {
      displayStatus = "Picked Up";
    } else if (st.includes("packing")) {
      displayStatus = "Packing";
    } else if (st.includes("delivery") || st.includes("out for delivery")) {
      displayStatus = "Out for Delivery";
    } else if (st.includes("delivered") || st.includes("completed")) {
      displayStatus = "Delivered";
    } else if (st.includes("cancelled")) {
      displayStatus = "Cancelled";
    }

    if (!groupsMap.has(sellerId)) {
      groupsMap.set(sellerId, {
        sellerId,
        sellerName,
        status: displayStatus,
        items: [],
      });
    }

    groupsMap.get(sellerId)!.items.push({
      product: {
        id: item.product_id,
        name: item.product_name_snapshot || item.product?.name || "Plant",
        slug: item.product?.slug || "plant",
      },
      quantity: item.quantity,
      pricePaise: item.unit_price_paise_snapshot || item.price_paise || 0,
      categoryName: null,
    });
  });

  const STATUS_RANKS: Record<string, number> = {
    "Order Placed": 0,
    "Nursery Confirmed": 1,
    "Preparing": 2,
    "Ready for Pickup": 3,
    "Picked Up": 4,
    "Packing": 5,
    "Out for Delivery": 6,
    "Delivered": 7,
  };

  let masterDisplayStatus: OrderStatus = "Order Placed";
  const mst = (o.status || "").toLowerCase().replace(/_/g, " ");

  if (mst.includes("pending payment") || o.status === "pending_payment") {
    masterDisplayStatus = "Payment Pending";
  } else if (mst.includes("cancelled")) {
    masterDisplayStatus = "Cancelled";
  } else if (mst.includes("delivered") || mst.includes("completed")) {
    masterDisplayStatus = "Delivered";
  } else if (mst.includes("delivery") || mst.includes("out for delivery")) {
    masterDisplayStatus = "Out for Delivery";
  } else if (mst.includes("packing")) {
    masterDisplayStatus = "Packing";
  } else {
    // If sellers updated fulfillment status, calculate active aggregate status
    const groupStatuses = Array.from(groupsMap.values()).map((g) => g.status);
    if (groupStatuses.length > 0) {
      let minRank = 999;
      let matchedStatus: OrderStatus = "Order Placed";
      for (const gs of groupStatuses) {
        const rank = STATUS_RANKS[gs] ?? 0;
        if (rank < minRank) {
          minRank = rank;
          matchedStatus = gs;
        }
      }
      if (minRank > 0 && minRank < 999) {
        masterDisplayStatus = matchedStatus;
      }
    }

    if (mst.includes("ready") || mst.includes("pickup")) {
      masterDisplayStatus = "Ready for Pickup";
    } else if (mst.includes("preparing") && (STATUS_RANKS[masterDisplayStatus] ?? 0) < 2) {
      masterDisplayStatus = "Preparing";
    } else if ((mst.includes("nursery confirmed") || mst.includes("confirmed")) && (STATUS_RANKS[masterDisplayStatus] ?? 0) < 1) {
      masterDisplayStatus = "Nursery Confirmed";
    } else if (mst.includes("picked up") && (STATUS_RANKS[masterDisplayStatus] ?? 0) < 4) {
      masterDisplayStatus = "Picked Up";
    }
  }

  return {
    id: o.id,
    createdAt: new Date(o.created_at || Date.now()).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
    ),
    createdAtTimestamp: new Date(o.created_at || Date.now()).getTime(),
    status: masterDisplayStatus,
    address: {
      full_name: addr.full_name || "Customer",
      phone: addr.phone || "",
      line1: addr.line1 || "",
      line2: addr.line2 || undefined,
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      instructions: addr.instructions || undefined,
    },
    paymentMethod: o.notes?.includes("COD")
      ? "Cash on Delivery"
      : "Online Payment",
    nurseryGroups: Array.from(groupsMap.values()),
    subtotalPaise: o.subtotal_paise || 0,
    // Immutable snapshot: use DB value as-is. 0 is valid (free delivery).
    deliveryFeePaise:
      typeof o.delivery_fee_paise === "number" ? o.delivery_fee_paise : 0,
    maintenanceFeePaise:
      typeof o.maintenance_fee_paise === "number" ? o.maintenance_fee_paise : 0,
    totalPaise:
      typeof o.total_paise === "number" ? o.total_paise : o.subtotal_paise || 0,
    discountPaise: 0,
    totalItemsCount: (o.order_items || []).reduce(
      (s: number, i: any) => s + (i.quantity || 1),
      0,
    ),
  };
}

export default function OrderDetailPage({ params }: Props) {
  const { id } = use(params);
  const { getOrderById, refreshOrders } = useOrders();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    async function resolveOrder() {
      // 1. Fetch directly from backend API for server-authoritative financial breakdown
      try {
        setLoading(true);
        const res = await api.getOrderById(id);
        if (res.success && res.data) {
          const mapped = mapApiOrderToRecord(res.data);
          if (active) {
            setOrder(mapped);
            setLoading(false);
          }
          return;
        }
      } catch (e) {
        console.warn(
          "[OrderDetailPage] Failed to fetch order from backend API:",
          e,
        );
      }

      // 2. Fallback to in-memory context state if offline
      const local = getOrderById(id);
      if (local && active) {
        setOrder(local);
      }
      if (active) setLoading(false);
    }

    resolveOrder();

    return () => {
      active = false;
    };
  }, [id, getOrderById, refreshOrders]);

  if (loading) {
    return (
      <CustomerShell>
        <div className="py-16 text-center text-xs font-semibold text-ink-400">
          Loading order details...
        </div>
      </CustomerShell>
    );
  }

  if (!order) {
    return (
      <CustomerShell>
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-ink-400 mb-6"
        >
          <Link href="/" className="hover:text-forest-700 transition-colors">
            Home
          </Link>
          <span aria-hidden="true" className="select-none text-ink-300">
            /
          </span>
          <Link
            href="/orders"
            className="hover:text-forest-700 transition-colors"
          >
            Orders
          </Link>
          <span aria-hidden="true" className="select-none text-ink-300">
            /
          </span>
          <span className="text-ink-700 font-medium">Order Not Found</span>
        </nav>

        <div className="text-center py-16 bg-white rounded-2xl border border-ink-100 shadow-sm max-w-md mx-auto p-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4 text-amber-600 font-bold text-xl">
            ?
          </div>
          <h1 className="text-lg font-bold text-ink-900 mb-1">
            Order Not Found
          </h1>
          <p className="text-sm text-ink-500 mb-6">
            We couldn&apos;t find an order matching ID{" "}
            <span className="font-mono font-bold">#{id}</span>.
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center px-6 py-3 bg-forest-800 hover:bg-forest-900 !text-white font-semibold text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-forest-800 shadow-sm"
            style={{ color: "#ffffff" }}
          >
            Back to Orders
          </Link>
        </div>
      </CustomerShell>
    );
  }

  // Calculate current status index in timeline
  const isCancelled = order.status === "Cancelled";
  const currentTimelineIndex = ORDER_STATUS_TIMELINE.indexOf(order.status);

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-ink-400 mb-6"
      >
        <Link href="/" className="hover:text-forest-700 transition-colors">
          Home
        </Link>
        <span aria-hidden="true" className="select-none text-ink-300">
          /
        </span>
        <Link
          href="/orders"
          className="hover:text-forest-700 transition-colors"
        >
          Orders
        </Link>
        <span aria-hidden="true" className="select-none text-ink-300">
          /
        </span>
        <span className="text-ink-700 font-medium truncate">#{order.id}</span>
      </nav>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
          Order Details & Tracking
        </h1>
        <p className="text-xs text-ink-400 mt-1">
          Placed on{" "}
          <span className="font-semibold text-ink-700">{order.createdAt}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* ── LEFT COLUMN: TIMELINE & NURSERY ITEMS ─────────────────────────── */}
        <div className="space-y-8">
          {/* VISUAL TRACKING TIMELINE */}
          <section
            aria-labelledby="section-tracking"
            className="bg-floria-linen rounded-2xl border border-floria-border p-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-floria-border mb-6">
              <h2
                id="section-tracking"
                className="font-serif text-lg font-bold text-ink-900"
              >
                Order Tracking Status
              </h2>
              <span
                className={`px-3 py-1 text-xs font-bold border rounded-full ${getStatusBadgeStyle(order.status)}`}
              >
                {order.status}
              </span>
            </div>

            {isCancelled ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                <p className="text-sm font-bold text-red-700 mb-1">
                  This order was cancelled
                </p>
                <p className="text-xs text-red-600">
                  No further fulfillment actions will take place for this order.
                </p>
              </div>
            ) : (
              <div className="relative pl-4 sm:pl-6">
                <ol
                  className="relative border-l-2 border-floria-border ml-2 space-y-6 sm:space-y-7"
                  role="list"
                >
                  {ORDER_STATUS_TIMELINE.map((stepStatus, idx) => {
                    const isCompleted = currentTimelineIndex > idx;
                    const isCurrent = currentTimelineIndex === idx;

                    return (
                      <li key={stepStatus} className="relative pl-6">
                        {/* Status node icon */}
                        <span
                          className={[
                            "absolute -left-[13px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                            isCurrent
                              ? "border-forest-800 bg-forest-800 text-white ring-4 ring-forest-800/15"
                              : isCompleted
                                ? "border-forest-800 bg-forest-800 text-white"
                                : "border-floria-border bg-floria-linen text-ink-300",
                          ].join(" ")}
                        >
                          {isCompleted ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : isCurrent ? (
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          ) : (
                            <span className="text-[10px] font-bold">
                              {idx + 1}
                            </span>
                          )}
                        </span>

                        {/* Status Label */}
                        <div>
                          <p
                            className={`text-sm font-bold leading-tight ${isCurrent ? "text-forest-800 font-serif" : isCompleted ? "text-ink-900" : "text-ink-400"}`}
                          >
                            {stepStatus}
                          </p>
                          <p className="text-[11px] text-ink-400 mt-0.5">
                            {isCompleted
                              ? "Completed"
                              : isCurrent
                                ? "In progress — nurseries preparing item"
                                : "Pending"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </section>

          {/* ORDER ITEMS GROUPED BY NURSERY */}
          <section
            aria-labelledby="section-items"
            className="bg-floria-linen rounded-2xl border border-floria-border p-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-floria-border mb-4">
              <h2
                id="section-items"
                className="font-serif text-lg font-bold text-ink-900"
              >
                Items Purchased ({order.totalItemsCount}{" "}
                {order.totalItemsCount === 1 ? "Item" : "Items"})
              </h2>
              <span className="text-xs text-ink-400">
                {order.nurseryGroups.length}{" "}
                {order.nurseryGroups.length === 1 ? "Nursery" : "Nurseries"}
              </span>
            </div>

            <div className="space-y-6">
              {order.nurseryGroups.map((group) => (
                <div
                  key={group.sellerId}
                  className="border border-floria-border rounded-2xl overflow-hidden bg-floria-linen"
                >
                  {/* Nursery Header */}
                  <div className="bg-floria-soft-sand px-4 py-3 border-b border-floria-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LeafIcon size={16} className="text-forest-700" />
                      <span className="text-xs font-bold text-forest-800 uppercase tracking-wider">
                        {group.sellerName}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-forest-800 bg-floria-linen px-2 py-0.5 rounded border border-floria-border">
                      ✓ {group.status || "Confirmed"}
                    </span>
                  </div>

                  {/* Nursery Items List */}
                  <div className="p-4 divide-y divide-floria-border">
                    {group.items.map((item) => (
                      <div
                        key={item.product.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center gap-4"
                      >
                        {/* Image */}
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="flex-shrink-0"
                        >
                          <div className="relative w-16 h-16 rounded-xl bg-floria-natural-sand border border-floria-border">
                            <div className="relative w-full h-full rounded-xl overflow-hidden">
                              <Image
                                src={
                                  item.primary_image?.url || "/brand_logo.svg"
                                }
                                alt={item.product.name}
                                fill
                                sizes="64px"
                                className={
                                  item.primary_image?.url
                                    ? "object-cover"
                                    : "object-scale-down p-2 opacity-60"
                                }
                              />
                            </div>
                            {item.quantity > 1 && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-forest-800 text-white font-bold text-[10px] rounded-full flex items-center justify-center border border-white shadow-sm">
                                {item.quantity}
                              </span>
                            )}
                          </div>
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.product.slug}`}>
                            <h3 className="font-sans text-xs sm:text-sm font-bold text-ink-900 hover:text-forest-800 transition-colors truncate">
                              {item.product.name}
                            </h3>
                          </Link>
                          <p className="text-[11px] text-ink-400 mt-0.5">
                            {item.categoryName || "Indoor Plant"}
                          </p>
                          <p className="text-xs text-ink-500 font-medium mt-1">
                            Qty:{" "}
                            <span className="font-bold text-ink-900">
                              {item.quantity}
                            </span>{" "}
                            &bull; {formatINR(item.pricePaise)} each
                          </p>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-ink-900">
                            {formatINR(item.pricePaise * item.quantity)}
                          </p>
                          {item.originalPricePaise && (
                            <p className="text-[11px] text-ink-300 line-through">
                              {formatINR(
                                item.originalPricePaise * item.quantity,
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* READ-ONLY DELIVERY ADDRESS */}
          <section
            aria-labelledby="section-address-snapshot"
            className="bg-floria-linen rounded-2xl border border-floria-border p-6 shadow-sm"
          >
            <h2
              id="section-address-snapshot"
              className="font-serif text-lg font-bold text-ink-900 pb-3 border-b border-floria-border mb-3"
            >
              Deliver To
            </h2>

            <div className="text-xs text-ink-600 space-y-1">
              <p className="font-bold text-sm text-ink-900">
                {order.address.full_name}
              </p>
              <p>
                {order.address.line1}
                {order.address.line2 ? `, ${order.address.line2}` : ""}
              </p>
              <p>
                {order.address.city}, {order.address.state} -{" "}
                <span className="font-semibold text-ink-900">
                  {order.address.pincode}
                </span>
              </p>
              <p className="text-ink-500 font-medium pt-1">
                Phone: {order.address.phone}
              </p>
              {order.address.instructions && (
                <p className="text-[11px] text-ink-400 italic pt-1">
                  Note: &quot;{order.address.instructions}&quot;
                </p>
              )}
            </div>
          </section>
        </div>

        {/* ── RIGHT COLUMN: SUMMARY & PAYMENT ─────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-24">
          {/* PRICE SUMMARY */}
          <div className="p-5 bg-floria-linen rounded-2xl border border-floria-border shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-900 pb-3 border-b border-floria-border">
              Payment Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-ink-900">
                  {formatINR(order.subtotalPaise + (order.discountPaise || 0))}
                </span>
              </div>

              {order.discountPaise > 0 && (
                <div className="flex justify-between text-forest-700">
                  <span>Discount</span>
                  <span className="font-semibold">
                    −{formatINR(order.discountPaise)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-ink-600">
                <span>Delivery</span>
                <span
                  className={
                    order.deliveryFeePaise && order.deliveryFeePaise > 0
                      ? "font-semibold text-ink-900"
                      : "font-semibold text-forest-700"
                  }
                >
                  {order.deliveryFeePaise && order.deliveryFeePaise > 0
                    ? formatINR(order.deliveryFeePaise)
                    : "FREE"}
                </span>
              </div>

              {(order.maintenanceFeePaise ?? 0) > 0 && (
                <div className="flex justify-between text-ink-600">
                  <span>Platform Maintenance Fee</span>
                  <span className="font-semibold text-ink-900">
                    {formatINR(order.maintenanceFeePaise!)}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-3 border-t border-floria-border text-ink-900 font-bold text-base">
                <span>Total Paid</span>
                <span className="text-forest-800">
                  {formatINR(
                    order.totalPaise ||
                      order.subtotalPaise +
                        (order.deliveryFeePaise || 0) +
                        (order.maintenanceFeePaise || 0),
                  )}
                </span>
              </div>
            </div>

            {/* Payment Method Badge */}
            <div className="p-3 bg-floria-soft-sand rounded-xl border border-floria-border flex items-center justify-between text-xs">
              <span className="text-ink-500 font-medium">Method</span>
              <span className="font-bold text-forest-800">
                {order.paymentMethod}
              </span>
            </div>

            <div className="flex items-center gap-1.5 justify-center text-[11px] text-ink-400 pt-1">
              <ShieldIcon size={14} className="text-forest-700" />
              <span>Secure Encrypted Transaction</span>
            </div>

            <div className="pt-2">
              <Link
                href="/categories"
                className="w-full flex items-center justify-center py-3 border border-floria-border hover:bg-floria-soft-sand text-ink-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors focus:outline-none"
              >
                Back to Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
