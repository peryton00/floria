"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { TruckIcon, CloseIcon, SearchIcon, CheckIcon, AlertIcon, ShieldIcon } from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";
import type { DeliveryPartnerApplication, DeliveryPartner, DeliveryPayout } from "@floria/types";

export default function AdminDeliveryPartnersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"applications" | "directory" | "payouts">("applications");
  
  // Applications state
  const [applications, setApplications] = useState<DeliveryPartnerApplication[]>([]);
  const [appFilter, setAppFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<DeliveryPartnerApplication | null>(null);
  
  // Partners state
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);

  // Payouts state
  const [payouts, setPayouts] = useState<DeliveryPayout[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection prompt state
  const [rejectPromptAppId, setRejectPromptAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Provisioned credential reveal modal
  const [provisionedInfo, setProvisionedInfo] = useState<{
    partner: DeliveryPartner;
    activationToken?: string;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "applications") {
        const res = await api.getAdminDeliveryApplications({
          status: appFilter !== "all" ? appFilter : undefined,
          search: searchQuery || undefined,
        });
        if (res.success && res.data) {
          setApplications(res.data);
        }
      } else if (activeTab === "directory") {
        const res = await api.getAdminDeliveryPartners({
          status: partnerFilter !== "all" ? partnerFilter : undefined,
          search: searchQuery || undefined,
        });
        if (res.success && res.data) {
          setPartners(res.data);
        }
      } else if (activeTab === "payouts") {
        const res = await api.getAdminDeliveryPayouts();
        if (res.success && res.data) {
          setPayouts(res.data);
        }
      }
    } catch (err: any) {
      toast.error(
        "Failed to load data",
        err.message || "Could not retrieve records from dispatch server.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, appFilter, partnerFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleApproveApplication = async (appId: string) => {
    setActionLoading(true);
    try {
      const res = await api.approveDeliveryApplication(appId);
      if (res.success && res.data) {
        toast.success(
          "Application Approved",
          `Courier profile provisioned (${res.data.partner.public_partner_id}).`,
        );
        setSelectedApp(null);
        setProvisionedInfo({
          partner: res.data.partner,
          activationToken: res.data.activationToken,
        });
        loadData();
      } else {
        throw new Error(res.error?.message || "Approval failed");
      }
    } catch (err: any) {
      toast.error(
        "Approval Error",
        err.message || "Failed to approve courier application.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectApplication = async () => {
    if (!rejectPromptAppId) return;
    setActionLoading(true);
    try {
      const res = await api.rejectDeliveryApplication(
        rejectPromptAppId,
        rejectionReason || "Application did not meet vehicle / license criteria.",
      );
      if (res.success) {
        toast.success(
          "Application Rejected",
          "Notification dispatched to applicant.",
        );
        setRejectPromptAppId(null);
        setRejectionReason("");
        setSelectedApp(null);
        loadData();
      } else {
        throw new Error(res.error?.message || "Rejection failed");
      }
    } catch (err: any) {
      toast.error(
        "Rejection Error",
        err.message || "Failed to reject application.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePartnerStatus = async (partner: DeliveryPartner) => {
    const nextStatus = partner.status === "active" ? "suspended" : "active";
    setActionLoading(true);
    try {
      const res = await api.updateAdminDeliveryPartnerStatus(partner.id, nextStatus as any);
      if (res.success && res.data) {
        toast.success(
          `Courier ${nextStatus === "active" ? "Reactivated" : "Suspended"}`,
          `${partner.full_name} is now marked as ${nextStatus}.`,
        );
        setSelectedPartner(null);
        loadData();
      } else {
        throw new Error(res.error?.message || "Status update failed");
      }
    } catch (err: any) {
      toast.error(
        "Status Update Error",
        err.message || "Failed to change partner status.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream-200 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-forest-800 text-white flex items-center justify-center shadow-xs">
                <TruckIcon size={20} />
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900">
                Delivery Partner Logistics
              </h1>
            </div>
            <p className="text-xs text-ink-500 mt-1 font-mono uppercase tracking-wider">
              Fleet Onboarding · Regional Couriers · State Machine & Payouts
            </p>
          </div>

          {/* Primary View Selector Tabs */}
          <div className="flex items-center bg-cream-100 p-1 rounded-xl border border-cream-200 shadow-xs">
            <button
              onClick={() => { setActiveTab("applications"); setSearchQuery(""); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "applications"
                  ? "bg-forest-800 text-white shadow-xs"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => { setActiveTab("directory"); setSearchQuery(""); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "directory"
                  ? "bg-forest-800 text-white shadow-xs"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              Fleet Directory
            </button>
            <button
              onClick={() => { setActiveTab("payouts"); setSearchQuery(""); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "payouts"
                  ? "bg-forest-800 text-white shadow-xs"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              Payouts Ledger
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-cream-200 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by name, email, phone, RC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-cream-50 border border-cream-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-forest-800"
            />
            <SearchIcon size={14} className="absolute left-3 top-2.5 text-ink-400" />
          </form>

          {activeTab === "applications" && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
              {["all", "pending", "approved", "rejected"].map((st) => (
                <button
                  key={st}
                  onClick={() => setAppFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all ${
                    appFilter === st
                      ? "bg-forest-800 text-white"
                      : "bg-cream-50 text-ink-600 hover:bg-cream-100 border border-cream-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          {activeTab === "directory" && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
              {["all", "active", "suspended", "inactive"].map((st) => (
                <button
                  key={st}
                  onClick={() => setPartnerFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all ${
                    partnerFilter === st
                      ? "bg-forest-800 text-white"
                      : "bg-cream-50 text-ink-600 hover:bg-cream-100 border border-cream-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 1. APPLICATIONS TABLE ────────────────────────────────────────── */}
        {activeTab === "applications" && (
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-ink-400 animate-pulse">
                Loading applicant records...
              </div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-ink-400">
                No delivery partner applications matching the current criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-cream-50/80 border-b border-cream-200 text-ink-500 font-mono uppercase tracking-wider text-[10px]">
                      <th className="p-4">Applicant</th>
                      <th className="p-4">Hub / Region</th>
                      <th className="p-4">Vehicle & RC</th>
                      <th className="p-4">Driving License</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Submitted</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-100 font-medium">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-cream-50/60 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-ink-900">{app.full_name}</p>
                          <p className="text-[11px] text-ink-500">{app.email}</p>
                          <p className="text-[10px] text-ink-400 font-mono">{app.phone}</p>
                        </td>
                        <td className="p-4 text-ink-700">{app.city}</td>
                        <td className="p-4">
                          <span className="capitalize font-medium text-ink-800">
                            {app.vehicle_type?.replace("_", " ")}
                          </span>
                          <p className="text-[10px] font-mono text-ink-400 mt-0.5">
                            {app.vehicle_number}
                          </p>
                        </td>
                        <td className="p-4 font-mono text-ink-800">{app.driving_license}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider ${
                              app.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : app.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="p-4 text-[11px] font-mono text-ink-500">
                          {new Date(app.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="px-3 py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-800 rounded-lg text-xs font-semibold transition-colors border border-forest-200"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 2. FLEET DIRECTORY TABLE ─────────────────────────────────────── */}
        {activeTab === "directory" && (
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-ink-400 animate-pulse">
                Loading courier fleet directory...
              </div>
            ) : partners.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-ink-400">
                No registered delivery couriers found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-cream-50/80 border-b border-cream-200 text-ink-500 font-mono uppercase tracking-wider text-[10px]">
                      <th className="p-4">Courier ID & Name</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Operating Hub</th>
                      <th className="p-4">Duty Status</th>
                      <th className="p-4">Vehicle Details</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4 text-right">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-100 font-medium">
                    {partners.map((p) => (
                      <tr key={p.id} className="hover:bg-cream-50/60 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-ink-900">{p.full_name}</p>
                          <span className="inline-block px-1.5 py-0.5 bg-cream-100 border border-cream-300 rounded text-[9px] font-mono text-forest-800 font-bold mt-1">
                            {p.public_partner_id}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="text-ink-700">{p.email}</p>
                          <p className="text-[10px] text-ink-400 font-mono">{p.phone}</p>
                        </td>
                        <td className="p-4 text-ink-700">{p.city}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider ${
                              p.on_duty
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-cream-100 text-ink-500"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                p.on_duty ? "bg-emerald-600 animate-pulse" : "bg-ink-400"
                              }`}
                            />
                            {p.on_duty ? "On Duty" : "Off Duty"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="capitalize text-ink-800 font-medium">
                            {p.vehicle_type?.replace("_", " ")}
                          </span>
                          <p className="text-[10px] font-mono text-ink-400">{p.vehicle_number}</p>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider ${
                              p.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedPartner(p)}
                            className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-ink-800 rounded-lg text-xs font-semibold transition-colors border border-cream-300"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 3. PAYOUTS LEDGER TABLE ──────────────────────────────────────── */}
        {activeTab === "payouts" && (
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-ink-400 animate-pulse">
                Loading courier settlements and payouts...
              </div>
            ) : payouts.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-ink-400">
                No delivery disbursements recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-cream-50/80 border-b border-cream-200 text-ink-500 font-mono uppercase tracking-wider text-[10px]">
                      <th className="p-4">Disbursement ID</th>
                      <th className="p-4">Courier Partner</th>
                      <th className="p-4">Amount Disbursed</th>
                      <th className="p-4">Settlement Status</th>
                      <th className="p-4">Disbursed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-100 font-medium">
                    {payouts.map((py) => (
                      <tr key={py.id} className="hover:bg-cream-50/60 transition-colors">
                        <td className="p-4 font-mono text-ink-600">{py.id.slice(0, 8)}...</td>
                        <td className="p-4 font-mono text-ink-800">{py.partner_id.slice(0, 8)}...</td>
                        <td className="p-4 font-bold text-forest-800">
                          ₹{(py.amount_paise / 100).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800">
                            {py.status}
                          </span>
                        </td>
                        <td className="p-4 text-ink-500 font-mono text-[11px]">
                          {new Date(py.paid_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── MODAL: APPLICATION REVIEW & KYC ──────────────────────────────── */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-3xl border border-cream-300 shadow-2xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-cream-200 pb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-ink-900">
                    Application Review
                  </h3>
                  <p className="text-xs text-ink-500 font-mono">
                    ID: #{selectedApp.id.slice(0, 8)} · Submitted {new Date(selectedApp.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="w-8 h-8 rounded-full bg-cream-100 text-ink-500 hover:text-ink-900 flex items-center justify-center transition-colors"
                >
                  <CloseIcon size={16} />
                </button>
              </div>

              {/* Applicant Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-cream-50 p-4 rounded-2xl border border-cream-200 text-xs">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-ink-400">
                    Applicant Name
                  </p>
                  <p className="font-bold text-ink-900 mt-0.5">{selectedApp.full_name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-ink-400">
                    Operating City Hub
                  </p>
                  <p className="font-bold text-ink-900 mt-0.5">{selectedApp.city}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-ink-400">
                    Email Address
                  </p>
                  <p className="text-ink-700 mt-0.5 font-mono">{selectedApp.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-ink-400">
                    Mobile Phone
                  </p>
                  <p className="text-ink-700 mt-0.5 font-mono">{selectedApp.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-ink-400">
                    Vehicle Type & RC
                  </p>
                  <p className="text-ink-900 font-medium capitalize mt-0.5">
                    {selectedApp.vehicle_type?.replace("_", " ")} ({selectedApp.vehicle_number})
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-ink-400">
                    Driving License (DL)
                  </p>
                  <p className="text-forest-800 font-mono font-bold mt-0.5">
                    {selectedApp.driving_license}
                  </p>
                </div>
              </div>

              {selectedApp.rejection_reason && (
                <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-800">
                  <span className="font-bold">Prior Rejection Rationale: </span>
                  {selectedApp.rejection_reason}
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {selectedApp.status === "pending" && (
                  <>
                    <button
                      onClick={() => setRejectPromptAppId(selectedApp.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      Reject Application
                    </button>
                    <button
                      onClick={() => handleApproveApplication(selectedApp.id)}
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-forest-800 hover:bg-forest-900 transition-all shadow-xs"
                    >
                      {actionLoading ? "Provisioning..." : "Approve & Provision Account"}
                    </button>
                  </>
                )}
                {selectedApp.status !== "pending" && (
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-700 bg-cream-100 hover:bg-cream-200"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: REJECTION RATIONALE PROMPT ────────────────────────────── */}
        {rejectPromptAppId && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl border border-cream-300 shadow-2xl p-6 space-y-4">
              <h4 className="font-serif text-lg font-bold text-ink-900">
                Reject Courier Application
              </h4>
              <p className="text-xs text-ink-600">
                Provide the specific reason for rejecting this candidate. This note will be recorded in audit logs and sent to the applicant.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="E.g. Driving license expired or invalid vehicle registration..."
                rows={3}
                className="w-full text-xs p-3 bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-forest-800 font-sans"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectPromptAppId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-ink-600 hover:bg-cream-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectApplication}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700"
                >
                  {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: PROVISIONED CREDENTIAL REVEAL ─────────────────────────── */}
        {provisionedInfo && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl border border-cream-300 shadow-2xl p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                <CheckIcon size={24} />
              </div>
              <h4 className="font-serif text-xl font-bold text-ink-900">
                Account Provisioned Successfully
              </h4>
              <p className="text-xs text-ink-600">
                Courier <span className="font-bold">{provisionedInfo.partner.full_name}</span> has been provisioned with Public ID:
              </p>
              <div className="bg-forest-50 p-3 rounded-xl border border-forest-200">
                <span className="font-mono text-base font-bold text-forest-800">
                  {provisionedInfo.partner.public_partner_id}
                </span>
              </div>
              {provisionedInfo.activationToken && (
                <div className="text-left bg-cream-50 p-3 rounded-xl border border-cream-200 text-xs space-y-1">
                  <p className="font-mono text-[10px] text-ink-400 uppercase tracking-wider">
                    Activation Token (Expires in 48h):
                  </p>
                  <p className="font-mono text-[11px] text-ink-800 break-all select-all bg-white p-1.5 rounded border border-cream-200">
                    {provisionedInfo.activationToken}
                  </p>
                  <p className="text-[10px] text-ink-500 mt-1">
                    An activation email with password setup instructions has also been sent to {provisionedInfo.partner.email}.
                  </p>
                </div>
              )}
              <button
                onClick={() => setProvisionedInfo(null)}
                className="w-full py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ── MODAL: PARTNER DIRECTORY CONTROL ─────────────────────────────── */}
        {selectedPartner && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl border border-cream-300 shadow-2xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-cream-200 pb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">
                    Courier Management
                  </h3>
                  <span className="font-mono text-xs text-forest-800 font-bold">
                    {selectedPartner.public_partner_id}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="w-8 h-8 rounded-full bg-cream-100 text-ink-500 hover:text-ink-900 flex items-center justify-center transition-colors"
                >
                  <CloseIcon size={16} />
                </button>
              </div>

              <div className="space-y-3 bg-cream-50 p-4 rounded-2xl border border-cream-200 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-ink-400">Driver</span>
                  <p className="font-bold text-ink-900">{selectedPartner.full_name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-ink-400">Contact</span>
                  <p className="text-ink-700 font-mono">{selectedPartner.email} · {selectedPartner.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-ink-400">Vehicle & RC</span>
                  <p className="text-ink-900 font-medium capitalize">
                    {selectedPartner.vehicle_type?.replace("_", " ")} ({selectedPartner.vehicle_number})
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-cream-200">
                  <span className="text-ink-700">Account Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                      selectedPartner.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedPartner.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => handleTogglePartnerStatus(selectedPartner)}
                  disabled={actionLoading}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    selectedPartner.status === "active"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-emerald-700 hover:bg-emerald-800 text-white"
                  }`}
                >
                  {actionLoading
                    ? "Updating..."
                    : selectedPartner.status === "active"
                    ? "Suspend Courier Account"
                    : "Reactivate Courier Account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
