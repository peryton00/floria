"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { OperationsShell } from "@/components/operations/OperationsShell";
import { api } from "@/lib/api";
import {
  GridIcon,
  OrderIcon,
  LeafIcon,
  CheckIcon,
} from "@/components/ui/Icons";

export default function OperationsDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.getOperationsDashboard();
        if (res.success && res.data) {
          setStats(res.data);
        } else {
          setError(res.error?.message || "Failed to load operational metrics");
        }
      } catch (err: any) {
        setError(err.message || "Failed to connect to backend API");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const opCards = [
    { label: "Orders Awaiting Pickup", value: stats?.pendingPickup ?? 0, icon: <LeafIcon size={20} />, href: "/operations/pickups", color: "bg-warning-50 text-warning-700 border-warning-100" },
    { label: "Packing Queue", value: stats?.packing ?? 0, icon: <GridIcon size={20} />, href: "/operations/packing", color: "bg-forest-50 text-forest-700 border-forest-100" },
    { label: "Out for Delivery", value: stats?.outForDelivery ?? 0, icon: <OrderIcon size={20} />, href: "/operations/deliveries", color: "bg-forest-50 text-forest-700 border-forest-100" },
    { label: "Delivered Today", value: stats?.delivered ?? 0, icon: <CheckIcon size={20} />, href: "/operations/deliveries", color: "bg-success-50 text-success-700 border-success-100" },
  ];

  return (
    <OperationsShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Operational Control Center</h1>
          <p className="text-xs text-ink-400 mt-0.5">Real-time fulfillment metrics, nursery pickups, packing tasks, and courier dispatch.</p>
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
            {/* Operational Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {opCards.map((card, idx) => (
                <Link key={idx} href={card.href} className="bg-white rounded-xl border border-ink-100 p-5 shadow-sm hover:border-forest-400 transition-colors flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400 truncate">{card.label}</p>
                    <p className="text-2xl font-serif font-bold text-ink-900 mt-0.5 leading-tight">{card.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full ${card.color} border flex items-center justify-center flex-shrink-0`}>
                    {card.icon}
                  </div>
                </Link>
              ))}
            </div>

            {/* Quick Action Operations Tasks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <LeafIcon size={18} className="text-forest-700" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">1. Nursery Pickups</h2>
                </div>
                <p className="text-xs text-ink-500">Collect confirmed items from partner nurseries across Raipur & Bhilai.</p>
                <Link
                  href="/operations/pickups"
                  className="inline-block w-full text-center py-2 rounded-lg bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Open Pickup Queue →
                </Link>
              </div>

              <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <GridIcon size={18} className="text-forest-700" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">2. Hub Packing</h2>
                </div>
                <p className="text-xs text-ink-500">Verify item quantities, inspect plant health, and package multi-nursery orders.</p>
                <Link
                  href="/operations/packing"
                  className="inline-block w-full text-center py-2 rounded-lg bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Open Packing Tasks →
                </Link>
              </div>

              <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <OrderIcon size={18} className="text-forest-700" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">3. Last-Mile Delivery</h2>
                </div>
                <p className="text-xs text-ink-500">Assign courier partners, dispatch shipments, and log recipient delivery confirmations.</p>
                <Link
                  href="/operations/deliveries"
                  className="inline-block w-full text-center py-2 rounded-lg bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Open Delivery Board →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </OperationsShell>
  );
}
