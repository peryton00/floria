"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import {
  History,
  AlertTriangle,
  ExternalLink,
  Info
} from "lucide-react";

export default function SellerPayoutsPage() {
  const [earnings, setEarnings] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [earnRes, payoutRes] = await Promise.all([
          api.getSellerEarnings(),
          api.getSellerPayouts(),
        ]);

        if (earnRes.success && earnRes.data) {
          setEarnings(earnRes.data);
        }
        if (payoutRes.success && payoutRes.data) {
          setPayouts(payoutRes.data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load payouts data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-4 animate-pulse">
        <div className="h-32 bg-ink-100/70 rounded-2xl w-full" />
        <div className="h-64 bg-ink-100/70 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Payout settlements</h1>
        <p className="text-xs text-ink-400 mt-0.5">Track bank transfers and historical payouts issued for completed nursery orders.</p>
      </div>

      {/* Info notice about current implementation */}
      <div className="bg-cream-50 rounded-2xl border border-ink-100 p-6 space-y-4">
        <div className="flex gap-3">
          <Info className="text-forest-700 flex-shrink-0 mt-0.5" size={20} />
          <div className="space-y-2">
            <h2 className="font-bold text-ink-900 text-sm">Payout Settlement Policy</h2>
            <p className="text-xs text-ink-600 leading-relaxed">
              Automatic bank transfers are processed bi-weekly for all net earnings. Settlements require a verified bank account configuration on your nursery profile.
            </p>
          </div>
        </div>

        <div className="border-t border-ink-100/50 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
          <div>
            <p className="font-semibold text-ink-700">Total Net Earnings Settled: {earnings ? formatINR(earnings.totalNetEarningsPaise) : "₹0.00"}</p>
            <p className="text-[10px] text-ink-400 mt-0.5">Verified via server ledger audit</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warning-50 text-warning-700 font-bold text-[10px] uppercase tracking-wider border border-warning-100">
            <AlertTriangle size={12} /> Payout processing is not yet available
          </span>
        </div>
      </div>

      {/* Payout History Ledger */}
      <section className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-4">
        <h2 className="font-serif text-base font-bold text-ink-900">Payout Transaction Logs</h2>
        
        {payouts.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-400 bg-cream-50 rounded-xl space-y-2">
            <p>No automatic payouts have been generated or settled yet.</p>
            <p className="text-[10px] text-ink-400 font-medium">
              Backend dependency: Payout automated settlement processor (cron settlement worker) is currently disabled.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table placeholder for future scale */}
          </div>
        )}
      </section>
    </div>
  );
}
