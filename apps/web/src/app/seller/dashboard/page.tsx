"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, type SellerDashboardData } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { useToast } from "@/lib/contexts/ToastContext";
import {
  GridIcon,
  OrderIcon,
  LeafIcon,
  AlertIcon,
  CheckIcon,
  PayoutIcon,
  UserIcon,
} from "@/components/ui/Icons";

export default function SellerDashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<SellerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Stock Adjustment Modal State
  const [editingStockItem, setEditingStockItem] = useState<any | null>(null);
  const [newStockQty, setNewStockQty] = useState<number>(0);
  const [stockUpdating, setStockUpdating] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSellerDashboard();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || "Failed to load seller dashboard metrics");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to Floria API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleQuickStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockItem) return;
    try {
      setStockUpdating(true);
      const res = await api.updateSellerInventory(editingStockItem.id, {
        stock_quantity: Math.max(0, newStockQty),
      });

      if (res.success) {
        toast.success("Stock updated", `Inventory for '${editingStockItem.name}' updated.`);
        setEditingStockItem(null);
        await fetchDashboard();
      } else {
        toast.error("Stock update failed", res.error?.message || "Failed to update stock quantity");
      }
    } catch (err: any) {
      toast.error("Stock update failed", err.message || "Error updating stock");
    } finally {
      setStockUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse" aria-label="Loading Seller Dashboard">
        {/* Banner Skeleton */}
        <div className="h-44 bg-ink-100/70 rounded-2xl w-full" />

        {/* Action Skeleton */}
        <div className="h-16 bg-ink-100/70 rounded-xl w-full" />

        {/* KPI Skeleton Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-ink-100/70 rounded-xl w-full" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-ink-100/70 rounded-2xl w-full" />
          <div className="h-64 bg-ink-100/70 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-error-50 text-error-600 flex items-center justify-center mx-auto border border-error-100">
          <AlertIcon size={24} />
        </div>
        <h1 className="font-serif text-xl font-bold text-ink-900">Dashboard Unavailable</h1>
        <p className="text-xs text-ink-500 max-w-sm mx-auto">{error || "Could not retrieve live dashboard metrics from API."}</p>
        <button
          type="button"
          onClick={fetchDashboard}
          className="px-5 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { profile, kpis, recentOrders, inventoryAlerts, actionRequired } = data;
  const sellerStatus = profile?.status || "pending";
  const isApproved = sellerStatus === "approved";

  // Profile completion check
  const profileChecks = [
    { label: "Business Name", done: !!profile?.business_name?.trim() },
    { label: "Nursery Description", done: !!profile?.business_description?.trim() },
    { label: "Contact Phone", done: !!profile?.contact_phone?.trim() },
    { label: "Contact Email", done: !!profile?.contact_email?.trim() },
    { label: "Nursery Address", done: !!profile?.address?.trim() },
  ];
  const completedCount = profileChecks.filter((c) => c.done).length;
  const profilePct = Math.round((completedCount / profileChecks.length) * 100);

  const kpiCards = [
    {
      label: "Total Sales Revenue",
      value: formatINR(kpis.totalRevenuePaise),
      subtext: "Gross nursery order value",
      icon: <PayoutIcon size={20} />,
      color: "bg-forest-50 text-forest-800 border-forest-100",
      href: "/seller/payouts",
    },
    {
      label: "New Orders",
      value: kpis.newOrders,
      subtext: "Awaiting confirmation",
      icon: <OrderIcon size={20} />,
      color: "bg-blue-50 text-blue-700 border-blue-100",
      href: "/seller/orders?status=Order+Placed",
    },
    {
      label: "Preparing",
      value: kpis.preparingOrders,
      subtext: "Items being prepared",
      icon: <LeafIcon size={20} />,
      color: "bg-warning-50 text-warning-700 border-warning-100",
      href: "/seller/orders?status=Preparing",
    },
    {
      label: "Ready for Pickup",
      value: kpis.readyForPickupOrders,
      subtext: "Awaiting ops pickup",
      icon: <CheckIcon size={20} />,
      color: "bg-purple-50 text-purple-700 border-purple-100",
      href: "/seller/orders?status=Ready+for+Pickup",
    },
    {
      label: "Fulfilled Orders",
      value: kpis.completedOrders,
      subtext: "Completed deliveries",
      icon: <CheckIcon size={20} />,
      color: "bg-success-50 text-success-700 border-success-100",
      href: "/seller/orders?status=Picked+Up",
    },
    {
      label: "Active Listings",
      value: kpis.publishedProducts,
      subtext: `${kpis.totalProducts} total products`,
      icon: <GridIcon size={20} />,
      color: "bg-forest-50 text-forest-800 border-forest-100",
      href: "/seller/products",
    },
    {
      label: "Low Stock Alert",
      value: kpis.lowStockProducts,
      subtext: "Below reorder threshold",
      icon: <AlertIcon size={20} />,
      color: "bg-warning-50 text-warning-700 border-warning-100",
      href: "/seller/products?stock=low_stock",
    },
    {
      label: "Out of Stock",
      value: kpis.outOfStockProducts,
      subtext: "Hidden from catalog",
      icon: <AlertIcon size={20} />,
      color: "bg-error-50 text-error-700 border-error-100",
      href: "/seller/products?stock=out_of_stock",
    },
  ];

  return (
    <main className="max-w-5xl mx-auto space-y-6 pb-12 px-3 sm:px-6">
      {/* Welcome Banner */}
      <header className="bg-forest-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cream-200/70">
                Seller Control Center
              </span>
              <SellerStatusBadge status={sellerStatus} size="sm" />
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-white leading-tight">
              Welcome back,{" "}
              <span className="text-forest-200">
                {profile?.business_name || "Nursery Partner"}
              </span>
            </h1>
            <p className="text-xs md:text-sm text-cream-100/80 mt-1 max-w-xl">
              Real-time marketplace orders, inventory stock management, and fulfillment status.
            </p>
          </div>

          <Link
            href="/seller/profile"
            className="flex-shrink-0 px-4 py-2.5 bg-forest-800 hover:bg-forest-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-forest-600 transition-colors focus:outline-none focus:ring-2 focus:ring-cream-200"
          >
            Manage Profile →
          </Link>
        </div>
      </header>

      {/* Restricted Status Banner */}
      {!isApproved && (
        <section aria-label="Account Status Notice" className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-start gap-3">
          <AlertIcon size={20} className="text-warning-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-warning-900 leading-relaxed">
            {sellerStatus === "pending" && (
              <p>
                <strong className="font-bold">Application Pending:</strong> Your nursery application is under verification by Floria Admin. You can view your catalog and update profile info, but new product creation and order fulfillment are restricted until approved.
              </p>
            )}
            {sellerStatus === "suspended" && (
              <p>
                <strong className="font-bold">Account Suspended:</strong> Your seller profile has been suspended by administration. Product listings and order processing functions are currently locked.
              </p>
            )}
            {sellerStatus === "rejected" && (
              <p>
                <strong className="font-bold">Application Rejected:</strong> Your seller application was not approved. Please review your submitted details or contact Floria support.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Action Required Notices */}
      {actionRequired.length > 0 && (
        <section aria-label="Action Required Alerts" className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink-500">Action Required</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actionRequired.map((action: any) => (
              <Link
                key={action.id}
                href={action.href}
                className="bg-white rounded-xl border border-warning-200 hover:border-warning-400 p-4 shadow-xs flex items-center justify-between group transition-colors focus:outline-none focus:ring-2 focus:ring-forest-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-warning-100 text-warning-800 flex items-center justify-center flex-shrink-0">
                    <AlertIcon size={16} />
                  </div>
                  <span className="text-xs font-bold text-ink-900 group-hover:text-warning-800 transition-colors">
                    {action.title}
                  </span>
                </div>
                <span className="text-xs font-bold text-forest-700 uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
                  View →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Real Seller KPI Cards Grid */}
      <section aria-label="Key Performance Indicators">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-500 mb-3">
          Marketplace KPI Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {kpiCards.map((card, idx) => (
            <Link
              key={idx}
              href={card.href}
              className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs hover:border-forest-300 hover:shadow-sm transition-all flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-forest-700"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 leading-tight">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${card.color} border flex items-center justify-center flex-shrink-0`}>
                  {card.icon}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xl sm:text-2xl font-bold text-ink-900 leading-tight">
                  {card.value}
                </p>
                <p className="text-[10px] text-ink-400 mt-0.5 group-hover:text-forest-700 transition-colors truncate">
                  {card.subtext}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Inventory Stock Alerts & Quick Adjustment */}
      <section aria-label="Inventory Alerts" className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-ink-100 pb-3">
          <div>
            <h2 className="font-serif text-base font-bold text-ink-900">Inventory Stock Alerts</h2>
            <p className="text-xs text-ink-400">Products requiring immediate stock updates or reordering.</p>
          </div>
          <Link href="/seller/products" className="text-xs font-bold text-forest-700 hover:text-forest-900">
            View Catalog →
          </Link>
        </div>

        {inventoryAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-ink-400 bg-cream-50 rounded-xl">
            ✓ All product inventory levels are healthy and above reorder thresholds.
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {inventoryAlerts.map((item: any) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <p className="font-bold text-xs text-ink-900">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-ink-500 font-bold">{formatINR(item.pricePaise)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${item.status === "out_of_stock" ? "bg-error-50 text-error-700 border border-error-100" : "bg-warning-50 text-warning-700 border border-warning-100"}`}>
                      {item.status === "out_of_stock" ? "Out of Stock (0)" : `Low Stock (${item.stockQuantity} remaining)`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isApproved}
                  onClick={() => { setEditingStockItem(item); setNewStockQty(item.stockQuantity); }}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-800 font-bold text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40"
                >
                  Quick Stock Update
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Orders Overview */}
      <section aria-label="Recent Seller Orders" className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-ink-100 pb-3">
          <div>
            <h2 className="font-serif text-base font-bold text-ink-900">Recent Customer Orders</h2>
            <p className="text-xs text-ink-400">Incoming order items from Floria customers.</p>
          </div>
          <Link href="/seller/orders" className="text-xs font-bold text-forest-700 hover:text-forest-900">
            All Seller Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-6 text-center text-xs text-ink-400 bg-cream-50 rounded-xl">
            No customer orders recorded yet for your nursery.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Fulfillment Status</th>
                  <th className="p-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {recentOrders.map((o: any) => (
                  <tr key={o.masterOrderId} className="hover:bg-cream-50/50">
                    <td className="p-3 font-mono font-bold text-ink-900">{o.masterOrderId}</td>
                    <td className="p-3 font-semibold text-ink-700">{o.customer?.name || "Customer"}</td>
                    <td className="p-3 text-ink-500">{o.items?.length || 0} item(s)</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-forest-50 text-forest-800 border border-forest-100">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-forest-800 text-right">{formatINR(o.subtotalPaise || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Profile Completeness Checklist Banner */}
      {profilePct < 100 && (
        <section aria-label="Profile Completeness Banner" className="bg-white rounded-2xl border border-warning-200 p-6 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-serif text-base font-bold text-ink-900">Complete Nursery Profile Information</h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Complete profile details increase buyer conversion.{" "}
                <strong className="text-ink-800">{completedCount}/{profileChecks.length} parameters set.</strong>
              </p>
            </div>
            <Link
              href="/seller/profile"
              className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-forest-700"
            >
              Complete Profile →
            </Link>
          </div>

          <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
            <div className="h-full bg-forest-700 transition-all duration-500" style={{ width: `${profilePct}%` }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-1">
            {profileChecks.map((check, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`text-[10px] ${check.done ? "text-success-600 font-bold" : "text-ink-400"}`}>
                  {check.done ? "✓" : "○"}
                </span>
                <span className={check.done ? "text-ink-500 line-through" : "text-ink-800 font-medium"}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Action Navigation Grid */}
      <section aria-label="Quick Actions Navigation">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-500 mb-3">Quick Control Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/seller/products"
            className="bg-white rounded-2xl border border-ink-100 hover:border-forest-300 p-5 shadow-xs flex flex-col justify-between group transition-all focus:outline-none focus:ring-2 focus:ring-forest-700"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-3 group-hover:bg-forest-100 transition-colors">
              <GridIcon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink-900 mb-1">Catalog Listings</h3>
              <p className="text-xs text-ink-500">Manage plant products, pricing, and active listings.</p>
            </div>
            <span className="text-[11px] font-bold text-forest-700 uppercase tracking-wider mt-4">View Listings →</span>
          </Link>

          <Link
            href="/seller/orders"
            className="bg-white rounded-2xl border border-ink-100 hover:border-forest-300 p-5 shadow-xs flex flex-col justify-between group transition-all focus:outline-none focus:ring-2 focus:ring-forest-700"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-3 group-hover:bg-forest-100 transition-colors">
              <OrderIcon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink-900 mb-1">Orders Queue</h3>
              <p className="text-xs text-ink-500">Process and fulfill customer plant orders.</p>
            </div>
            <span className="text-[11px] font-bold text-forest-700 uppercase tracking-wider mt-4">View Orders →</span>
          </Link>

          <Link
            href="/seller/profile"
            className="bg-white rounded-2xl border border-ink-100 hover:border-forest-300 p-5 shadow-xs flex flex-col justify-between group transition-all focus:outline-none focus:ring-2 focus:ring-forest-700"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-3 group-hover:bg-forest-100 transition-colors">
              <UserIcon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink-900 mb-1">Nursery Profile</h3>
              <p className="text-xs text-ink-500">Update business details, contact, and address.</p>
            </div>
            <span className="text-[11px] font-bold text-forest-700 uppercase tracking-wider mt-4">Edit Profile →</span>
          </Link>

          <Link
            href="/seller/payouts"
            className="bg-white rounded-2xl border border-ink-100 hover:border-forest-300 p-5 shadow-xs flex flex-col justify-between group transition-all focus:outline-none focus:ring-2 focus:ring-forest-700"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-3 group-hover:bg-forest-100 transition-colors">
              <PayoutIcon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink-900 mb-1">Earnings & Payouts</h3>
              <p className="text-xs text-ink-500">Track sales revenue and settlement history.</p>
            </div>
            <span className="text-[11px] font-bold text-forest-700 uppercase tracking-wider mt-4">View Payouts →</span>
          </Link>
        </div>
      </section>

      {/* Modal: Quick Stock Adjustment */}
      {editingStockItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-ink-100 pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-ink-900">Update Inventory Stock</h3>
                <p className="text-xs text-ink-500 mt-0.5">{editingStockItem.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStockItem(null)}
                className="text-ink-400 hover:text-ink-900 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickStockUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  New Available Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={stockUpdating}
                  className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {stockUpdating ? "Saving..." : "Save Stock"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStockItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-bold text-xs uppercase tracking-wider hover:bg-cream-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
