"use client";

import { useState } from "react";
import { useToast } from "@/lib/contexts/ToastContext";
import { SettingsIcon, SlidersIcon } from "@/components/ui/Icons";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [commissionRate, setCommissionRate] = useState("10");
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState("15");
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(
        "Settings Saved",
        "Platform policies updated successfully.",
      );
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
          Platform Governance Settings
        </h1>
        <p className="text-xs text-ink-500 mt-1">
          Marketplace fee structure, delivery radius limits, and botanical
          quality controls
        </p>
      </div>

      <div className="max-w-2xl bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-xs space-y-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
              Standard Marketplace Take Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
            />
            <p className="text-[10px] text-ink-500 mt-1">
              Base commission deducted from nursery partner sales.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
              Maximum Urban Delivery Radius (KM)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={deliveryRadiusKm}
              onChange={(e) => setDeliveryRadiusKm(e.target.value)}
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
            />
            <p className="text-[10px] text-ink-500 mt-1">
              Hyperlocal delivery range from nursery location.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="py-2.5 px-6 bg-forest-900 hover:bg-forest-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
          >
            {saving ? "Saving Policy..." : "Update Platform Policy"}
          </button>
        </form>
      </div>
    </div>
  );
}
