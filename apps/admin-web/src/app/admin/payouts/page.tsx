"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { useToast } from "@/lib/contexts/ToastContext";
import { SearchIcon, PayoutIcon, CloseIcon } from "@/components/ui/Icons";

export interface TransactionRecord {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentReference: string;
  cfOrderId?: string | null;
  cfPaymentId?: string | null;
  paymentSessionId?: string | null;
  provider: string;
  currency: string;
  amountPaise: number;
  status: "paid" | "pending" | "failed" | "refunded" | "partially_refunded" | string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPayoutsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"transactions" | "nursery_payouts">("transactions");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Refund Modal State
  const [refundModalItem, setRefundModalItem] = useState<TransactionRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("");
  const [isRefunding, setIsRefunding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [txRes, sellersRes] = await Promise.all([
        api.getAdminTransactions({ status: statusFilter, search: searchQuery }),
        api.getAdminSellers(),
      ]);

      if (txRes.success && txRes.data) {
        setTransactions(txRes.data);
      } else {
        setError(txRes.error?.message || "Failed to load transactions.");
      }

      if (sellersRes.success && sellersRes.data) {
        setSellers(sellersRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate Metrics
  const totalCount = transactions.length;
  const totalVolumePaise = transactions.reduce((sum, t) => sum + (t.amountPaise || 0), 0);
  const paidCount = transactions.filter((t) => t.status === "paid" || t.status === "success").length;
  const paidVolumePaise = transactions
    .filter((t) => t.status === "paid" || t.status === "success")
    .reduce((sum, t) => sum + (t.amountPaise || 0), 0);
  const pendingCount = transactions.filter((t) => t.status === "pending").length;

  // Handle Refund Submission
  const handleInitiateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalItem) return;

    const parsedAmountPaise = Math.round(parseFloat(refundAmount) * 100);
    if (isNaN(parsedAmountPaise) || parsedAmountPaise <= 0 || parsedAmountPaise > refundModalItem.amountPaise) {
      toast.error("Invalid Amount", "Refund amount must be greater than ₹0 and cannot exceed total paid amount.");
      return;
    }

    try {
      setIsRefunding(true);
      const res = await api.requestRefund(refundModalItem.id, parsedAmountPaise, refundReason || "Admin manual refund");
      if (res.success) {
        toast.success("Refund Processed", `Refund of ${formatINR(parsedAmountPaise)} initiated successfully.`);
        setRefundModalItem(null);
        setRefundAmount("");
        setRefundReason("");
        await loadData();
      } else {
        toast.error("Refund Failed", res.error?.message || "Payment provider declined refund request.");
      }
    } catch (err: any) {
      toast.error("Refund Error", err.message || "An error occurred while communicating with backend.");
    } finally {
      setIsRefunding(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const st = (status || "").toLowerCase();
    if (st === "paid" || st === "success") {
      return <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">PAID</span>;
    }
    if (st === "pending") {
      return <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">PENDING</span>;
    }
    if (st === "failed") {
      return <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded">FAILED</span>;
    }
    if (st.includes("refund")) {
      return <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">REFUNDED</span>;
    }
    return <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{st.toUpperCase()}</span>;
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Payments & Seller Payouts Ledger</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Audit Cashfree payment transactions, inspect order IDs, and monitor nursery balance disbursements.</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("transactions")}
              className={`px-3.5 py-1.5 font-mono text-xs font-bold rounded border transition-colors ${
                activeTab === "transactions"
                  ? "bg-[#1B4D3E] text-white border-[#1B4D3E]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Transactions Log
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("nursery_payouts")}
              className={`px-3.5 py-1.5 font-mono text-xs font-bold rounded border transition-colors ${
                activeTab === "nursery_payouts"
                  ? "bg-[#1B4D3E] text-white border-[#1B4D3E]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Nursery Payouts
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Transactions</p>
            <p className="font-mono text-2xl font-bold text-[#0F172A] mt-1">{totalCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Logged payment attempts</p>
          </div>

          <div className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Gross Transaction Volume</p>
            <p className="font-mono text-2xl font-bold text-[#0F172A] mt-1">{formatINR(totalVolumePaise)}</p>
            <p className="text-[11px] text-slate-500 mt-1">Total transaction value</p>
          </div>

          <div className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Successful Settlements</p>
            <p className="font-mono text-2xl font-bold text-emerald-700 mt-1">{formatINR(paidVolumePaise)}</p>
            <p className="text-[11px] text-slate-500 mt-1">{paidCount} cleared payments</p>
          </div>

          <div className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending / Processing</p>
            <p className="font-mono text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting status verification</p>
          </div>
        </div>

        {/* TAB 1: TRANSACTIONS LOG */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs space-y-4">
            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              <div className="relative flex-1 max-w-md">
                <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Payment ID, Order ID, or Customer Email..."
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] bg-[#F8FAFC]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 font-mono">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-mono rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid / Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="border border-[#E2E8F0] rounded overflow-hidden">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <div className="w-8 h-8 border-2 border-[#1B4D3E] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No payment transactions matched the current filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] text-slate-600 font-mono text-[11px] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                        <th className="p-3">Transaction / Ref ID</th>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Date & Time</th>
                        <th className="p-3">Gateway</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="p-3 font-mono text-[11px] font-bold text-[#0F172A]">
                            <div>{tx.paymentReference}</div>
                            {tx.cfPaymentId && (
                              <div className="text-[10px] text-slate-400 font-normal">CF: {tx.cfPaymentId}</div>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            <Link href={`/admin/orders/${tx.orderId}`} className="text-[#1B4D3E] font-bold hover:underline">
                              {tx.orderId}
                            </Link>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-[#0F172A]">{tx.customerName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{tx.customerEmail}</div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-600">
                            {new Date(tx.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 uppercase">
                              {tx.provider || "Cashfree"}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-[#0F172A]">
                            {formatINR(tx.amountPaise)}
                          </td>
                          <td className="p-3">{getStatusBadge(tx.status)}</td>
                          <td className="p-3 text-center">
                            {(tx.status === "paid" || tx.status === "success") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRefundModalItem(tx);
                                  setRefundAmount(String((tx.amountPaise / 100).toFixed(2)));
                                }}
                                className="px-2.5 py-1 text-[10px] font-mono font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition-colors"
                              >
                                Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: NURSERY PAYOUTS LEDGER */}
        {activeTab === "nursery_payouts" && (
          <div className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs space-y-4">
            <div>
              <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-[#0F172A]">Partner Nursery Disbursal Ledger</h2>
              <p className="text-xs text-slate-500 mt-0.5">Calculated net nursery earnings (Customer Price minus Platform Commission).</p>
            </div>

            <div className="border border-[#E2E8F0] rounded overflow-hidden">
              {sellers.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">No partner nurseries registered.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] text-slate-600 font-mono text-[11px] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                        <th className="p-3">Nursery Name</th>
                        <th className="p-3">City / Location</th>
                        <th className="p-3">Kyc Status</th>
                        <th className="p-3 text-right">Commission Cut</th>
                        <th className="p-3 text-right">Net Payable Balance</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {sellers.map((s) => (
                        <tr key={s.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="p-3 font-semibold text-[#0F172A]">
                            {s.business_name || s.name || "Local Nursery"}
                          </td>
                          <td className="p-3 text-slate-600 font-mono text-[11px]">
                            {s.city || "India"}
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              {s.status?.toUpperCase() || "APPROVED"}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-600">
                            12.0% (Standard)
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            Ready for Auto-Disbursal
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REFUND MODAL */}
        {refundModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-sans text-sm font-bold text-[#0F172A]">Initiate Cashfree Refund</h3>
                <button
                  type="button"
                  onClick={() => setRefundModalItem(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label="Close modal"
                >
                  <CloseIcon size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Transaction Ref:</span>
                  <span className="font-mono font-bold text-[#0F172A]">{refundModalItem.paymentReference}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Original Order Total:</span>
                  <span className="font-mono font-bold text-[#0F172A]">{formatINR(refundModalItem.amountPaise)}</span>
                </div>
              </div>

              <form onSubmit={handleInitiateRefund} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 font-mono">
                    Refund Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={(refundModalItem.amountPaise / 100).toFixed(2)}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 font-mono">
                    Refund Reason
                  </label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="e.g. Customer cancelled order / plant stock damaged"
                    className="w-full px-3 py-2 text-xs rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRefundModalItem(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRefunding}
                    className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded transition-colors disabled:opacity-50"
                  >
                    {isRefunding ? "Processing..." : "Confirm Refund"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
