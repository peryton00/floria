"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { PayoutIcon, ShieldIcon, CheckIcon, AlertIcon } from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";
import type { FinancialSettings, PricingPolicyVersion, PolicyImpactPreview, PricingRecalculationJob } from "@floria/types";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [finSettings, setFinSettings] = useState<FinancialSettings | null>(null);
  const [policies, setPolicies] = useState<PricingPolicyVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals & Panels State
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [previewingPolicy, setPreviewingPolicy] = useState<PricingPolicyVersion | null>(null);
  const [previewData, setPreviewData] = useState<PolicyImpactPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Recalculation Tracking State
  const [activeJobPolicy, setActiveJobPolicy] = useState<PricingPolicyVersion | null>(null);
  const [activeJob, setActiveJob] = useState<PricingRecalculationJob | null>(null);

  // New Draft Form State
  const [draftCommissionRate, setDraftCommissionRate] = useState("");
  const [draftProfitRate, setDraftProfitRate] = useState("");
  const [draftMaintenanceFeeINR, setDraftMaintenanceFeeINR] = useState("");
  const [draftThresholdINR, setDraftThresholdINR] = useState("");
  const [draftRecoveryINR, setDraftRecoveryINR] = useState("");
  const [draftNotes, setDraftNotes] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [finRes, policiesRes] = await Promise.all([
        api.getFinancialSettings(),
        api.getPricingPolicies(),
      ]);

      if (finRes.success && finRes.data) {
        setFinSettings(finRes.data);
      }
      if (policiesRes.success && policiesRes.data?.policies) {
        setPolicies(policiesRes.data.policies);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load platform pricing policies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling for recalculation job progress
  useEffect(() => {
    if (!activeJobPolicy || !activeJob || activeJob.status === "completed" || activeJob.status === "failed") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await api.getPricingRecalculationStatus(activeJobPolicy.id);
        if (res.success && res.data) {
          setActiveJob(res.data);
          if (res.data.status === "completed" || res.data.status === "failed") {
            fetchData();
            if (res.data.status === "completed") {
              toast.success("Recalculation Complete", `Catalog read model ready for Policy v${activeJobPolicy.versionNumber}`);
            } else {
              toast.error("Recalculation Failed", res.data.errorMessage || "Check backend logs");
            }
          }
        }
      } catch (err) {
        console.warn("[AdminSettings] Recalculation polling error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobPolicy, activeJob, fetchData, toast]);

  const handleOpenDraftModal = () => {
    if (finSettings) {
      setDraftCommissionRate(String(finSettings.sellerCommissionRate));
      setDraftProfitRate(String(finSettings.floriaProfitRate));
      setDraftMaintenanceFeeINR((finSettings.platformMaintenanceFeePaise / 100).toFixed(2));
      setDraftThresholdINR((finSettings.freeDeliveryThresholdPaise / 100).toFixed(2));
      setDraftRecoveryINR((finSettings.freeDeliveryRecoveryPaise / 100).toFixed(2));
    }
    setDraftNotes("");
    setShowDraftModal(true);
    setError(null);
  };

  const handleCreateDraftPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    const commRate = parseFloat(draftCommissionRate);
    const profitRate = parseFloat(draftProfitRate);
    const maintenancePaise = Math.round(parseFloat(draftMaintenanceFeeINR) * 100);
    const thresholdPaise = Math.round(parseFloat(draftThresholdINR) * 100);
    const recoveryPaise = Math.round(parseFloat(draftRecoveryINR) * 100);

    if (isNaN(commRate) || commRate < 0 || commRate > 50) {
      setError("Seller commission rate must be between 0% and 50%.");
      return;
    }
    if (isNaN(profitRate) || profitRate < 0 || profitRate > 50) {
      setError("Floria profit rate must be between 0% and 50%.");
      return;
    }
    if (isNaN(maintenancePaise) || maintenancePaise < 0) {
      setError("Maintenance fee must be a valid positive amount.");
      return;
    }
    if (isNaN(thresholdPaise) || thresholdPaise < 0) {
      setError("Free delivery threshold must be a valid positive amount.");
      return;
    }
    if (isNaN(recoveryPaise) || recoveryPaise < 0) {
      setError("Free delivery recovery must be a valid positive amount.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await api.createPricingPolicyDraft({
        sellerCommissionRate: commRate,
        floriaProfitRate: profitRate,
        platformMaintenanceFeePaise: maintenancePaise,
        freeDeliveryThresholdPaise: thresholdPaise,
        freeDeliveryRecoveryPaise: recoveryPaise,
        notes: draftNotes.trim() || undefined,
      });

      if (res.success && res.data) {
        setShowDraftModal(false);
        toast.success(`Draft Policy v${res.data.versionNumber} Created`, "You can now preview impact and run batch recalculation.");
        await fetchData();
      } else {
        const errMsg = res.error?.message || "Failed to create draft pricing policy";
        setError(errMsg);
        toast.error("Creation Failed", errMsg);
      }
    } catch (e: any) {
      const errMsg = e.message || "Error creating draft policy";
      setError(errMsg);
      toast.error("Creation Failed", errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewImpact = async (policy: PricingPolicyVersion) => {
    try {
      setPreviewingPolicy(policy);
      setPreviewLoading(true);
      setPreviewData(null);
      const res = await api.previewPricingPolicyImpact(policy.id);
      if (res.success && res.data) {
        setPreviewData(res.data);
      } else {
        toast.error("Preview Failed", res.error?.message || "Unable to calculate policy impact");
      }
    } catch (e: any) {
      toast.error("Preview Error", e.message || "Could not connect to preview service");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleStartRecalculation = async (policy: PricingPolicyVersion) => {
    try {
      setActiveJobPolicy(policy);
      setActiveJob({
        id: "temp",
        policyVersionId: policy.id,
        status: "in_progress",
        totalListings: 0,
        processedListings: 0,
        failedListings: 0,
        batchSize: 500,
        currentBatch: 0,
        totalBatches: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await api.startPricingRecalculation(policy.id);
      if (res.success && res.data) {
        setActiveJob(res.data);
        toast.info("Recalculation Queued", `Processing catalog listings for Policy v${policy.versionNumber}...`);
      } else {
        toast.error("Recalculation Error", res.error?.message || "Failed to start recalculation");
        setActiveJob(null);
        setActiveJobPolicy(null);
      }
    } catch (e: any) {
      toast.error("Recalculation Failed", e.message || "Network error");
      setActiveJob(null);
      setActiveJobPolicy(null);
    }
  };

  const handleActivatePolicy = async (policy: PricingPolicyVersion) => {
    if (!confirm(`Are you sure you want to activate Pricing Policy v${policy.versionNumber}? This will atomically update platform pricing and supersede any previous version.`)) {
      return;
    }

    try {
      setSaving(true);
      const res = await api.activatePricingPolicy(policy.id);
      if (res.success && res.data) {
        toast.success(`Policy v${policy.versionNumber} Activated`, "Catalog pricing read models and platform settings atomically updated.");
        await fetchData();
      } else {
        toast.error("Activation Failed", res.error?.message || "Failed to activate policy");
      }
    } catch (e: any) {
      toast.error("Activation Error", e.message || "Failed to activate policy");
    } finally {
      setSaving(false);
    }
  };

  const formatINR = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

  return (
    <AdminShell>
      <div className="space-y-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900 leading-tight">
              Pricing Policies &amp; Governance
            </h1>
            <p className="text-xs text-ink-400 mt-1">
              Versioned marketplace pricing policies, asynchronous catalog recalculation, and historical order immutability.
            </p>
          </div>

          <button
            type="button"
            disabled={loading || saving}
            onClick={handleOpenDraftModal}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            + Create Draft Policy
          </button>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700 flex items-start gap-2">
            <AlertIcon size={16} className="text-error-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. ACTIVE POLICY CARD */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-ink-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center font-bold text-lg">
                🏷️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-ink-900">ACTIVE PRODUCTION POLICY</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
                    Live
                  </span>
                </div>
                <p className="text-xs text-ink-400">
                  Applied to live catalog browse, customer store prices, and new order checkouts.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="bg-cream-50/70 p-3.5 rounded-xl border border-ink-50 space-y-1">
                <p className="font-bold text-ink-500 uppercase tracking-wider text-[10px]">Seller Commission</p>
                <p className="text-xl font-mono font-bold text-amber-700">{finSettings ? `${finSettings.sellerCommissionRate}%` : "—"}</p>
                <p className="text-[10px] text-ink-400">Deducted from seller base price</p>
              </div>

              <div className="bg-cream-50/70 p-3.5 rounded-xl border border-ink-50 space-y-1">
                <p className="font-bold text-ink-500 uppercase tracking-wider text-[10px]">Floria Profit Margin</p>
                <p className="text-xl font-mono font-bold text-forest-700">{finSettings ? `${finSettings.floriaProfitRate}%` : "—"}</p>
                <p className="text-[10px] text-ink-400">Internal margin on products</p>
              </div>

              <div className="bg-cream-50/70 p-3.5 rounded-xl border border-ink-50 space-y-1">
                <p className="font-bold text-ink-500 uppercase tracking-wider text-[10px]">Maintenance Fee</p>
                <p className="text-xl font-mono font-bold text-ink-900">{finSettings ? formatINR(finSettings.platformMaintenanceFeePaise) : "—"}</p>
                <p className="text-[10px] text-ink-400">Charged once per checkout</p>
              </div>

              <div className="bg-cream-50/70 p-3.5 rounded-xl border border-ink-50 space-y-1">
                <p className="font-bold text-ink-500 uppercase tracking-wider text-[10px]">Free Delivery Threshold</p>
                <p className="text-xl font-mono font-bold text-emerald-700">{finSettings ? formatINR(finSettings.freeDeliveryThresholdPaise) : "—"}</p>
                <p className="text-[10px] text-ink-400">Pre-recovery product threshold</p>
              </div>

              <div className="bg-cream-50/70 p-3.5 rounded-xl border border-ink-50 space-y-1">
                <p className="font-bold text-ink-500 uppercase tracking-wider text-[10px]">Delivery Recovery</p>
                <p className="text-xl font-mono font-bold text-emerald-700">{finSettings ? formatINR(finSettings.freeDeliveryRecoveryPaise) : "—"}</p>
                <p className="text-[10px] text-ink-400">Recovery added to free items</p>
              </div>
            </div>
          )}
        </div>

        {/* 2. RECALCULATION PROGRESS BAR (If actively running) */}
        {activeJob && (
          <div className="bg-white rounded-2xl border border-forest-200 p-5 shadow-sm space-y-3 bg-forest-50/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-forest-600 animate-ping" />
                <span className="text-xs font-bold text-ink-900">
                  Recalculation Job in Progress {activeJobPolicy && `(Policy v${activeJobPolicy.versionNumber})`}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-forest-700">
                Batch {activeJob.currentBatch} of {activeJob.totalBatches} ({activeJob.processedListings} / {activeJob.totalListings} listings)
              </span>
            </div>

            <div className="w-full h-2.5 bg-ink-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-600 transition-all duration-300 rounded-full"
                style={{
                  width: `${activeJob.totalListings > 0 ? (activeJob.processedListings / activeJob.totalListings) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* 3. POLICY VERSIONS HISTORY TABLE */}
        <div className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden space-y-0">
          <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-ink-900">Policy Version History</h3>
              <p className="text-[11px] text-ink-400">Immutable ledger of platform pricing versions, recalculations, and activations.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cream-50/60 border-b border-ink-100 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Floria Profit</th>
                  <th className="py-3 px-4">Maint. Fee</th>
                  <th className="py-3 px-4">Free Threshold</th>
                  <th className="py-3 px-4">Recovery</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {policies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-400">
                      No policy versions found.
                    </td>
                  </tr>
                ) : (
                  policies.map((p) => {
                    const isLive = p.status === "active";
                    const isDraft = p.status === "draft";
                    const isReady = p.status === "ready";
                    const isPreparing = p.status === "preparing";

                    let statusBadgeClass = "bg-ink-100 text-ink-600";
                    if (isLive) statusBadgeClass = "bg-forest-100 text-forest-800 border border-forest-200";
                    else if (isReady) statusBadgeClass = "bg-emerald-100 text-emerald-800";
                    else if (isDraft) statusBadgeClass = "bg-amber-100 text-amber-800";
                    else if (isPreparing) statusBadgeClass = "bg-blue-100 text-blue-800";

                    return (
                      <tr key={p.id} className="hover:bg-cream-50/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-ink-900">
                          v{p.versionNumber}
                          {p.notes && <span className="block text-[10px] text-ink-400 font-sans font-normal truncate max-w-[140px]">{p.notes}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">{p.sellerCommissionRate}%</td>
                        <td className="py-3 px-4 font-mono">{p.floriaProfitRate}%</td>
                        <td className="py-3 px-4 font-mono">{formatINR(p.platformMaintenanceFeePaise)}</td>
                        <td className="py-3 px-4 font-mono">{formatINR(p.freeDeliveryThresholdPaise)}</td>
                        <td className="py-3 px-4 font-mono">{formatINR(p.freeDeliveryRecoveryPaise)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview Impact */}
                            <button
                              type="button"
                              onClick={() => handlePreviewImpact(p)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-ink-200 hover:border-ink-300 text-ink-700 bg-white"
                            >
                              Preview
                            </button>

                            {/* Recalculate */}
                            {(isDraft || isReady) && (
                              <button
                                type="button"
                                disabled={saving || activeJob?.status === "in_progress"}
                                onClick={() => handleStartRecalculation(p)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
                              >
                                Recalculate
                              </button>
                            )}

                            {/* Activate */}
                            {(isDraft || isReady) && (
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleActivatePolicy(p)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-forest-700 hover:bg-forest-800 text-white"
                              >
                                Activate
                              </button>
                            )}

                            {isLive && (
                              <span className="text-[10px] font-bold text-forest-700 px-2 py-1">
                                ✓ Live Active
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── MODAL: CREATE DRAFT POLICY ── */}
        {showDraftModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-ink-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-ink-900">Create Draft Pricing Policy</h3>
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateDraftPolicy} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Seller Commission (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      required
                      value={draftCommissionRate}
                      onChange={(e) => setDraftCommissionRate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                    />
                    <p className="text-[10px] text-ink-400 mt-1">Deducted from seller base price</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Floria Profit Margin (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      required
                      value={draftProfitRate}
                      onChange={(e) => setDraftProfitRate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                    />
                    <p className="text-[10px] text-ink-400 mt-1">Added to product price</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Maint. Fee (₹)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={draftMaintenanceFeeINR}
                      onChange={(e) => setDraftMaintenanceFeeINR(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Free Threshold (₹)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={draftThresholdINR}
                      onChange={(e) => setDraftThresholdINR(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Recovery (₹)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={draftRecoveryINR}
                      onChange={(e) => setDraftRecoveryINR(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Policy Notes / Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Q4 Festive season commission adjustments"
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDraftModal(false)}
                    className="w-1/2 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl border border-ink-200 hover:border-ink-400 text-ink-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-1/2 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl bg-forest-700 hover:bg-forest-800 text-white transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving ? "Creating…" : "Create Draft"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL: PREVIEW POLICY IMPACT ── */}
        {previewingPolicy && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-ink-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-ink-900">
                  Impact Preview: Policy v{previewingPolicy.versionNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => setPreviewingPolicy(null)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {previewLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-ink-400">Simulating price recalculation across catalog...</p>
                </div>
              ) : previewData ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-cream-50 p-3 rounded-xl border border-ink-100">
                      <span className="text-[10px] uppercase font-bold text-ink-400 block">Total Listings</span>
                      <span className="text-base font-mono font-bold text-ink-900">{previewData.affectedListingsCount}</span>
                    </div>

                    <div className="bg-cream-50 p-3 rounded-xl border border-ink-100">
                      <span className="text-[10px] uppercase font-bold text-ink-400 block">Avg Price Delta</span>
                      <span className={`text-base font-mono font-bold ${previewData.averageCustomerPriceChangePaise >= 0 ? "text-forest-700" : "text-amber-700"}`}>
                        {previewData.averageCustomerPriceChangePaise >= 0 ? "+" : ""}{formatINR(previewData.averageCustomerPriceChangePaise)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-forest-50/50 rounded-xl border border-forest-100 space-y-2">
                    <div className="flex justify-between text-ink-700">
                      <span>Free Delivery Eligible Listings:</span>
                      <span className="font-bold text-forest-800">{previewData.freeDeliveryEligibleListingsCount}</span>
                    </div>
                    <div className="flex justify-between text-ink-700">
                      <span>Price Increases:</span>
                      <span className="font-bold text-amber-700">{previewData.priceIncreaseCount}</span>
                    </div>
                    <div className="flex justify-between text-ink-700">
                      <span>Price Decreases:</span>
                      <span className="font-bold text-emerald-700">{previewData.priceDecreaseCount}</span>
                    </div>
                    <div className="flex justify-between text-ink-700">
                      <span>Unchanged:</span>
                      <span className="font-bold text-ink-600">{previewData.priceUnchangedCount}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewingPolicy(null)}
                    className="w-full py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl bg-forest-700 hover:bg-forest-800 text-white transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              ) : (
                <p className="text-xs text-ink-400 py-4 text-center">Unable to load simulation data.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
