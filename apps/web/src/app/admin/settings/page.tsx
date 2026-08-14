"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { PayoutIcon, ShieldIcon, CheckIcon, AlertIcon } from "@/components/ui/Icons";

export default function AdminSettingsPage() {
  const [commissionRate, setCommissionRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [inputRate, setInputRate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPlatformSettings();
      if (res.success && res.data) {
        setCommissionRate(res.data.commissionRate);
      } else {
        setError(res.error?.message || "Failed to load platform settings");
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

  const handleOpenEdit = () => {
    setInputRate(commissionRate !== null ? String(commissionRate) : "12.0");
    setEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = parseFloat(inputRate);

    if (isNaN(parsedRate) || !isFinite(parsedRate)) {
      setError("Please enter a valid numeric commission percentage rate.");
      return;
    }

    if (parsedRate < 0.0) {
      setError("Commission rate cannot be negative.");
      return;
    }

    if (parsedRate > 50.0) {
      setError("Commission rate cannot exceed maximum technical limit of 50.0%.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await api.updateCommissionRate(parsedRate);

      if (res.success && res.data) {
        setCommissionRate(res.data.commissionRate);
        setEditing(false);
        setSuccessMessage(`Platform commission rate updated to ${res.data.commissionRate}% in database and audit logged.`);
      } else {
        setError(res.error?.message || "Failed to update commission rate");
      }
    } catch (e: any) {
      setError(e.message || "Error saving platform settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Platform Settings & Governance</h1>
          <p className="text-xs text-ink-400 mt-0.5">Database-backed marketplace configuration, commission rates, and security parameters.</p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700 flex items-start gap-2">
            <AlertIcon size={16} className="text-error-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-success-50 border border-success-100 rounded-xl p-4 text-xs text-success-700 flex items-start gap-2">
            <CheckIcon size={16} className="text-success-600 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Commission Rate Settings */}
        <div className="bg-white rounded-xl border border-ink-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-ink-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center">
                <PayoutIcon size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-900">Marketplace Commission Rate</h2>
                <p className="text-xs text-ink-400">Server-authoritative database rate applied to new order subtotals.</p>
              </div>
            </div>

            <button
              type="button"
              disabled={loading || editing}
              onClick={handleOpenEdit}
              className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
            >
              Configure Rate
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-cream-50 p-4 rounded-xl space-y-1">
              <p className="font-semibold text-ink-500 uppercase tracking-wider text-[10px]">Database Configured Commission Rate</p>
              {loading ? (
                <div className="h-8 w-24 bg-ink-200/60 rounded-md animate-pulse my-1" />
              ) : (
                <p className="text-2xl font-serif font-bold text-forest-800">
                  {commissionRate !== null ? `${commissionRate}%` : "Not Configured"}
                </p>
              )}
              <p className="text-[11px] text-ink-400">Calculated server-side during checkout. Historical orders snapshot rates immutably.</p>
            </div>

            <div className="bg-cream-50 p-4 rounded-xl space-y-1">
              <p className="font-semibold text-ink-500 uppercase tracking-wider text-[10px]">Financial Settlement Formula</p>
              <p className="text-base font-bold text-ink-900">Direct Nursery Net Payout</p>
              <p className="text-[11px] text-ink-400">
                Net seller payout = Subtotal - ({commissionRate !== null ? `${commissionRate}%` : "Commission Rate"}).
              </p>
            </div>
          </div>
        </div>

        {/* Modal: Edit Commission Rate */}
        {editing && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-ink-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-ink-900">Configure Platform Commission Rate</h3>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCommission} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Platform Revenue Share Percentage (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      required
                      value={inputRate}
                      onChange={(e) => setInputRate(e.target.value)}
                      placeholder="e.g. 12.0"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xs text-ink-400">%</span>
                  </div>
                  <p className="text-[10px] text-ink-400 mt-1">
                    Technical validation bounds: 0.0% to 50.0%. Updating rate generates an immutable audit record and applies to all new checkouts.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving to Database..." : "Save Setting"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-bold text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Security & System Info */}
        <div className="bg-white rounded-xl border border-ink-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center">
              <ShieldIcon size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink-900">System Environment & Security Policy</h2>
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
