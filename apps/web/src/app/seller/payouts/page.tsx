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
      <div className="max-w-3xl mx-auto py-12 space-y-4 animate-pulse font-ui">
        <div className="h-32 bg-floria-sand/70 rounded-3xl w-full border border-floria-border" />
        <div className="h-64 bg-floria-sand/70 rounded-3xl w-full border border-floria-border" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-ui">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">Payout Settlements</h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">Track bank transfers and historical settlements issued for completed nursery marketplace orders.</p>
      </div>

      {/* Info notice about current implementation */}
      <div className="bg-floria-linen rounded-3xl border border-floria-border p-6 space-y-4 shadow-xs">
        <div className="flex gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-800 border border-forest-200/70 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
            <Info size={18} />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif font-bold text-ink-900 text-sm sm:text-base">Payout Settlement Policy</h2>
            <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
              Direct NEFT/RTGS bank transfers are initiated bi-weekly for all verified net earnings. Payout disbursements require a validated bank account on your nursery profile.
            </p>
          </div>
        </div>

        <div className="border-t border-floria-border/70 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
          <div className="bg-floria-soft-sand p-3 rounded-2xl border border-floria-border w-full sm:w-auto">
            <p className="font-bold text-ink-800">Total Net Earnings: <span className="font-serif text-forest-800 text-sm">{earnings ? formatINR(earnings.totalNetEarningsPaise) : "₹0.00"}</span></p>
            <p className="text-[10px] text-ink-400 mt-0.5 font-mono">Verified via server accounting ledger</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-bold text-[10px] uppercase tracking-wider border border-amber-200 shadow-2xs">
            <AlertTriangle size={12} /> Payout processing is not yet available
          </span>
        </div>
      </div>

      {/* Payout History Ledger */}
      <section className="bg-floria-linen rounded-3xl border border-floria-border p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-base sm:text-lg font-bold text-ink-900">Payout Transaction Logs</h2>
        
        {payouts.length === 0 ? (
          <div className="p-8 text-center text-xs font-medium text-ink-500 bg-floria-soft-sand rounded-2xl border border-floria-border space-y-1.5">
            <p>No automated payouts have been generated or settled yet.</p>
            <p className="text-[11px] text-ink-400">
              Backend dependency: Payout automated settlement processor (cron worker) is scheduled for weekly dispatch.
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
