"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { LeafIcon } from "@/components/ui/Icons";

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "suspended" | "rejected">("all");
  const [selectedSeller, setSelectedSeller] = useState<any | null>(null);
  const [sellerDocs, setSellerDocs] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSellers = async (status?: string) => {
    try {
      setLoading(true);
      const res = await api.getAdminSellers(status && status !== "all" ? { status } : undefined);
      if (res.success && res.data) {
        setSellers(res.data);
      } else {
        setError(res.error?.message || "Failed to load sellers");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers(activeTab);
  }, [activeTab]);

  const handleInspectSeller = async (seller: any) => {
    setSelectedSeller(seller);
    try {
      const res = await api.getSellerDocuments(seller.id);
      if (res.success && res.data?.documents) {
        setSellerDocs(res.data.documents);
      } else {
        setSellerDocs([]);
      }
    } catch {
      setSellerDocs([]);
    }
  };

  const handleStatusChange = async (action: "approve" | "reject" | "suspend" | "reactivate") => {
    if (!selectedSeller) return;
    try {
      setActionLoading(true);
      let res;
      if (action === "approve") res = await api.approveSeller(selectedSeller.id);
      else if (action === "reject") res = await api.rejectSeller(selectedSeller.id);
      else if (action === "suspend") res = await api.suspendSeller(selectedSeller.id);
      else if (action === "reactivate") res = await api.reactivateSeller(selectedSeller.id);

      if (res?.success) {
        await fetchSellers(activeTab);
        setSelectedSeller(null);
      } else {
        alert(res?.error?.message || `Failed to ${action} seller`);
      }
    } catch (e: any) {
      alert(e.message || "Error executing action");
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { key: "all", label: "All Sellers" },
    { key: "pending", label: "Pending Applications" },
    { key: "approved", label: "Approved Nurseries" },
    { key: "suspended", label: "Suspended Sellers" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Seller & Nursery Management</h1>
          <p className="text-xs text-ink-400 mt-0.5">Review seller onboarding applications, verify documents, and manage partner status.</p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex border-b border-ink-100 space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={[
                "pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap",
                activeTab === tab.key
                  ? "border-forest-700 text-forest-700"
                  : "border-transparent text-ink-400 hover:text-ink-900",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sellers Directory Table */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sellers.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-400">No seller profiles found in this category.</div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-4">Business Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {sellers.map((s) => (
                  <tr key={s.id} className="hover:bg-cream-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center flex-shrink-0">
                          <LeafIcon size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-ink-900 leading-tight">{s.business_name || "Nursery Partner"}</p>
                          <p className="text-[10px] text-ink-400 font-mono mt-0.5">{s.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-ink-900 font-semibold">{s.contact_email || "N/A"}</p>
                      <p className="text-[10px] text-ink-400 font-mono mt-0.5">{s.contact_phone || "N/A"}</p>
                    </td>
                    <td className="p-4 text-ink-600 max-w-xs truncate">{s.address || "Location not specified"}</td>
                    <td className="p-4">
                      <SellerStatusBadge status={s.status || "pending"} />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleInspectSeller(s)}
                        className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[10px] uppercase tracking-wider transition-colors"
                      >
                        Inspect & Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Seller Review & Documents Drawer */}
        {selectedSeller && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">{selectedSeller.business_name}</h3>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">Seller ID: {selectedSeller.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSeller(null)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="bg-cream-50 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-500 font-semibold">Current Status:</span>
                  <SellerStatusBadge status={selectedSeller.status || "pending"} />
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500 font-semibold">Email:</span>
                  <span className="font-mono text-ink-900">{selectedSeller.contact_email || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500 font-semibold">Phone:</span>
                  <span className="font-mono text-ink-900">{selectedSeller.contact_phone || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500 font-semibold">Nursery Address:</span>
                  <span className="text-ink-900 text-right">{selectedSeller.address || "N/A"}</span>
                </div>
              </div>

              {/* Documents Review Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700">Uploaded Verification Documents</h4>
                {sellerDocs.length === 0 ? (
                  <div className="p-3 bg-cream-50 rounded-xl text-[11px] text-ink-400 text-center">
                    No document records submitted.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sellerDocs.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-ink-100 rounded-xl text-xs">
                        <div>
                          <p className="font-bold text-ink-900 uppercase">{doc.type.replace("_", " ")}</p>
                          <p className="text-[10px] text-forest-700 font-semibold uppercase">{doc.status}</p>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-forest-50 text-forest-700 font-bold text-[10px] hover:bg-forest-100"
                        >
                          View Document
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-2">
                {selectedSeller.status === "pending" && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleStatusChange("approve")}
                      className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      Approve Nursery
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleStatusChange("reject")}
                      className="flex-1 py-2.5 rounded-xl bg-error-600 hover:bg-error-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      Reject Application
                    </button>
                  </>
                )}

                {selectedSeller.status === "approved" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleStatusChange("suspend")}
                    className="w-full py-2.5 rounded-xl bg-error-600 hover:bg-error-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Suspend Seller Profile
                  </button>
                )}

                {selectedSeller.status === "suspended" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleStatusChange("reactivate")}
                    className="w-full py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Reactivate Seller Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
