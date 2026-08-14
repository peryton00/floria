"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import {
  GridIcon,
  OrderIcon,
  UserGroupIcon,
  PayoutIcon,
  LeafIcon,
  AlertIcon,
} from "@/components/ui/Icons";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashRes, ordersRes] = await Promise.all([
          api.getAdminDashboard(),
          api.getAdminOrders(),
        ]);

        if (dashRes.success && dashRes.data) {
          setStats(dashRes.data);
        } else {
          setError(dashRes.error?.message || "Failed to load dashboard metrics");
        }

        if (ordersRes.success && ordersRes.data) {
          setRecentOrders(ordersRes.data.slice(0, 5));
        }
      } catch (err: any) {
        setError(err.message || "Failed to connect to backend API");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const statCards = [
    { label: "Total Customers", value: stats?.users?.totalCustomers ?? 0, icon: <UserGroupIcon size={20} />, color: "bg-forest-50 text-forest-700" },
    { label: "Active Sellers", value: stats?.users?.approvedSellers ?? 0, icon: <LeafIcon size={20} />, color: "bg-forest-50 text-forest-700" },
    { label: "Pending Seller Applications", value: stats?.users?.pendingSellerApplications ?? 0, icon: <AlertIcon size={20} />, color: "bg-warning-50 text-warning-700" },
    { label: "Total Products", value: stats?.products?.totalProducts ?? 0, icon: <GridIcon size={20} />, color: "bg-forest-50 text-forest-700" },
    { label: "Out of Stock Products", value: stats?.products?.outOfStockProducts ?? 0, icon: <AlertIcon size={20} />, color: "bg-error-50 text-error-700" },
    { label: "Total Master Orders", value: stats?.orders?.totalOrders ?? 0, icon: <OrderIcon size={20} />, color: "bg-forest-50 text-forest-700" },
    { label: "Gross Merchandise Value", value: formatINR(stats?.platform?.totalOrderValue ?? 0), icon: <PayoutIcon size={20} />, color: "bg-forest-50 text-forest-700" },
    { label: "Total Plant Units Sold", value: stats?.platform?.totalItemsSold ?? 0, icon: <LeafIcon size={20} />, color: "bg-forest-50 text-forest-700" },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Admin Control Dashboard</h1>
          <p className="text-xs text-ink-400 mt-0.5">Real-time marketplace metrics and platform oversight.</p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-ink-100 p-5 shadow-sm flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${stat.color} flex items-center justify-center flex-shrink-0`}>
                    {stat.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400 truncate">{stat.label}</p>
                    <p className="text-lg font-bold text-ink-900 mt-0.5 leading-tight truncate">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Master Orders */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-widest text-ink-900">Recent Master Orders</h2>
                <Link href="/admin/orders" className="text-xs text-forest-700 font-bold hover:text-forest-900">
                  View All Orders →
                </Link>
              </div>

              <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-ink-400">No master orders found in backend database.</div>
                ) : (
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Items</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-cream-50/50">
                          <td className="p-4 font-mono font-bold text-ink-900">{order.id}</td>
                          <td className="p-4 font-semibold text-ink-700">
                            {order.delivery_address_snapshot?.full_name || "Customer"}
                          </td>
                          <td className="p-4 text-ink-500">{order.order_items?.length || 0} item(s)</td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-forest-50 text-forest-700 border border-forest-100">
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-forest-800 text-right">{formatINR(order.total_paise || order.subtotal_paise || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
