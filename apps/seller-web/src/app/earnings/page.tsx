"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import {
  PayoutIcon,
  RefreshIcon,
  AlertIcon,
  ArrowRightIcon,
} from "@/components/ui/Icons";

export default function SellerEarningsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSellerEarnings();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(
          res.error?.message || "Failed to load seller ledger earnings.",
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to financial ledger.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  if (loading && !data) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { summary, transactions } = data || { summary: {}, transactions: [] };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Earnings & Financial Ledger
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Track gross sales, platform commissions, settled payouts and account
            balance
          </p>
        </div>

        <button
          type="button"
          onClick={fetchEarnings}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-xs font-bold text-ink-700 transition-colors shadow-xs"
        >
          <RefreshIcon size={14} /> Refresh Ledger
        </button>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-200 rounded-xl text-xs text-error-700 font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchEarnings}
            className="underline uppercase font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Gross Sales
          </div>
          <div className="text-2xl font-serif font-bold text-ink-900">
            {formatINR(
              summary?.grossSalesPaise || summary?.totalSalesPaise || 0,
            )}
          </div>
          <div className="text-[10px] text-ink-500">
            Total customer orders fulfilled
          </div>
        </div>

        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Platform Commission
          </div>
          <div className="text-2xl font-serif font-bold text-ink-900">
            {formatINR(summary?.commissionPaise || 0)}
          </div>
          <div className="text-[10px] text-ink-500">
            Floria service & logistics fee
          </div>
        </div>

        <div className="bg-cream-50 border border-forest-800/30 rounded-2xl p-5 shadow-xs space-y-2 bg-forest-50/20">
          <div className="text-[11px] font-bold uppercase tracking-wider text-forest-800">
            Net Payable Balance
          </div>
          <div className="text-2xl font-serif font-bold text-forest-900">
            {formatINR(summary?.netEarningsPaise || summary?.payablePaise || 0)}
          </div>
          <div className="text-[10px] text-forest-700 font-semibold">
            Available for bank payout
          </div>
        </div>
      </div>

      {/* Transactions / Ledger Table */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-cream-300">
          <h2 className="font-serif text-base font-bold text-ink-900">
            Financial Ledger Entries
          </h2>
        </div>

        {transactions && transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-200/70 border-b border-cream-300 text-ink-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Transaction / Date</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {transactions.map((tx: any) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-cream-100/60 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-ink-900">
                        {tx.description || "Order Settlement"}
                      </div>
                      <div className="text-[11px] text-ink-500">
                        {formatDate(tx.created_at)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tx.type === "credit" || tx.amount_paise > 0
                            ? "bg-forest-100 text-forest-800"
                            : "bg-terracotta-100 text-terracotta-800"
                        }`}
                      >
                        {tx.type || (tx.amount_paise > 0 ? "Credit" : "Debit")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-ink-500">
                      {tx.reference_id || tx.order_id
                        ? `#${String(tx.reference_id || tx.order_id).substring(0, 8)}`
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-ink-900">
                      {formatINR(Math.abs(tx.amount_paise || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 text-xs text-ink-500">
            No ledger transactions recorded yet. Completed orders and payouts
            will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
