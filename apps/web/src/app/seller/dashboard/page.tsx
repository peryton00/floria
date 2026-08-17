"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, type SellerDashboardData } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { useToast } from "@/lib/contexts/ToastContext";
import { SellerDashboardSkeleton } from "@/components/ui/loading";
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
    return <SellerDashboardSkeleton />;
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
    <main className="max-w-6xl mx-auto space-y-6 pb-12 font-ui">
      {/* Welcome Banner */}
      <header className="bg-gradient-to-br from-[#183023] via-[#1E3A2B] to-[#254A37] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm border border-forest-700/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#DDE7DD]/80">
                Nursery Studio Dashboard
              </span>
              <SellerStatusBadge status={sellerStatus} size="sm" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
              Welcome back,{" "}
              <span className="text-[#DDE7DD]">
                {profile?.business_name || "Nursery Partner"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1.5 max-w-xl leading-relaxed">
              Real-time marketplace orders, live catalog stock management, and fulfillment status.
            </p>
          </div>

          <Link
            href="/seller/profile"
            style={{ color: "#ffffff" }}
            className="flex-shrink-0 px-5 py-3 bg-white/15 hover:bg-white/25 active:bg-white/10 !text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-white/20 transition-all shadow-xs hover:shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            Manage Profile →
          </Link>
        </div>
      </header>

      {/* Restricted Status Banner */}
      {!isApproved && (
        <section aria-label="Account Status Notice" className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertIcon size={18} />
          </div>
          <div className="text-xs sm:text-sm text-amber-950 leading-relaxed">
            {sellerStatus === "pending" && (
              <p>
                <strong className="font-bold">Application Under Review:</strong> Your nursery details are being verified by the Floria horticultural team. You can explore your catalog and update profile info, while product creation and fulfillment will unlock upon approval.
              </p>
            )}
            {sellerStatus === "suspended" && (
              <p>
                <strong className="font-bold">Account Suspended:</strong> Your seller account has been temporarily locked by administration. Storefront visibility and order processing are paused.
              </p>
            )}
            {sellerStatus === "rejected" && (
              <p>
                <strong className="font-bold">Application Not Approved:</strong> Your application was declined. Please review your submitted details or reach out to Floria support.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Action Required Notices */}
      {actionRequired.length > 0 && (
        <section aria-label="Action Required Alerts" className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink-500">Action Required</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {actionRequired.map((action: any) => (
              <Link
                key={action.id}
                href={action.href}
                className="bg-floria-linen rounded-2xl border border-amber-200/90 hover:border-amber-400 p-4 shadow-xs flex items-center justify-between group transition-all focus:outline-none focus:ring-2 focus:ring-forest-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center flex-shrink-0">
                    <AlertIcon size={18} />
                  </div>
                  <span className="text-xs font-bold text-ink-900 group-hover:text-amber-900 transition-colors">
                    {action.title}
                  </span>
                </div>
                <span className="text-xs font-bold text-forest-800 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                  View →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Real Seller KPI Cards Grid */}
      <section aria-label="Key Performance Indicators">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink-500">
            Marketplace KPI Overview
          </h2>
          <span className="text-[11px] font-semibold text-ink-400">Live Nursery Metrics</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          {kpiCards.map((card, idx) => (
            <Link
              key={idx}
              href={card.href}
              className="bg-floria-linen rounded-2xl border border-floria-border p-4 sm:p-5 shadow-xs hover:border-forest-700/60 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-forest-800"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink-500 leading-tight">
                  {card.label}
                </span>
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${card.color} border flex items-center justify-center flex-shrink-0 shadow-2xs`}>
                  {card.icon}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xl sm:text-2xl font-serif font-bold text-ink-900 leading-tight">
                  {card.value}
                </p>
                <p className="text-[10px] sm:text-[11px] text-ink-400 mt-1 group-hover:text-forest-800 transition-colors truncate">
                  {card.subtext}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Inventory Stock Alerts & Quick Adjustment */}
      <section aria-label="Inventory Alerts" className="bg-floria-linen rounded-3xl border border-floria-border p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-floria-border pb-3.5">
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-ink-900">Inventory Stock Alerts</h2>
            <p className="text-xs text-ink-500">Products requiring immediate inventory replenishment.</p>
          </div>
          <Link href="/seller/products" className="text-xs font-bold text-forest-800 hover:text-forest-950 uppercase tracking-wider">
            View Full Catalog →
          </Link>
        </div>

        {inventoryAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs font-medium text-ink-500 bg-floria-soft-sand rounded-2xl border border-floria-border">
            ✓ All product inventory levels are healthy and above reorder thresholds.
          </div>
        ) : (
          <div className="divide-y divide-floria-border">
            {inventoryAlerts.map((item: any) => (
              <div key={item.id} className="py-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <p className="font-bold text-xs sm:text-sm text-ink-900">{item.name}</p>
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="text-xs text-forest-800 font-bold">{formatINR(item.pricePaise)}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === "out_of_stock" ? "bg-rose-50 text-rose-800 border border-rose-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
                      {item.status === "out_of_stock" ? "Out of Stock (0)" : `Low Stock (${item.stockQuantity} remaining)`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isApproved}
                  onClick={() => { setEditingStockItem(item); setNewStockQty(item.stockQuantity); }}
                  className="self-start sm:self-auto px-4 py-2 rounded-xl border border-floria-border hover:bg-floria-sand bg-floria-soft-sand text-ink-800 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-2xs active:scale-95"
                >
                  Quick Stock Update
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Orders Overview */}
      <section aria-label="Recent Seller Orders" className="bg-floria-linen rounded-3xl border border-floria-border p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-floria-border pb-3.5">
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-ink-900">Recent Customer Orders</h2>
            <p className="text-xs text-ink-500">Incoming nursery orders from verified Floria buyers.</p>
          </div>
          <Link href="/seller/orders" className="text-xs font-bold text-forest-800 hover:text-forest-950 uppercase tracking-wider">
            All Orders Queue →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-6 text-center text-xs font-medium text-ink-500 bg-floria-soft-sand rounded-2xl border border-floria-border">
            No customer orders recorded yet for your nursery.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-floria-border">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-floria-soft-sand text-ink-600 font-bold uppercase tracking-wider border-b border-floria-border">
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Fulfillment Status</th>
                  <th className="p-3.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-floria-border bg-floria-linen">
                {recentOrders.map((o: any) => (
                  <tr key={o.masterOrderId} className="hover:bg-floria-soft-sand/60 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-ink-900">#{o.masterOrderId?.slice(0, 8)}</td>
                    <td className="p-3.5 font-semibold text-ink-800">{o.customer?.name || "Customer"}</td>
                    <td className="p-3.5 text-ink-600">{o.items?.length || 0} item(s)</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-50 text-forest-800 border border-forest-200">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-forest-800 text-right">{formatINR(o.subtotalPaise || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Profile Completeness Checklist Banner */}
      {profilePct < 100 && (
        <section aria-label="Profile Completeness Banner" className="bg-floria-linen rounded-3xl border border-amber-200/90 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-ink-900">Complete Nursery Profile Information</h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Complete profile details increase buyer conversion.{" "}
                <strong className="text-ink-800">{completedCount}/{profileChecks.length} parameters configured.</strong>
              </p>
            </div>
            <Link
              href="/seller/profile"
              style={{ color: "#ffffff" }}
              className="px-5 py-2.5 bg-forest-800 hover:bg-forest-900 !text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs hover:shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-forest-800"
            >
              Complete Profile →
            </Link>
          </div>

          <div className="h-2.5 bg-floria-sand rounded-full overflow-hidden">
            <div className="h-full bg-forest-800 transition-all duration-500" style={{ width: `${profilePct}%` }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs pt-1">
            {profileChecks.map((check, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-floria-soft-sand border border-floria-border/60">
                <span className={`text-xs ${check.done ? "text-forest-800 font-bold" : "text-ink-400"}`}>
                  {check.done ? "✓" : "○"}
                </span>
                <span className={check.done ? "text-ink-500 line-through truncate" : "text-ink-800 font-semibold truncate"}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Action Navigation Grid */}
      <section aria-label="Quick Actions Navigation">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-500 mb-3.5">Quick Studio Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/seller/products"
            className="bg-floria-linen rounded-2xl border border-floria-border hover:border-forest-700/60 p-5 shadow-xs flex flex-col justify-between group hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-forest-800"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 border border-forest-200/80 flex items-center justify-center mb-3 group-hover:bg-forest-100 transition-colors shadow-2xs">
              <GridIcon size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-ink-900 mb-1">Catalog Listings</h3>
              <p className="text-xs text-ink-500">Manage plant varieties, pricing, and active marketplace status.</p>
            </div>
            <span className="text-[11px] font-bold text-forest-800 uppercase tracking-wider mt-4">View Listings →</span>
          </Link>

          <Link
            href="/seller/orders"
            className="bg-floria-linen rounded-2xl border border-floria-border hover:border-forest-700/60 p-5 shadow-xs flex flex-col justify-between group hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-forest-800"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 border border-forest-200/80 flex items-center justify-center mb-3 group-hover:bg-forest-100 transition-colors shadow-2xs">
              <OrderIcon size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-ink-900 mb-1">Orders Queue</h3>
              <p className="text-xs text-ink-500">Confirm, pack, and prepare customer orders for logistics pickup.</p>
            </div>
            <span className="text-[11px] font-bold text-forest-800 uppercase tracking-wider mt-4">View Orders →</span>
          </Link>

          <Link
            href="/seller/profile"
            className="bg-floria-linen rounded-2xl border border-floria-border hover:border-forest-700/60 p-5 shadow-xs flex flex-col justify-between group hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-forest-800"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 border border-forest-200/80 flex items-center justify-center mb-3 group-hover:bg-forest-100 transition-colors shadow-2xs">
              <UserIcon size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-ink-900 mb-1">Nursery Profile</h3>
              <p className="text-xs text-ink-500">Update business branding, contact details, and nursery pickup address.</p>
            </div>
            <span className="text-[11px] font-bold text-forest-800 uppercase tracking-wider mt-4">Edit Profile →</span>
          </Link>

          <Link
            href="/seller/payouts"
            className="bg-floria-linen rounded-2xl border border-floria-border hover:border-forest-700/60 p-5 shadow-xs flex flex-col justify-between group hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-forest-800"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 border border-forest-200/80 flex items-center justify-center mb-3 group-hover:bg-forest-100 transition-colors shadow-2xs">
              <PayoutIcon size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-ink-900 mb-1">Earnings &amp; Payouts</h3>
              <p className="text-xs text-ink-500">Track sales earnings, platform commissions, and settlement ledger.</p>
            </div>
            <span className="text-[11px] font-bold text-forest-800 uppercase tracking-wider mt-4">View Payouts →</span>
          </Link>
        </div>
      </section>

      {/* Modal: Quick Stock Adjustment */}
      {editingStockItem && (
        <div className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-floria-linen rounded-3xl border border-floria-border p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-floria-border pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-ink-900">Update Inventory Stock</h3>
                <p className="text-xs text-ink-500 mt-0.5">{editingStockItem.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStockItem(null)}
                className="text-ink-400 hover:text-ink-900 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickStockUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                  Available Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900 font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={stockUpdating}
                  style={{ color: "#ffffff" }}
                  className="flex-1 py-3 rounded-xl bg-forest-800 hover:bg-forest-900 !text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs hover:shadow-md active:scale-95 disabled:opacity-50"
                >
                  {stockUpdating ? "Saving..." : "Save Stock"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStockItem(null)}
                  className="px-4 py-3 rounded-xl border border-floria-border text-ink-700 font-bold text-xs uppercase tracking-wider hover:bg-floria-sand transition-colors"
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
