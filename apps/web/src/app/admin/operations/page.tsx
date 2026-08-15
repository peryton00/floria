"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { TruckIcon, AlertIcon } from "@/components/ui/Icons";

export default function AdminOperationsPage() {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOperations() {
      try {
        setLoading(true);
        const [statsRes, ordersRes] = await Promise.all([
          api.getAdminDashboard(),
          api.getAdminOrders(),
        ]);

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }

        if (ordersRes.success && ordersRes.data) {
          setOrders(ordersRes.data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load operations queues");
      } finally {
        setLoading(false);
      }
    }
    loadOperations();
  }, []);

  // Filter queues based on status
  const pickupQueue = orders.filter((o) => ["nursery confirmed", "preparing", "ready_for_pickup"].includes((o.status || "").toLowerCase()));
  const packingQueue = orders.filter((o) => ["ready_for_pickup", "picked_up", "packing"].includes((o.status || "").toLowerCase()));
  const deliveryQueue = orders.filter((o) => ["packing", "out_for_delivery"].includes((o.status || "").toLowerCase()));

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Operations Platform Overview</h1>
          <p className="text-xs text-ink-400 mt-0.5">Real-time visibility into nursery pickups, centralized packing operations, and final mile courier deliveries.</p>
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
            {/* Operational KPI grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Confirmation Queue</p>
                <p className="text-xl font-bold text-ink-900 mt-1">{stats?.orders?.pendingOrders ?? 0} Orders</p>
              </div>
              <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Preparing (Nursery)</p>
                <p className="text-xl font-bold text-ink-900 mt-1">{stats?.orders?.preparingOrders ?? 0} Orders</p>
              </div>
              <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Ready for Pickup</p>
                <p className="text-xl font-bold text-ink-900 mt-1">{stats?.orders?.readyForPickupOrders ?? 0} Orders</p>
              </div>
              <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Packing (Hub)</p>
                <p className="text-xl font-bold text-ink-900 mt-1">{stats?.orders?.outForDeliveryOrders ?? 0} Orders</p>
              </div>
              <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Delivered</p>
                <p className="text-xl font-bold text-forest-700 mt-1">{stats?.orders?.deliveredOrders ?? 0} Orders</p>
              </div>
            </div>

            {/* Queues Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pickup Queue */}
              <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">Pickup Queue</h2>
                  <span className="px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 font-mono text-[10px] font-bold border border-forest-100">
                    {pickupQueue.length} Active
                  </span>
                </div>
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {pickupQueue.length === 0 ? (
                    <p className="text-xs text-ink-450 italic py-4 text-center">No active nursery pickups pending.</p>
                  ) : (
                    pickupQueue.map((o) => (
                      <div key={o.id} className="p-3 border border-ink-100 rounded-xl space-y-1.5 hover:border-ink-200 transition-colors">
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-[10px] font-bold text-ink-900">#{o.id.slice(0, 8).toUpperCase()}</span>
                          <span className="text-[9px] font-bold uppercase text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded-md">{o.status}</span>
                        </div>
                        <p className="text-[11px] text-ink-600 font-semibold truncate">Customer: {o.delivery_address_snapshot?.full_name || "N/A"}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Packing Queue */}
              <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">Packing Queue</h2>
                  <span className="px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 font-mono text-[10px] font-bold border border-forest-100">
                    {packingQueue.length} Active
                  </span>
                </div>
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {packingQueue.length === 0 ? (
                    <p className="text-xs text-ink-450 italic py-4 text-center">No packages in progress at hub.</p>
                  ) : (
                    packingQueue.map((o) => (
                      <div key={o.id} className="p-3 border border-ink-100 rounded-xl space-y-1.5 hover:border-ink-200 transition-colors">
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-[10px] font-bold text-ink-900">#{o.id.slice(0, 8).toUpperCase()}</span>
                          <span className="text-[9px] font-bold uppercase text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded-md">{o.status}</span>
                        </div>
                        <p className="text-[11px] text-ink-600 font-semibold truncate">Customer: {o.delivery_address_snapshot?.full_name || "N/A"}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Delivery Queue */}
              <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">Delivery Queue</h2>
                  <span className="px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 font-mono text-[10px] font-bold border border-forest-100">
                    {deliveryQueue.length} Active
                  </span>
                </div>
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {deliveryQueue.length === 0 ? (
                    <p className="text-xs text-ink-450 italic py-4 text-center">No orders currently out for delivery.</p>
                  ) : (
                    deliveryQueue.map((o) => (
                      <div key={o.id} className="p-3 border border-ink-100 rounded-xl space-y-1.5 hover:border-ink-200 transition-colors">
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-[10px] font-bold text-ink-900">#{o.id.slice(0, 8).toUpperCase()}</span>
                          <span className="text-[9px] font-bold uppercase text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded-md">{o.status}</span>
                        </div>
                        <p className="text-[11px] text-ink-600 font-semibold truncate">Customer: {o.delivery_address_snapshot?.full_name || "N/A"}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
