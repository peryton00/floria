"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { PayoutIcon, ShieldIcon, CheckIcon, AlertIcon } from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";
import type { FinancialSettings } from "@floria/types";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [finSettings, setFinSettings] = useState<FinancialSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Pricing Policy Modal State
  const [editingPricingPolicy, setEditingPricingPolicy] = useState(false);
  const [editCommissionRate, setEditCommissionRate] = useState("12.0");
  const [editProfitRate, setEditProfitRate] = useState("2.0");
  const [editMaintenanceFeeINR, setEditMaintenanceFeeINR] = useState("10.00");
  const [editThresholdINR, setEditThresholdINR] = useState("599.00");
  const [editRecoveryINR, setEditRecoveryINR] = useState("20.00");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getFinancialSettings();
      if (res.success && res.data) {
        setFinSettings(res.data);
      } else {
        setError(res.error?.message || "Failed to load platform financial settings");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to Floria API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleOpenEditPricingPolicy = () => {
    if (finSettings) {
      setEditCommissionRate(String(finSettings.sellerCommissionRate));
      setEditProfitRate(String(finSettings.floriaProfitRate));
      setEditMaintenanceFeeINR((finSettings.platformMaintenanceFeePaise / 100).toFixed(2));
      setEditThresholdINR((finSettings.freeDeliveryThresholdPaise / 100).toFixed(2));
      setEditRecoveryINR((finSettings.freeDeliveryRecoveryPaise / 100).toFixed(2));
    }
    setEditingPricingPolicy(true);
    setError(null);
  };

  const handleSavePricingPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    const commRate = parseFloat(editCommissionRate);
    const profitRate = parseFloat(editProfitRate);
    const maintenancePaise = Math.round(parseFloat(editMaintenanceFeeINR) * 100);
    const thresholdPaise = Math.round(parseFloat(editThresholdINR) * 100);
    const recoveryPaise = Math.round(parseFloat(editRecoveryINR) * 100);

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
      const res = await api.updateFinancialSettings({
        sellerCommissionRate: commRate,
        floriaProfitRate: profitRate,
        platformMaintenanceFeePaise: maintenancePaise,
        freeDeliveryThresholdPaise: thresholdPaise,
        freeDeliveryRecoveryPaise: recoveryPaise,
      });

      if (res.success && res.data) {
        setFinSettings(res.data);
        setEditingPricingPolicy(false);
        toast.success("Pricing policy updated", "Changes saved successfully in database and audit logged.");
      } else {
        const errMsg = res.error?.message || "Failed to update pricing policy";
        setError(errMsg);
        toast.error("Unable to update pricing policy", errMsg);
      }
    } catch (e: any) {
      const errMsg = e.message || "Error saving pricing policy";
      setError(errMsg);
      toast.error("Unable to update pricing policy", errMsg);
    } finally {
      setSaving(false);
    }
  };

  const formatINR = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Platform Settings &amp; Governance</h1>
          <p className="text-xs text-ink-400 mt-0.5">Database-backed marketplace configuration, commission rates, pricing policies, and security parameters.</p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700 flex items-start gap-2">
            <AlertIcon size={16} className="text-error-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Floria Unified Pricing Policy Section */}
        <div className="bg-white rounded-xl border border-ink-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-ink-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center font-bold">
                🏷️
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-900">FLORIA PRICING POLICY</h2>
                <p className="text-xs text-ink-400">Database-backed parameters governing seller commission, internal profit margin, checkout maintenance fee, and product-level free delivery recovery.</p>
              </div>
            </div>

            <button
              type="button"
              disabled={loading || saving}
              onClick={handleOpenEditPricingPolicy}
              className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
            >
              Edit Pricing Policy
            </button>
          </div>

          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
              <div className="bg-cream-50 p-4 rounded-xl space-y-1">
                <p className="font-semibold text-ink-500 uppercase tracking-wider text-[10px]">Seller Commission</p>
                <p className="text-xl font-mono font-bold text-amber-700">{finSettings?.sellerCommissionRate ?? 12}%</p>
                <p className="text-[10px] text-ink-400">Deducted from seller base price.</p>
              </div>

              <div className="bg-cream-50 p-4 rounded-xl space-y-1">
                <p className="font-semibold text-ink-500 uppercase tracking-wider text-[10px]">Floria Profit</p>
                <p className="text-xl font-mono font-bold text-forest-700">{finSettings?.floriaProfitRate ?? 2}%</p>
                <p className="text-[10px] text-ink-400">Added to product price (Internal).</p>
              </div>

              <div className="bg-cream-50 p-4 rounded-xl space-y-1">
                <p className="font-semibold text-ink-500 uppercase tracking-wider text-[10px]">Maintenance Fee</p>
                <p className="text-xl font-mono font-bold text-stone-800">{formatINR(finSettings?.platformMaintenanceFeePaise ?? 1000)}</p>
                <p className="text-[10px] text-ink-400">Charged once at checkout.</p>
              </div>

              <div className="bg-cream-50 p-4 rounded-xl space-y-1">
                <p className="font-semibold text-ink-500 uppercase tracking-wider text-[10px]">Free Delivery Threshold</p>
                <p className="text-xl font-mono font-bold text-emerald-700">{formatINR(finSettings?.freeDeliveryThresholdPaise ?? 59900)}</p>
                <p className="text-[10px] text-ink-400">Per product eligibility threshold.</p>
              </div>

              <div className="bg-cream-50 p-4 rounded-xl space-y-1">
                <p className="font-semibold text-ink-500 uppercase tracking-wider text-[10px]">Delivery Recovery</p>
                <p className="text-xl font-mono font-bold text-emerald-700">{formatINR(finSettings?.freeDeliveryRecoveryPaise ?? 2000)}</p>
                <p className="text-[10px] text-ink-400">Hidden recovery for free items.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Edit Pricing Policy */}
        {editingPricingPolicy && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-ink-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-ink-900">Edit Floria Pricing Policy</h3>
                <button
                  type="button"
                  onClick={() => setEditingPricingPolicy(false)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePricingPolicy} className="space-y-4">
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
                      value={editCommissionRate}
                      onChange={(e) => setEditCommissionRate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                    />
                    <p className="text-[10px] text-ink-400 mt-1">Deducted from seller's base price.</p>
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
                      value={editProfitRate}
                      onChange={(e) => setEditProfitRate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                    />
                    <p className="text-[10px] text-ink-400 mt-1">Added to product price (Internal).</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Maintenance Fee (₹)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={editMaintenanceFeeINR}
                      onChange={(e) => setEditMaintenanceFeeINR(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white font-mono"
                    />
                    <p className="text-[10px] text-ink-400 mt-1">Once per checkout.</p>
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
                      value={editThresholdINR}
                      onChange={(e) => setEditThresholdINR(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white font-mono"
                    />
                    <p className="text-[10px] text-ink-400 mt-1">Per product threshold.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Delivery Recovery (₹)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={editRecoveryINR}
                      onChange={(e) => setEditRecoveryINR(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white font-mono"
                    />
                    <p className="text-[10px] text-ink-400 mt-1">Hidden delivery recovery.</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving Changes..." : "Save Financial Settings"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPricingPolicy(false)}
                    className="px-4 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-bold text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delivery Fee Settings & Interactive Calculation Preview */}
        <div className="bg-white rounded-xl border border-ink-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-ink-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg">
                🚚
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-900">Platform Delivery Fee Engine &amp; Policy</h2>
                <p className="text-xs text-ink-400">Server-authoritative delivery rules, minimum order thresholds, and single master order fee mode.</p>
              </div>
            </div>
          </div>

          {/* Delivery Policy Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-cream-50 p-4 rounded-xl space-y-1">
              <p className="font-semibold text-ink-500 uppercase tracking-wider text-[10px]">Delivery Engine Status</p>
              <p className="text-lg font-bold text-emerald-700">ACTIVE (Enabled)</p>
              <p className="text-[11px] text-ink-400">Calculated server-side during checkout.</p>
            </div>

            <div className="bg-cream-50 p-4 rounded-xl space-y-1">
              <p className="font-semibold text-ink-500 uppercase tracking-wider text-[10px]">Base Delivery Fee</p>
              <p className="text-lg font-mono font-bold text-stone-800">₹40.00</p>
              <p className="text-[11px] text-ink-400">Charged on orders below free threshold.</p>
            </div>

            <div className="bg-cream-50 p-4 rounded-xl space-y-1">
              <p className="font-semibold text-ink-500 uppercase tracking-wider text-[10px]">Free Delivery Threshold</p>
              <p className="text-lg font-mono font-bold text-emerald-700">{formatINR(finSettings?.freeDeliveryThresholdPaise ?? 59900)}</p>
              <p className="text-[11px] text-ink-400">Product price &gt;= threshold receives free delivery.</p>
            </div>

            <div className="bg-cream-50 p-4 rounded-xl space-y-1">
              <p className="font-semibold text-ink-500 uppercase tracking-wider text-[10px]">Delivery Mode</p>
              <p className="text-base font-bold text-stone-800">Master Order Fee</p>
              <p className="text-[11px] text-ink-400">1 fee per order across multiple nurseries.</p>
            </div>
          </div>

          {/* Interactive Delivery Fee Calculation Preview Tool */}
          <div className="border border-stone-200 rounded-xl p-5 bg-stone-900 text-stone-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Admin Inspection Tool</span>
                <h3 className="text-sm font-bold text-stone-100 mt-0.5">Interactive Delivery Calculation Preview</h3>
              </div>
              <span className="text-xs font-mono text-stone-400 bg-stone-800 px-2.5 py-1 rounded-full">Server Engine Test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Eligible Order Subtotal (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-stone-400">₹</span>
                  <input
                    type="number"
                    step="1"
                    defaultValue="850"
                    id="previewSubtotalInput"
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono rounded-lg bg-stone-950 border border-stone-700 text-stone-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const el = document.getElementById("previewSubtotalInput") as HTMLInputElement;
                  const val = parseFloat(el?.value || "850");
                  const paise = Math.round(val * 100);
                  const res = await api.previewDeliveryFee(paise);
                  const resEl = document.getElementById("previewResultDisplay");
                  if (resEl && res.success && res.data) {
                    resEl.innerHTML = `
                      <div class="space-y-1">
                        <div class="flex justify-between items-center text-xs">
                          <span class="text-stone-400">Final Delivery Fee:</span>
                          <span class="font-mono font-bold ${res.data.isFreeDelivery ? "text-emerald-400" : "text-amber-400"}">
                            ${res.data.isFreeDelivery ? "₹0.00 (FREE)" : `₹${(res.data.deliveryFeePaise / 100).toFixed(2)}`}
                          </span>
                        </div>
                        <div class="flex justify-between items-center text-[11px] text-stone-400">
                          <span>Applied Rule Reason:</span>
                          <span class="font-mono text-stone-200">${res.data.reason}</span>
                        </div>
                        <div class="flex justify-between items-center text-[11px] text-stone-400">
                          <span>Threshold Target:</span>
                          <span class="font-mono">₹${(res.data.thresholdPaise / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    `;
                  }
                }}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
              >
                Test Calculation
              </button>

              <div id="previewResultDisplay" className="p-3 rounded-lg bg-stone-950 border border-stone-800 min-h-[50px] flex items-center justify-center text-xs text-stone-400">
                Enter subtotal above &amp; click Test Calculation.
              </div>
            </div>
          </div>
        </div>

        {/* Security & System Info */}
        <div className="bg-white rounded-xl border border-ink-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center">
              <ShieldIcon size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink-900">System Environment &amp; Security Policy</h2>
              <p className="text-xs text-ink-400">Platform operational bounds and authorization rules.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-ink-100">
              <span className="text-ink-500 font-semibold">Backend REST API Endpoint:</span>
              <span className="font-mono text-ink-900 font-bold">/api/v1/* (Express + Node.js)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-ink-100">
              <span className="text-ink-500 font-semibold">Authentication Identity Provider:</span>
              <span className="font-mono text-ink-900 font-bold">Supabase Auth (JWT auth.uid())</span>
            </div>
            <div className="flex justify-between py-2 border-b border-ink-100">
              <span className="text-ink-500 font-semibold">Database Configuration Authority:</span>
              <span className="font-mono text-ink-900 font-bold">platform_settings (RLS Enforced)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-ink-500 font-semibold">Platform Version:</span>
              <span className="font-mono text-forest-700 font-bold">Floria Marketplace v3.9.1</span>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
