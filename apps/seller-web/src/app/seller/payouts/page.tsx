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
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Payout Settlements & Disbursements</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Track bank transfers and historical settlements issued for completed nursery marketplace orders.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-1">
            Settlement Ledger
          </span>
        </div>
      </div>

      {/* Info Notice about Settlement Policy */}
      <div className="bg-white rounded border border-[#E2E8F0] p-5 space-y-4 shadow-xs">
        <div className="flex gap-3.5 items-start">
          <div className="w-8 h-8 rounded bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
            <Info size={16} />
          </div>
          <div className="space-y-1">
            <h2 className="font-sans font-bold text-sm text-[#0F172A]">Payout Settlement Policy</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct NEFT/RTGS bank transfers are initiated bi-weekly for all verified net earnings. Payout disbursements require a validated bank account on your nursery profile.
            </p>
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
          <div className="bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0] w-full sm:w-auto">
            <p className="font-bold text-slate-700">Total Net Earnings: <span className="font-mono text-[#1B4D3E] font-bold text-sm">{earnings ? formatINR(earnings.totalNetEarningsPaise) : "₹0.00"}</span></p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Verified via server accounting ledger</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={11} /> Automated Settlement Engine Scheduled
          </span>
        </div>
      </div>

      {/* Payout History Ledger */}
      <div className="bg-white rounded border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <h2 className="font-sans text-sm font-bold text-[#0F172A]">Payout Transaction Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">Disbursement ledger records and electronic fund transfer reference IDs.</p>
        </div>
        
        {payouts.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-slate-500 space-y-1">
            <p>No automated payouts have been generated or settled yet.</p>
            <p className="text-[11px] text-slate-400 font-mono">
              Automated settlement processor (cron worker) is scheduled for weekly dispatch.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Future scale table */}
          </div>
        )}
      </div>
    </div>
  );
}

