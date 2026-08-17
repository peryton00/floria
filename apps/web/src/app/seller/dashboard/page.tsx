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
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Title & Status Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">
              Nursery Command Center — {profile?.business_name || "Nursery Partner"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time nursery sales telemetry, live catalog inventory oversight, and order fulfillment dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SellerStatusBadge status={sellerStatus} size="sm" />
          <Link
            href="/seller/profile"
            className="px-3.5 py-1.5 bg-[#1B4D3E] hover:bg-[#153e31] !text-white font-bold text-xs uppercase tracking-wider rounded shadow-xs transition-colors"
            style={{ color: "#ffffff" }}
          >
            Manage Profile →
          </Link>
        </div>
      </div>

      {/* Restricted Status Banner */}
      {!isApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded p-4 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertIcon size={18} />
          </div>
          <div className="text-xs text-amber-950 leading-relaxed">
            {sellerStatus === "pending" && (
              <p>
                <strong className="font-bold font-mono uppercase tracking-wider">Application Under Review:</strong> Your nursery credentials are being verified by the Floria botanical team. You can configure your profile parameters while catalog publish actions will unlock upon approval.
              </p>
            )}
            {sellerStatus === "suspended" && (
              <p>
                <strong className="font-bold font-mono uppercase tracking-wider">Account Suspended:</strong> Your seller account has been temporarily restricted. Storefront catalog visibility and order checkout are paused.
              </p>
            )}
            {sellerStatus === "rejected" && (
              <p>
                <strong className="font-bold font-mono uppercase tracking-wider">Application Not Approved:</strong> Your application was declined. Please verify your business details or reach out to Floria compliance.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Required Notices */}
      {actionRequired.length > 0 && (
        <div className="space-y-2.5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Action Required</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {actionRequired.map((action: any) => (
              <Link
                key={action.id}
                href={action.href}
                className="bg-white rounded border border-amber-200 hover:border-amber-400 p-4 shadow-xs flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                    <AlertIcon size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-amber-900 transition-colors">
                    {action.title}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-[#1B4D3E] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                  View →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Real Seller KPI Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Marketplace KPI Overview
          </p>
          <span className="font-mono text-[10px] font-bold text-slate-400">Live Nursery Metrics</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => (
            <Link
              key={idx}
              href={card.href}
              className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs hover:border-slate-400 transition-all flex items-start justify-between group"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                  {card.label}
                </p>
                <p className="font-mono text-xl font-bold text-[#0F172A] mt-1.5 tracking-tight truncate">
                  {card.value}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 truncate group-hover:text-[#1B4D3E] transition-colors">
                  {card.subtext}
                </p>
              </div>
              <div className={`w-9 h-9 rounded ${card.color} flex items-center justify-center flex-shrink-0 shadow-xs`}>
                {card.icon}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Inventory Stock Alerts & Quick Adjustment */}
      <div className="bg-white rounded border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div>
            <h2 className="font-sans text-sm font-bold text-[#0F172A]">Inventory Stock Alerts</h2>
            <p className="text-xs text-slate-500 mt-0.5">Products requiring immediate inventory replenishment.</p>
          </div>
          <Link href="/seller/products" className="font-mono text-[11px] font-bold text-[#1B4D3E] hover:text-[#153e31] uppercase tracking-wider">
            View Full Catalog →
          </Link>
        </div>

        {inventoryAlerts.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-slate-500">
            ✓ All product inventory levels are healthy and above reorder thresholds.
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {inventoryAlerts.map((item: any) => (
              <div key={item.id} className="p-4 sm:px-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-50/80 transition-colors">
                <div>
                  <p className="font-bold text-xs sm:text-sm text-[#0F172A]">{item.name}</p>
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="font-mono text-xs text-[#1B4D3E] font-bold">{formatINR(item.pricePaise)}</span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${item.status === "out_of_stock" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {item.status === "out_of_stock" ? "Out of Stock (0)" : `Low Stock (${item.stockQuantity} remaining)`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isApproved}
                  onClick={() => { setEditingStockItem(item); setNewStockQty(item.stockQuantity); }}
                  className="self-start sm:self-auto px-3.5 py-1.5 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-xs"
                >
                  Quick Stock Update
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders Overview Table */}
      <div className="bg-white rounded border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div>
            <h2 className="font-sans text-sm font-bold text-[#0F172A]">Recent Customer Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">Incoming nursery orders from verified marketplace buyers.</p>
          </div>
          <Link href="/seller/orders" className="font-mono text-[11px] font-bold text-[#1B4D3E] hover:text-[#153e31] uppercase tracking-wider">
            All Orders Queue →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-slate-500">
            No customer orders recorded yet for your nursery.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-slate-600 font-mono text-[10px] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Fulfillment Status</th>
                  <th className="p-3.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {recentOrders.map((o: any) => (
                  <tr key={o.masterOrderId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#0F172A]">#{o.masterOrderId?.slice(0, 8)}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{o.customer?.name || "Customer"}</td>
                    <td className="p-3.5 text-slate-500">{o.items?.length || 0} item(s)</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[#1B4D3E] text-right">{formatINR(o.subtotalPaise || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Profile Completeness Checklist Banner */}
      {profilePct < 100 && (
        <div className="bg-white rounded border border-amber-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-sans text-sm font-bold text-[#0F172A]">Complete Nursery Profile Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete profile details increase buyer conversion.{" "}
                <strong className="text-slate-800">{completedCount}/{profileChecks.length} parameters configured.</strong>
              </p>
            </div>
            <Link
              href="/seller/profile"
              style={{ color: "#ffffff" }}
              className="px-4 py-2 bg-[#1B4D3E] hover:bg-[#153e31] !text-white font-bold text-xs uppercase tracking-wider rounded shadow-xs transition-colors"
            >
              Complete Profile →
            </Link>
          </div>

          <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div className="h-full bg-[#1B4D3E] transition-all duration-500" style={{ width: `${profilePct}%` }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs pt-1">
            {profileChecks.map((check, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className={`text-xs ${check.done ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                  {check.done ? "✓" : "○"}
                </span>
                <span className={check.done ? "text-slate-500 line-through truncate" : "text-slate-700 font-semibold truncate"}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div className="space-y-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Quick Studio Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/seller/products"
            className="bg-white rounded border border-[#E2E8F0] hover:border-slate-400 p-4 shadow-xs flex flex-col justify-between group transition-all"
          >
            <div className="w-9 h-9 rounded bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center mb-3 shadow-xs">
              <GridIcon size={18} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-xs text-[#0F172A] mb-1">Catalog Listings</h3>
              <p className="text-[11px] text-slate-500">Manage plant varieties, pricing, and active marketplace status.</p>
            </div>
            <span className="font-mono text-[10px] font-bold text-[#1B4D3E] uppercase tracking-wider mt-3">View Listings →</span>
          </Link>

          <Link
            href="/seller/orders"
            className="bg-white rounded border border-[#E2E8F0] hover:border-slate-400 p-4 shadow-xs flex flex-col justify-between group transition-all"
          >
            <div className="w-9 h-9 rounded bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center mb-3 shadow-xs">
              <OrderIcon size={18} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-xs text-[#0F172A] mb-1">Orders Queue</h3>
              <p className="text-[11px] text-slate-500">Confirm, pack, and prepare customer orders for logistics pickup.</p>
            </div>
            <span className="font-mono text-[10px] font-bold text-[#1B4D3E] uppercase tracking-wider mt-3">View Orders →</span>
          </Link>

          <Link
            href="/seller/profile"
            className="bg-white rounded border border-[#E2E8F0] hover:border-slate-400 p-4 shadow-xs flex flex-col justify-between group transition-all"
          >
            <div className="w-9 h-9 rounded bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center mb-3 shadow-xs">
              <UserIcon size={18} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-xs text-[#0F172A] mb-1">Nursery Profile</h3>
              <p className="text-[11px] text-slate-500">Update business branding, contact details, and nursery pickup address.</p>
            </div>
            <span className="font-mono text-[10px] font-bold text-[#1B4D3E] uppercase tracking-wider mt-3">Edit Profile →</span>
          </Link>

          <Link
            href="/seller/payouts"
            className="bg-white rounded border border-[#E2E8F0] hover:border-slate-400 p-4 shadow-xs flex flex-col justify-between group transition-all"
          >
            <div className="w-9 h-9 rounded bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center mb-3 shadow-xs">
              <PayoutIcon size={18} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-xs text-[#0F172A] mb-1">Earnings &amp; Payouts</h3>
              <p className="text-[11px] text-slate-500">Track sales earnings, platform commissions, and settlement ledger.</p>
            </div>
            <span className="font-mono text-[10px] font-bold text-[#1B4D3E] uppercase tracking-wider mt-3">View Payouts →</span>
          </Link>
        </div>
      </div>

      {/* Modal: Quick Stock Adjustment */}
      {editingStockItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#E2E8F0] p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="font-sans text-sm font-bold text-[#0F172A]">Update Inventory Stock</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingStockItem.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStockItem(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickStockUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Available Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={stockUpdating}
                  style={{ color: "#ffffff" }}
                  className="flex-1 py-2 rounded bg-[#1B4D3E] hover:bg-[#153e31] !text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50"
                >
                  {stockUpdating ? "Saving..." : "Save Stock"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStockItem(null)}
                  className="px-4 py-2 rounded border border-[#E2E8F0] text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
