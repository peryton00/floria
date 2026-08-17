"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { useOrders, OrderStatus } from "@/lib/contexts/OrderContext";
import { formatINR } from "@/lib/format";
import { LeafIcon, BagIcon, TruckIcon } from "@/components/ui/Icons";

function getStatusBadgeStyle(status: OrderStatus) {
  switch (status) {
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

export default function OrdersPage() {
  const { orders } = useOrders();
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "completed") return order.status === "Delivered";
    if (activeFilter === "cancelled") return order.status === "Cancelled";
    if (activeFilter === "active") return order.status !== "Delivered" && order.status !== "Cancelled";
    return true;
  });

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400 mb-6">
        <Link href="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <span className="text-ink-700 font-medium">My Orders</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-wrap items-baseline justify-between mb-6 gap-2">
        <h1 className="font-serif text-3xl font-bold text-ink-900">
          My Orders
          <span className="ml-2 font-sans text-lg font-normal text-ink-400">({orders.length})</span>
        </h1>
      </div>

      {/* Filter Tabs */}
      {orders.length > 0 && (
        <div className="flex border-b border-floria-border mb-6 gap-6 text-xs font-bold uppercase tracking-wider text-ink-300 overflow-x-auto pb-px">
          {[
            { id: "all", label: `All Orders (${orders.length})` },
            { id: "active", label: "Active / Ongoing" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={[
                  "pb-3 relative whitespace-nowrap transition-colors focus:outline-none",
                  isActive ? "text-forest-800 font-bold" : "hover:text-ink-900",
                ].join(" ")}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest-800 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-floria-linen rounded-2xl border border-floria-border shadow-sm max-w-md mx-auto p-6">
          <div className="w-16 h-16 rounded-full bg-forest-50 flex items-center justify-center mx-auto mb-4 text-forest-700">
            <BagIcon size={32} />
          </div>
          <h2 className="text-lg font-bold text-ink-900 mb-1">
            {orders.length === 0 ? "No orders yet" : "No orders found"}
          </h2>
          <p className="text-sm text-ink-500 mb-6">
            {orders.length === 0
              ? "Your order history will appear here after you make a purchase."
              : "No orders match the selected filter category."}
          </p>
          <Link
            href="/categories"
            className="inline-flex items-center justify-center px-6 py-3 bg-forest-800 hover:bg-forest-900 !text-white font-semibold text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-forest-800 shadow-sm"
            style={{ color: "#ffffff" }}
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {filteredOrders.map((order) => {
            const badgeStyle = getStatusBadgeStyle(order.status);
            const totalNurseries = order.nurseryGroups.length;

            // Collect all item images for preview
            const allItems = order.nurseryGroups.flatMap((g) => g.items);

            return (
              <div
                key={order.id}
                className="bg-floria-linen rounded-2xl border border-floria-border shadow-sm overflow-hidden hover:border-forest-400 transition-all"
              >
                {/* Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-floria-soft-sand/70 border-b border-floria-border text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <span className="text-ink-400 font-bold uppercase tracking-wider text-[10px] block">Order ID</span>
                      <span className="font-mono font-bold text-ink-900 text-sm">#{order.id}</span>
                    </div>
                    <div className="hidden sm:block border-l border-floria-border h-6" />
                    <div className="hidden sm:block">
                      <span className="text-ink-400 font-bold uppercase tracking-wider text-[10px] block">Placed On</span>
                      <span className="font-semibold text-ink-800">{order.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-xs font-bold border rounded-full ${badgeStyle}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: thumbnails & details */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-ink-500">
                      <span className="font-semibold text-ink-900">
                        {order.totalItemsCount} {order.totalItemsCount === 1 ? "item" : "items"}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 font-semibold text-forest-700">
                        <LeafIcon size={12} />
                        {totalNurseries} {totalNurseries === 1 ? "nursery" : "nurseries"}
                      </span>
                    </div>

                    {/* Items grouped by Nursery with separate tracking/status */}
                    <div className="space-y-3">
                      {order.nurseryGroups.map((group) => (
                        <div
                          key={group.sellerId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-floria-soft-sand border border-floria-border rounded-xl"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Thumbnails for this nursery group */}
                            <div className="flex items-center gap-2">
                              {group.items.slice(0, 3).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="relative w-10 h-10 rounded-lg bg-floria-natural-sand border border-floria-border flex-shrink-0"
                                  title={`${item.product.name} (Qty: ${item.quantity})`}
                                >
                                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                                    <Image
                                      src={item.primary_image?.url || "/floria-logo.png"}
                                      alt={item.product.name}
                                      fill
                                      sizes="40px"
                                      className="object-cover"
                                    />
                                  </div>
                                  {item.quantity > 1 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-0.5 bg-forest-800 text-white font-bold text-[9px] rounded-full flex items-center justify-center border border-white shadow-sm">
                                      {item.quantity}
                                    </span>
                                  )}
                                </div>
                              ))}
                              {group.items.length > 3 && (
                                <div className="w-10 h-10 rounded-lg bg-forest-100 border border-forest-200 flex items-center justify-center text-[10px] font-bold text-forest-800 flex-shrink-0">
                                  +{group.items.length - 3}
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-[11px] font-bold text-ink-950 uppercase tracking-wider">
                                {group.sellerName}
                              </p>
                              <p className="text-[10px] text-ink-400">
                                {group.items.reduce((s, i) => s + i.quantity, 0)} {group.items.reduce((s, i) => s + i.quantity, 0) === 1 ? "item" : "items"}
                              </p>
                            </div>
                          </div>

                          {/* Nursery tracking status */}
                          <div className="flex-shrink-0">
                            <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${getStatusBadgeStyle(group.status)}`}>
                              {group.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery summary */}
                    <p className="text-[11px] text-ink-500">
                      Deliver to: <span className="font-semibold text-ink-850">{order.address.full_name}</span> ({order.address.city})
                    </p>
                  </div>

                  {/* Right: Total & Action button */}
                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-floria-border gap-3">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">Total Amount</span>
                      <span className="text-lg font-bold text-forest-800">
                        {formatINR(order.subtotalPaise)}
                      </span>
                    </div>

                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-forest-800 hover:bg-forest-900 !text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-forest-800 shadow-sm"
                      style={{ color: "#ffffff" }}
                    >
                      Track Order
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CustomerShell>
  );
}
