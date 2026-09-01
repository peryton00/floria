"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { LineChart, DonutChart } from "@/components/admin/SvgCharts";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { AdminDashboardSkeleton } from "@/components/ui/loading";
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
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [pendingSellers, setPendingSellers] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>("30d");
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await Promise.allSettled([
        api.getAdminDashboard(),
        api.getAdminOrders(),
        api.getAdminAnalytics({ range: dateRange }),
        api.getAdminSellers(),
      ]);

      const [dashSettled, ordersSettled, analSettled, sellersSettled] = results;

      if (dashSettled.status === "fulfilled" && dashSettled.value?.success && dashSettled.value?.data) {
        setStats(dashSettled.value.data);
      } else if (dashSettled.status === "fulfilled" && dashSettled.value?.error?.message) {
        setError(dashSettled.value.error.message);
      }

      if (ordersSettled.status === "fulfilled" && ordersSettled.value?.success && ordersSettled.value?.data) {
        setRecentOrders(ordersSettled.value.data.slice(0, 5));
      }

      if (analSettled.status === "fulfilled" && analSettled.value?.success && analSettled.value?.data) {
        setAnalytics(analSettled.value.data);
      }

      if (sellersSettled.status === "fulfilled" && sellersSettled.value?.success && Array.isArray(sellersSettled.value?.data)) {
        const pending = sellersSettled.value.data.filter(
          (s: any) =>
            s.status === "under_review" ||
            s.status === "pending" ||
            s.status === "application_submitted" ||
            s.status === "needs_correction",
        );
        setPendingSellers(pending);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const handleQuickApprove = async (sellerId: string) => {
    try {
      setApprovingId(sellerId);
      const res = await api.approveSeller(sellerId);
      if (res.success) {
        await fetchDashboardData();
      }
    } catch {
      // Handled
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <AdminDashboardSkeleton />
      </AdminShell>
    );
  }

  // Transform timeSeries data for SvgCharts
  const lineChartData = (analytics?.timeSeries || []).map((pt: any) => ({
    label: pt.label,
    value: Math.round(pt.gmv / 100), // convert paise to INR
  }));

  const donutChartData = [
    { label: "Delivered", value: stats?.orders?.deliveredOrders ?? 0, color: "#15803d" },
    { label: "Pending", value: stats?.orders?.pendingOrders ?? 0, color: "#eab308" },
    { label: "Fulfillment", value: (stats?.orders?.preparingOrders ?? 0) + (stats?.orders?.readyForPickupOrders ?? 0) + (stats?.orders?.outForDeliveryOrders ?? 0), color: "#3b82f6" },
    { label: "Cancelled", value: stats?.orders?.cancelledOrders ?? 0, color: "#ef4444" },
  ];

  const statCards = [
    { label: "Total Customers", value: stats?.users?.totalCustomers ?? 0, icon: <UserGroupIcon size={20} />, color: "bg-forest-50 text-forest-700" },
    { label: "Active Sellers", value: stats?.users?.approvedSellers ?? 0, icon: <LeafIcon size={20} />, color: "bg-forest-50 text-forest-700" },
    { label: "Pending Applications", value: stats?.users?.pendingSellerApplications ?? 0, icon: <AlertIcon size={20} />, color: "bg-warning-50 text-warning-700" },
    { label: "Total Products", value: stats?.products?.totalProducts ?? 0, icon: <GridIcon size={20} />, color: "bg-forest-50 text-forest-700" },
    { label: "Out of Stock", value: stats?.products?.outOfStockProducts ?? 0, icon: <AlertIcon size={20} />, color: "bg-error-50 text-error-700" },
    { label: "Total Master Orders", value: stats?.orders?.totalOrders ?? 0, icon: <OrderIcon size={20} />, color: "bg-forest-50 text-forest-700" },
    { label: "Gross Merchandise Value", value: formatINR(stats?.platform?.totalOrderValue ?? 0), icon: <PayoutIcon size={20} />, color: "bg-forest-50 text-forest-700" },
    { label: "Net Platform Revenue", value: formatINR(stats?.platform?.platformRevenue ?? 0), icon: <PayoutIcon size={20} />, color: "bg-success-50 text-success-700" },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Title and date selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Executive Command Center</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Real-time platform telemetry, nationwide nursery distribution, and GMV oversight.</p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] p-1 shadow-xs">
            {["7d", "30d", "90d", "12m"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={[
                  "px-3 py-1 rounded text-[11px] font-mono font-bold uppercase tracking-wider transition-all",
                  dateRange === r
                    ? "bg-[#1B4D3E] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-200/60",
                ].join(" ")}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded border border-[#E2E8F0] p-4 h-24" />
            ))}
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, idx) => (
                <div key={idx} className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs hover:border-slate-400 transition-all flex items-start justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{stat.label}</p>
                    <p className="font-mono text-xl font-bold text-[#0F172A] mt-1.5 tracking-tight truncate">{stat.value}</p>
                  </div>
                  <div className={`w-9 h-9 rounded ${stat.color} flex items-center justify-center flex-shrink-0 shadow-xs`}>
                    {stat.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales Trend Line Chart */}
              <div className="lg:col-span-2 bg-white rounded border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div>
                    <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-[#0F172A]">Gross Merchandise Value (GMV)</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Aggregated transactional value over the active {dateRange} timeframe.</p>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
                    Live Stream
                  </span>
                </div>
                <div className="pt-6">
                  <LineChart
                    data={lineChartData}
                    height={210}
                    strokeColor="#1B4D3E"
                    valueFormatter={(val) => `₹${val.toLocaleString()}`}
                  />
                </div>
              </div>

              {/* Order Status Donut Chart */}
              <div className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between">
                <div className="border-b border-[#E2E8F0] pb-3">
                  <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-[#0F172A]">Fulfillment Pipeline</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Live distribution of orders across lifecycle states.</p>
                </div>
                <div className="pt-6 flex-1 flex items-center justify-center">
                  <DonutChart data={donutChartData} size={160} />
                </div>
              </div>
            </div>

            {/* Nursery Partner Applications Awaiting Approval Section */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-[#0F172A]">
                    Nursery Applications Awaiting Approval
                  </h2>
                  <span className="font-mono text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                    {pendingSellers.length} Pending Action
                  </span>
                </div>
                <Link href="/admin/sellers" className="font-sans text-xs text-[#1B4D3E] font-bold hover:underline flex items-center gap-1">
                  Manage All Nurseries →
                </Link>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
                {pendingSellers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No pending nursery applications awaiting review. All partner accounts are active or up to date.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-mono text-[11px] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                          <th className="p-3.5">Seller ID & Username</th>
                          <th className="p-3.5">Nursery / Business Name</th>
                          <th className="p-3.5">Contact Email & Phone</th>
                          <th className="p-3.5">Location</th>
                          <th className="p-3.5">GSTIN</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Approval Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {pendingSellers.map((seller) => (
                          <tr key={seller.id} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="p-3.5">
                              <span className="font-mono font-bold text-[#0F172A] block">
                                {seller.public_seller_id || `FLR-SLR-${seller.id.slice(0, 6).toUpperCase()}`}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500">
                                @{seller.username || "nursery"}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-[#1A2E22]">
                              {seller.business_name}
                            </td>
                            <td className="p-3.5 text-slate-600">
                              <div className="font-mono text-xs">{seller.contact_email}</div>
                              <div className="font-mono text-[10px] text-slate-500">{seller.contact_phone || "—"}</div>
                            </td>
                            <td className="p-3.5 text-slate-700">
                              {seller.city || "—"}, {seller.state || "—"}
                            </td>
                            <td className="p-3.5 font-mono text-xs font-semibold text-[#2D5A3C]">
                              {seller.gst_number || <span className="text-slate-400 font-normal">N/A</span>}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                                {seller.status || "under_review"}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={approvingId === seller.id}
                                  onClick={() => handleQuickApprove(seller.id)}
                                  className="px-3 py-1.5 bg-[#2D5A3C] hover:bg-[#1E4D2B] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs transition-colors disabled:opacity-50"
                                >
                                  {approvingId === seller.id ? "Approving..." : "Approve"}
                                </button>
                                <Link
                                  href="/admin/sellers"
                                  className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EAF2EC] text-[#2D5A3C] font-bold text-xs uppercase tracking-wider rounded-lg border border-[#D0E2D4] transition-colors"
                                >
                                  Review
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Master Orders */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-[#0F172A]">Live Master Order Stream</h2>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded border border-[#E2E8F0]">
                    Top 5 Recent
                  </span>
                </div>
                <Link href="/admin/orders" className="font-sans text-xs text-[#1B4D3E] font-bold hover:underline flex items-center gap-1">
                  View Full Orders Ledger →
                </Link>
              </div>

              <div className="bg-white rounded border border-[#E2E8F0] shadow-xs overflow-hidden">
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No master orders found in backend database.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-mono text-[11px] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                          <th className="p-3.5">Master Order ID</th>
                          <th className="p-3.5">Customer</th>
                          <th className="p-3.5">Line Items</th>
                          <th className="p-3.5">Fulfillment Status</th>
                          <th className="p-3.5 text-right">Frozen Snapshot Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="p-3.5 font-mono font-bold text-[#0F172A]">{order.id}</td>
                            <td className="p-3.5 font-semibold text-slate-700">
                              {order.delivery_address_snapshot?.full_name || "Customer"}
                            </td>
                            <td className="p-3.5 font-mono text-slate-500">{order.order_items?.length || 0} item(s)</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-[#1B4D3E] border border-emerald-200">
                                {order.status}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono font-bold text-emerald-800 text-right text-sm">
                              {formatINR(order.total_paise || order.subtotal_paise || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
