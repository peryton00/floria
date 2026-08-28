"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { SellerStatusBadge } from "@/components/admin/SellerStatusBadge";
import { useToast } from "@/lib/contexts/ToastContext";
import {
  SellersIcon,
  SearchIcon,
  RefreshIcon,
  CheckCircleIcon,
  ShieldAlertIcon,
  AlertIcon,
  EditIcon,
} from "@/components/ui/Icons";

export default function AdminSellersPage() {
  const { toast } = useToast();
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<
    "all" | "pending" | "approved" | "suspended"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSellers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminSellers();
      if (res.success && res.data) {
        setSellers(res.data);
      } else {
        setError(res.error?.message || "Failed to load nursery partners.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to admin services.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const handleUpdateStatus = async (
    sellerId: string,
    status: "approved" | "suspended" | "rejected",
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to set this nursery status to '${status}'?`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      let res;
      if (status === "approved") {
        res = await api.approveSeller(sellerId);
      } else if (status === "rejected") {
        res = await api.rejectSeller(sellerId);
      } else {
        res = await api.suspendSeller(sellerId);
      }
      if (res.success) {
        toast.success("Status Updated", `Nursery partner set to '${status}'.`);
        setSelectedSeller(null);
        await fetchSellers();
      } else {
        toast.error(
          "Action Failed",
          res.error?.message || "Could not update status.",
        );
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Could not update seller status.");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = sellers.filter((s) => {
    const matchesTab = filterTab === "all" || s.status === filterTab;
    const matchesSearch =
      (s.business_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (s.contact_email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (s.city || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Nursery Partners & Onboarding
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Review partner applications, verify business credentials, and manage
            nursery authorizations
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSellers}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-xs font-bold text-ink-700 transition-colors shadow-xs"
        >
          <RefreshIcon size={14} /> Refresh Sellers
        </button>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-200 rounded-xl text-xs text-error-700 font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchSellers}
            className="underline uppercase font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterTab === "all"
                ? "bg-forest-900 text-white"
                : "bg-cream-200 text-ink-700 hover:bg-cream-300"
            }`}
          >
            All Nurseries ({sellers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("pending")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterTab === "pending"
                ? "bg-warning-500 text-ink-900"
                : "bg-cream-200 text-ink-700 hover:bg-cream-300"
            }`}
          >
            Pending Review
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("approved")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterTab === "approved"
                ? "bg-forest-800 text-white"
                : "bg-cream-200 text-ink-700 hover:bg-cream-300"
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("suspended")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterTab === "suspended"
                ? "bg-error-600 text-white"
                : "bg-cream-200 text-ink-700 hover:bg-cream-300"
            }`}
          >
            Suspended
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <SearchIcon
            size={16}
            className="absolute left-3 top-2.5 text-ink-400"
          />
          <input
            type="text"
            placeholder="Search nursery, email, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
          />
        </div>
      </div>

      {/* Sellers Table */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-200/70 border-b border-cream-300 text-ink-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Nursery / Business</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-cream-100/60 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-ink-900 text-sm">
                        {s.business_name || "New Nursery"}
                      </div>
                      <div className="text-[10px] text-ink-500 font-mono">
                        ID: {s.id.substring(0, 8)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-ink-900 font-semibold">
                        {s.contact_email}
                      </div>
                      <div className="text-ink-500 text-[11px]">
                        {s.contact_phone || "No phone"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-ink-700">
                      <div>
                        {s.city || "—"}, {s.state || "—"}
                      </div>
                      <div className="text-[10px] text-ink-400">
                        {s.pincode}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <SellerStatusBadge status={s.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.status === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() =>
                                handleUpdateStatus(s.id, "approved")
                              }
                              className="px-3 py-1 bg-forest-800 hover:bg-forest-900 text-white rounded-lg text-[10px] font-bold uppercase disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() =>
                                handleUpdateStatus(s.id, "rejected")
                              }
                              className="px-2.5 py-1 bg-cream-200 hover:bg-error-50 text-error-700 rounded-lg text-[10px] font-bold uppercase disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {s.status === "approved" && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() =>
                              handleUpdateStatus(s.id, "suspended")
                            }
                            className="px-2.5 py-1 bg-cream-200 hover:bg-error-50 text-error-700 rounded-lg text-[10px] font-bold uppercase disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        )}
                        {s.status === "suspended" && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleUpdateStatus(s.id, "approved")}
                            className="px-3 py-1 bg-forest-800 hover:bg-forest-900 text-white rounded-lg text-[10px] font-bold uppercase disabled:opacity-50"
                          >
                            Re-activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 text-xs text-ink-500">
            No nurseries found for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
