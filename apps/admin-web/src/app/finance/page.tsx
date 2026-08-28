"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { useToast } from "@/lib/contexts/ToastContext";
import { FinanceIcon, RefreshIcon } from "@/components/ui/Icons";

export default function AdminFinancePage() {
  const { toast } = useToast();
  const [financeData, setFinanceData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminTransactions();
      if (res.success && res.data) {
        setFinanceData(res.data);
      } else {
        setError(res.error?.message || "Failed to load financial records.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to finance ledger.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinance();
  }, [fetchFinance]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Marketplace Financial Ledger
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Cashfree gateway reconciliation, platform commission retention, and
            nursery payout balances
          </p>
        </div>

        <button
          type="button"
          onClick={fetchFinance}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-xs font-bold text-ink-700 transition-colors shadow-xs"
        >
          <RefreshIcon size={14} /> Refresh Ledger
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Gross Processed Volume
          </div>
          <div className="text-2xl font-serif font-bold text-ink-900">
            {formatINR(
              financeData?.grossVolumePaise || financeData?.totalGmvPaise || 0,
            )}
          </div>
          <div className="text-[10px] text-ink-500">
            Customer payments captured
          </div>
        </div>

        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Platform Revenue (Commissions)
          </div>
          <div className="text-2xl font-serif font-bold text-forest-900">
            {formatINR(
              financeData?.platformCommissionPaise ||
                financeData?.totalCommissionPaise ||
                0,
            )}
          </div>
          <div className="text-[10px] text-ink-500">10% standard take rate</div>
        </div>

        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Nursery Payable Balance
          </div>
          <div className="text-2xl font-serif font-bold text-ink-900">
            {formatINR(
              financeData?.sellerPayablePaise ||
                financeData?.netPayablePaise ||
                0,
            )}
          </div>
          <div className="text-[10px] text-ink-500">
            Pending seller payout settlements
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-cream-300 font-serif font-bold text-base text-ink-900">
          Financial Ledger Records
        </div>

        {financeData?.transactions && financeData.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-200/70 border-b border-cream-300 text-ink-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Transaction ID</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {financeData.transactions.map((t: any) => (
                  <tr
                    key={t.id}
                    className="hover:bg-cream-100/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-ink-900">
                      {t.id ? `${String(t.id).substring(0, 8)}...` : "—"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-ink-800 uppercase">
                      {t.type || "CAPTURE"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-ink-900">
                      {formatINR(t.amount_paise || t.amountPaise || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-ink-500">
                      {formatDate(t.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 text-xs text-ink-500">
            No financial ledger entries recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
