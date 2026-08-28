"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, type SellerDashboardData } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { StockStatusBadge } from "@/components/seller/StockStatusBadge";
import { useToast } from "@/lib/contexts/ToastContext";
import { SellerDashboardSkeleton } from "@/components/ui/loading";
import {
  GridIcon,
  OrderIcon,
  PackageIcon,
  InventoryIcon,
  PayoutIcon,
  AlertIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlusIcon,
  ClockIcon,
  TruckIcon,
} from "@/components/ui/Icons";

export default function SellerDashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<SellerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Stock Adjustment State
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
        setError(
          res.error?.message || "Failed to load seller dashboard metrics",
        );
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
        toast.success(
          "Stock updated",
          `Inventory for '${editingStockItem.name}' updated.`,
        );
        setEditingStockItem(null);
        await fetchDashboard();
      } else {
        toast.error(
          "Stock update failed",
          res.error?.message || "Failed to update stock quantity",
        );
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
        <h1 className="font-serif text-xl font-bold text-ink-900">
          Dashboard Unavailable
        </h1>
        <p className="text-xs text-ink-500 max-w-sm mx-auto">
          {error || "Could not retrieve live dashboard metrics from API."}
        </p>
        <button
          type="button"
          onClick={fetchDashboard}
          className="px-5 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { profile, kpis, recentOrders, inventoryAlerts, actionRequired } = data;
  const pendingOrdersCount =
    (kpis?.newOrders || 0) + (kpis?.preparingOrders || 0);

  return (
    <div className="space-y-8">
      {/* Header Profile Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Nursery Cockpit
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Real-time fulfillment, inventory & revenue metrics for{" "}
            <span className="font-semibold text-ink-800">
              {profile?.business_name || "Nursery Partner"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
          >
            <PlusIcon size={16} /> Add Plant
          </Link>
        </div>
      </div>

      {/* Action Required Banner if Any */}
      {actionRequired && actionRequired.length > 0 && (
        <div className="bg-terracotta-50 border border-terracotta-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta-700 text-white flex items-center justify-center shrink-0">
              <ClockIcon size={20} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-terracotta-900">
                {actionRequired[0].title ||
                  "Orders Awaiting Nursery Confirmation"}{" "}
                ({actionRequired[0].count})
              </div>
              <div className="text-xs text-terracotta-700">
                Confirm stock & prepare botanical packages for courier pickup.
              </div>
            </div>
          </div>
          <Link
            href="/orders"
            className="px-4 py-2 bg-terracotta-700 hover:bg-terracotta-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shrink-0"
          >
            Fulfill Orders →
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-ink-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Sales
            </span>
            <div className="p-2 rounded-xl bg-cream-200 text-forest-800">
              <PayoutIcon size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-ink-900">
              {formatINR(kpis?.totalRevenuePaise || 0)}
            </div>
            <div className="text-[10px] font-semibold text-ink-500 mt-0.5">
              Gross fulfilled volume
            </div>
          </div>
        </div>

        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-ink-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Orders to Fulfill
            </span>
            <div className="p-2 rounded-xl bg-cream-200 text-terracotta-700">
              <OrderIcon size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-ink-900">
              {pendingOrdersCount}
            </div>
            <div className="text-[10px] font-semibold text-ink-500 mt-0.5">
              {kpis?.totalOrders || 0} lifetime orders
            </div>
          </div>
        </div>

        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-ink-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Active Catalog
            </span>
            <div className="p-2 rounded-xl bg-cream-200 text-forest-800">
              <PackageIcon size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-ink-900">
              {kpis?.publishedProducts || kpis?.totalProducts || 0}
            </div>
            <div className="text-[10px] font-semibold text-ink-500 mt-0.5">
              Plant listings active in shop
            </div>
          </div>
        </div>

        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-ink-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className="p-2 rounded-xl bg-cream-200 text-warning-700">
              <InventoryIcon size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-ink-900">
              {inventoryAlerts?.length || 0}
            </div>
            <div className="text-[10px] font-semibold text-ink-500 mt-0.5">
              Items at or below threshold
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Orders & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Card */}
        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-ink-900">
              Recent Customer Orders
            </h2>
            <Link
              href="/orders"
              className="text-xs font-bold text-forest-800 hover:text-forest-900 uppercase tracking-wider flex items-center gap-1"
            >
              View All <ArrowRightIcon size={14} />
            </Link>
          </div>

          {recentOrders && recentOrders.length > 0 ? (
            <div className="divide-y divide-cream-300">
              {recentOrders.slice(0, 5).map((ord: any, index: number) => {
                const orderId = ord.order_id || ord.id || `ORD-${index + 1}`;
                const shortId = typeof orderId === "string" ? orderId.substring(0, 8) : String(orderId);

                return (
                  <div
                    key={ord.id || ord.order_id || index}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-ink-900">
                        Order #{shortId}
                      </div>
                      <div className="text-[11px] text-ink-500">
                        {ord.customer_name || "Customer"} •{" "}
                        {formatINR(ord.subtotal_paise || ord.total_paise || 0)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cream-200 text-ink-700">
                        {ord.status}
                      </span>
                      <Link
                        href={`/orders/${orderId}`}
                        className="p-1.5 hover:bg-cream-200 rounded-lg text-forest-800"
                      >
                        <ArrowRightIcon size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-ink-500 text-xs">
              No orders received yet. Once customers order your plants, they
              will appear here.
            </div>
          )}
        </div>

        {/* Inventory Stock Alerts Card */}
        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-ink-900">
              Stock & Availability Alerts
            </h2>
            <Link
              href="/inventory"
              className="text-xs font-bold text-forest-800 hover:text-forest-900 uppercase tracking-wider flex items-center gap-1"
            >
              Manage Stock <ArrowRightIcon size={14} />
            </Link>
          </div>

          {inventoryAlerts && inventoryAlerts.length > 0 ? (
            <div className="divide-y divide-cream-300">
              {inventoryAlerts.slice(0, 5).map((item: any) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-ink-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-ink-500">
                      Stock: {item.stockQuantity ?? item.stock_quantity ?? 0}{" "}
                      units
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StockStatusBadge
                      quantity={item.stockQuantity ?? item.stock_quantity ?? 0}
                      lowStockThreshold={
                        item.lowStockThreshold ?? item.low_stock_threshold ?? 5
                      }
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStockItem(item);
                        setNewStockQty(
                          item.stockQuantity ?? item.stock_quantity ?? 0,
                        );
                      }}
                      className="px-2.5 py-1 bg-cream-200 hover:bg-forest-800 hover:text-white rounded-lg text-[11px] font-bold text-ink-700 transition-colors"
                    >
                      Adjust
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-ink-500 text-xs">
              All plant inventory levels are healthy!
            </div>
          )}
        </div>
      </div>

      {/* Quick Stock Modal */}
      {editingStockItem && (
        <div className="fixed inset-0 bg-ink-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 max-w-sm w-full shadow-lg space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink-900">
              Adjust Stock: {editingStockItem.name}
            </h3>
            <form onSubmit={handleQuickStockUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  New Quantity Available
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockQty}
                  onChange={(e) =>
                    setNewStockQty(parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full px-3 py-2 bg-cream-100 border border-cream-300 rounded-xl text-sm font-bold text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStockItem(null)}
                  className="flex-1 py-2 bg-cream-200 hover:bg-cream-300 text-ink-700 font-bold text-xs uppercase tracking-wider rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockUpdating}
                  className="flex-1 py-2 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50"
                >
                  {stockUpdating ? "Saving..." : "Save Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
