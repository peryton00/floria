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
  const [activeTab, setActiveTab] = useState<"all" | "under_review" | "needs_correction" | "approved" | "suspended" | "rejected">("all");
  const [selectedSeller, setSelectedSeller] = useState<any | null>(null);
  const [sellerDocs, setSellerDocs] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Correction & Rejection input modal state
  const [actionPrompt, setActionPrompt] = useState<{
    type: "request_correction" | "reject" | "suspend";
    reason: string;
  } | null>(null);

  // Edit fields
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editGst, setEditGst] = useState("");
  const [editStatus, setEditStatus] = useState("under_review");

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
    setActionPrompt(null);
    setEditName(seller.business_name || "");
    setEditDesc(seller.business_description || "");
    setEditEmail(seller.contact_email || "");
    setEditPhone(seller.contact_phone || "");
    setEditAddress(seller.address || "");
    setEditGst(seller.gst_number || "");
    setEditStatus(seller.status || "under_review");
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

  const handleStatusChange = async (
    action: "approve" | "reject" | "request_correction" | "suspend" | "reactivate",
    reason?: string,
  ) => {
    if (!selectedSeller) return;
    try {
      setActionLoading(true);
      let res: any;
      if (action === "approve") {
        res = await api.approveSeller(selectedSeller.id);
      } else if (action === "reject") {
        res = await api.rejectSeller(selectedSeller.id, reason);
      } else if (action === "request_correction") {
        res = await api.requestSellerCorrection(selectedSeller.id, reason || "Please update your application details.");
      } else if (action === "suspend") {
        res = await api.suspendSeller(selectedSeller.id, reason);
      } else if (action === "reactivate") {
        res = await api.approveSeller(selectedSeller.id);
      }

      if (res?.success) {
        toast.success("Seller status updated", `Seller '${selectedSeller.business_name}' is now ${action.replace("_", " ")}.`);
        await fetchSellers(activeTab);
        setSelectedSeller(null);
        setActionPrompt(null);
      } else {
        toast.error("Action failed", res?.error?.message || `Failed to update seller`);
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
        gst_number: editGst,
        status: editStatus,
      });

      if (res.success) {
        toast.success("Changes saved", "Seller details have been updated.");
        await fetchSellers(activeTab);
        setSelectedSeller(null);
      } else {
        toast.error("Save failed", res.error?.message || "Failed to update seller");
      }
    } catch (e: any) {
      toast.error("Save failed", e.message || "Error saving seller details");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="p-8 space-y-8 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1A2E22]">Nursery Partner Management</h1>
            <p className="text-xs text-[#6B7280] mt-1">
              Review seller registrations, verify GST details, approve active partners, and handle onboarding lifecycle.
            </p>
          </div>
          <button
            onClick={() => fetchSellers(activeTab)}
            disabled={loading}
            className="px-4 py-2 bg-[#2D5A3C] hover:bg-[#1E4D2B] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3 overflow-x-auto text-xs font-bold">
          {(["all", "under_review", "needs_correction", "approved", "suspended", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "bg-[#2D5A3C] text-white"
                  : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Sellers Grid / Table */}
        {loading ? (
          <NurseryGridSkeleton />
        ) : sellers.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E7EB] space-y-3">
            <div className="w-12 h-12 bg-[#EAF2EC] text-[#2D5A3C] rounded-full flex items-center justify-center mx-auto text-xl">
              <LeafIcon className="w-6 h-6 text-[#2D5A3C]" />
            </div>
            <h3 className="font-serif text-base font-bold text-[#1A2E22]">No Nurseries Found</h3>
            <p className="text-xs text-[#6B7280]">
              No partner records matching the active filter &apos;{activeTab.replace("_", " ")}&apos;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellers.map((seller) => (
              <div
                key={seller.id}
                className="bg-white rounded-2xl border border-[#E8E4DC] p-6 shadow-sm hover:border-[#2D5A3C] transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider">
                        {seller.public_seller_id || `FLR-SLR-${seller.id.slice(0, 6).toUpperCase()}`}
                      </span>
                      <h3 className="font-serif text-base font-bold text-[#1A2E22]">{seller.business_name}</h3>
                    </div>
                    <SellerStatusBadge status={seller.status || "under_review"} />
                  </div>

                  <p className="text-xs text-[#4B5563] line-clamp-2">
                    {seller.business_description || "Botanical nursery partner specializing in healthy plants."}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-[#F3F4F6] text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Username:</span>
                      <span className="font-mono text-[#111827]">{seller.username || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Email:</span>
                      <span className="font-mono text-[#111827] truncate max-w-[180px]">{seller.contact_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Location:</span>
                      <span className="text-[#111827] font-medium">{seller.city || "—"}, {seller.state || "—"}</span>
                    </div>
                    {seller.gst_number && (
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">GSTIN:</span>
                        <span className="font-mono text-[#2D5A3C] font-semibold">{seller.gst_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F3F4F6] space-y-2">
                  {(seller.status === "under_review" ||
                    seller.status === "pending" ||
                    seller.status === "application_submitted" ||
                    seller.status === "needs_correction") ? (
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => {
                            setSelectedSeller(seller);
                            handleStatusChange("approve");
                          }}
                          className="flex-1 py-2 bg-[#2D5A3C] hover:bg-[#1E4D2B] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInspectSeller(seller)}
                          className="flex-1 py-2 bg-[#FAF8F5] hover:bg-[#EAF2EC] text-[#2D5A3C] font-bold text-xs uppercase tracking-wider rounded-xl border border-[#D0E2D4] transition-colors"
                        >
                          Review
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSeller(seller);
                            setActionPrompt({
                              type: "request_correction",
                              reason: "Please update required business verification documents.",
                            });
                          }}
                          className="flex-1 py-1.5 bg-[#FEF8EC] hover:bg-[#FDE68A] text-[#8C5E06] font-bold text-[11px] uppercase tracking-wider rounded-lg border border-[#FBD38D] transition-colors"
                        >
                          Correction
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSeller(seller);
                            setActionPrompt({
                              type: "reject",
                              reason: "Application does not meet onboarding criteria.",
                            });
                          }}
                          className="flex-1 py-1.5 bg-[#FEF2F2] hover:bg-[#FECACA] text-[#991B1B] font-bold text-[11px] uppercase tracking-wider rounded-lg border border-[#FECACA] transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ) : (seller.status === "approved" || seller.status === "active") ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspectSeller(seller)}
                        className="flex-1 py-2 bg-[#FAF8F5] hover:bg-[#EAF2EC] text-[#2D5A3C] font-bold text-xs uppercase tracking-wider rounded-xl border border-[#D0E2D4] transition-colors"
                      >
                        Inspect Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSeller(seller);
                          setActionPrompt({
                            type: "suspend",
                            reason: "Account suspended by platform moderation.",
                          });
                        }}
                        className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs uppercase tracking-wider rounded-xl border border-red-200 transition-colors"
                      >
                        Suspend
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspectSeller(seller)}
                        className="flex-1 py-2 bg-[#FAF8F5] hover:bg-[#EAF2EC] text-[#2D5A3C] font-bold text-xs uppercase tracking-wider rounded-xl border border-[#D0E2D4] transition-colors"
                      >
                        Inspect Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSeller(seller);
                          handleStatusChange("reactivate");
                        }}
                        className="py-2 px-3 bg-[#2D5A3C] hover:bg-[#1E4D2B] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                      >
                        Reactivate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inspect / Review Modal */}
        {selectedSeller && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto border border-[#E5E7EB] shadow-xl">
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4">
                <div>
                  <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider">
                    {selectedSeller.public_seller_id || `FLR-SLR-${selectedSeller.id.slice(0, 6).toUpperCase()}`}
                  </span>
                  <h2 className="font-serif text-xl font-bold text-[#1A2E22]">
                    {selectedSeller.business_name}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedSeller(null);
                    setActionPrompt(null);
                  }}
                  className="p-1 text-[#6B7280] hover:text-[#111827] text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Action reason modal prompt */}
              {actionPrompt && (
                <div className="p-4 bg-[#FEF8EC] border border-[#FBD38D] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C5E06]">
                    Provide Reason for {actionPrompt.type.replace("_", " ")}
                  </h4>
                  <textarea
                    rows={2}
                    value={actionPrompt.reason}
                    onChange={(e) => setActionPrompt({ ...actionPrompt, reason: e.target.value })}
                    placeholder="Enter reason or instructions for seller..."
                    className="w-full p-2.5 text-xs rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleStatusChange(actionPrompt.type, actionPrompt.reason)}
                      className="px-4 py-2 bg-[#2D5A3C] hover:bg-[#1E4D2B] text-white font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-50"
                    >
                      Confirm Action
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionPrompt(null)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-[#4B5563] text-xs font-bold rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Tabs inside modal */}
              <div className="flex border-b border-[#F3F4F6] gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`pb-2 border-b-2 transition-colors ${
                    !isEditing ? "border-[#2D5A3C] text-[#2D5A3C]" : "border-transparent text-[#6B7280]"
                  }`}
                >
                  Application Overview
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`pb-2 border-b-2 transition-colors ${
                    isEditing ? "border-[#2D5A3C] text-[#2D5A3C]" : "border-transparent text-[#6B7280]"
                  }`}
                >
                  Edit Profile
                </button>
              </div>

              {!isEditing ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-[#FAF8F5] rounded-xl p-4 space-y-2 border border-[#E8E4DC]">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280] font-semibold">Account Status:</span>
                      <SellerStatusBadge status={selectedSeller.status || "under_review"} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280] font-semibold">Username:</span>
                      <span className="font-mono text-[#111827]">{selectedSeller.username || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280] font-semibold">Email:</span>
                      <span className="font-mono text-[#111827]">{selectedSeller.contact_email || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280] font-semibold">Phone:</span>
                      <span className="font-mono text-[#111827]">{selectedSeller.contact_phone || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280] font-semibold">GSTIN:</span>
                      <span className="font-mono text-[#2D5A3C] font-bold">{selectedSeller.gst_number || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280] font-semibold">Physical Location:</span>
                      <span className="text-[#111827] text-right max-w-xs">{selectedSeller.address || "—"}</span>
                    </div>
                  </div>

                  {/* Verification Docs */}
                  <div className="space-y-2">
                    <h4 className="font-bold uppercase tracking-wider text-[#374151]">
                      Verification Documents & Records
                    </h4>
                    {sellerDocs.length === 0 ? (
                      <div className="p-3 bg-[#FAF8F5] rounded-xl text-[11px] text-[#6B7280] text-center">
                        Standard nursery onboarding record.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sellerDocs.map((doc, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-xl"
                          >
                            <div>
                              <p className="font-bold text-[#111827] uppercase">{doc.type.replace("_", " ")}</p>
                              <p className="text-[10px] text-[#2D5A3C] font-semibold uppercase">{doc.status}</p>
                            </div>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-[#EAF2EC] text-[#2D5A3C] font-bold text-[10px] hover:bg-[#D0E2D4]"
                            >
                              View Document
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Review Buttons */}
                  <div className="pt-4 flex flex-wrap gap-2 border-t border-[#F3F4F6]">
                    {(selectedSeller.status === "under_review" ||
                      selectedSeller.status === "pending" ||
                      selectedSeller.status === "application_submitted" ||
                      selectedSeller.status === "needs_correction") && (
                      <>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleStatusChange("approve")}
                          className="flex-1 py-2.5 rounded-xl bg-[#2D5A3C] hover:bg-[#1E4D2B] text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          Approve Nursery
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            setActionPrompt({
                              type: "request_correction",
                              reason: "Please update required business verification documents.",
                            })
                          }
                          className="flex-1 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          Request Correction
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            setActionPrompt({
                              type: "reject",
                              reason: "Application does not meet onboarding criteria.",
                            })
                          }
                          className="flex-1 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {(selectedSeller.status === "approved" || selectedSeller.status === "active") && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          setActionPrompt({
                            type: "suspend",
                            reason: "Account suspended by platform moderation.",
                          })
                        }
                        className="w-full py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        Suspend Seller Account
                      </button>
                    )}

                    {selectedSeller.status === "suspended" && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleStatusChange("reactivate")}
                        className="w-full py-2.5 rounded-xl bg-[#2D5A3C] hover:bg-[#1E4D2B] text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        Reactivate Seller Account
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveDetails} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[#374151] mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[#374151] mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-[#374151] mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-[#374151] mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[#374151] mb-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={editGst}
                      onChange={(e) => setEditGst(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[#374151] mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[#374151] mb-1">
                      Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                    >
                      <option value="under_review">Under Review</option>
                      <option value="needs_correction">Needs Correction</option>
                      <option value="approved">Approved / Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl bg-[#2D5A3C] hover:bg-[#1E4D2B] text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSeller(null)}
                      className="px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-[#4B5563] font-bold text-xs uppercase tracking-wider hover:bg-gray-50"
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
