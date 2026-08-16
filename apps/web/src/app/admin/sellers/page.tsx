"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { LeafIcon } from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";
import { NurseryGridSkeleton } from "@/components/ui/loading";

export default function AdminSellersPage() {
  const { toast } = useToast();
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "suspended" | "rejected">("all");
  const [selectedSeller, setSelectedSeller] = useState<any | null>(null);
  const [sellerDocs, setSellerDocs] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit fields
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStatus, setEditStatus] = useState("pending");

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
    setEditName(seller.business_name || "");
    setEditDesc(seller.business_description || "");
    setEditEmail(seller.contact_email || "");
    setEditPhone(seller.contact_phone || "");
    setEditAddress(seller.address || "");
    setEditStatus(seller.status || "pending");
    setIsEditing(false);

    try {
      const res = await api.getAdminSellerDocuments(seller.id);
      if (res.success && res.data) {
        setSellerDocs(Array.isArray(res.data) ? res.data : res.data.documents || []);
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
      let res: any;
      if (action === "approve") res = await api.approveSeller(selectedSeller.id);
      else if (action === "reject") res = await api.rejectSeller(selectedSeller.id);
      else if (action === "suspend") res = await api.suspendSeller(selectedSeller.id);
      else if (action === "reactivate") res = await api.reactivateSeller(selectedSeller.id);

      if (res?.success) {
        toast.success("Seller status updated", `Seller '${selectedSeller.business_name}' status updated to ${action}.`);
        await fetchSellers(activeTab);
        setSelectedSeller(null);
      } else {
        toast.error("Action failed", res?.error?.message || `Failed to ${action} seller`);
      }
    } catch (e: any) {
      toast.error("Action failed", e.message || "Error executing action");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.updateAdminSeller(selectedSeller.id, {
        business_name: editName,
        business_description: editDesc,
        contact_email: editEmail,
        contact_phone: editPhone,
        address: editAddress,
        status: editStatus,
      });
      if (res.success) {
        toast.success("Seller profile saved", "Seller details updated successfully.");
        await fetchSellers(activeTab);
        setSelectedSeller(null);
      } else {
        toast.error("Update failed", res.error?.message || "Failed to update seller details");
      }
    } catch (e: any) {
      toast.error("Update failed", e.message || "Error updating seller details");
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
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Seller &amp; Nursery Management</h1>
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

        {/* Nursery Cards Grid */}
        {loading ? (
          <NurseryGridSkeleton count={6} />
        ) : sellers.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-400">No seller profiles found in this category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellers.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-ink-200 transition-colors"
              >
                <div className="flex items-start justify-between min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center flex-shrink-0">
                      <LeafIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-ink-900 leading-tight truncate">{s.business_name || "Nursery Partner"}</p>
                      <p className="text-[9px] text-ink-400 font-mono mt-0.5 truncate">{s.id}</p>
                    </div>
                  </div>
                  <SellerStatusBadge status={s.status || "pending"} />
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-ink-500 font-medium truncate">Email: {s.contact_email || "N/A"}</p>
                  <p className="text-ink-500 font-medium truncate">Phone: <span className="font-mono text-ink-700">{s.contact_phone || "N/A"}</span></p>
                  <p className="text-ink-400 text-[11px] truncate">Address: {s.address || "N/A"}</p>
                </div>

                <div className="pt-2 border-t border-ink-50 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleInspectSeller(s)}
                    className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[9px] uppercase tracking-wider transition-colors"
                  >
                    Inspect &amp; Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Seller Inspector/Editor */}
        {selectedSeller && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">Manage Nursery Partner</h3>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">{selectedSeller.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSeller(null)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* View/Edit Navigation */}
              <div className="flex border-b border-ink-100 gap-4 text-xs font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`pb-2 border-b-2 transition-colors ${!isEditing ? "border-forest-700 text-forest-700" : "border-transparent text-ink-400"}`}
                >
                  Approve/Review
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`pb-2 border-b-2 transition-colors ${isEditing ? "border-forest-700 text-forest-700" : "border-transparent text-ink-400"}`}
                >
                  Edit Details
                </button>
              </div>

              {!isEditing ? (
                <div className="space-y-4">
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
              ) : (
                <form onSubmit={handleSaveDetails} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Business Description
                    </label>
                    <textarea
                      rows={2}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full p-3 rounded-lg border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Nursery Address
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Onboarding Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                    >
                      <option value="pending">Pending Application</option>
                      <option value="approved">Approved</option>
                      <option value="suspended">Suspended</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSeller(null)}
                      className="px-4 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-bold text-xs uppercase tracking-wider hover:bg-cream-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
