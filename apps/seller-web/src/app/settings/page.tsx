"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, type SellerNotificationSettings } from "@/lib/api";
import { User, Bell, Shield, Loader2, CheckCircle2 } from "lucide-react";

export default function SellerSettingsPage() {
  const [settings, setSettings] = useState<SellerNotificationSettings>({
    seller_id: "",
    new_order_notifications: true,
    low_stock_notifications: true,
    email_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSellerNotificationSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (e) {
      console.error("[SellerSettingsPage] fetchSettings error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleToggle(key: keyof SellerNotificationSettings) {
    if (saving) return;
    const newValue = !settings[key];
    const newSettings = { ...settings, [key]: newValue };
    setSettings(newSettings);

    try {
      setSaving(true);
      setMessage(null);
      const res = await api.updateSellerNotificationSettings({ [key]: newValue });
      if (res.success && res.data) {
        setMessage("Notification settings saved.");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error("[SellerSettingsPage] updateSettings error:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Seller Cockpit Settings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Configure notification frequencies, storefront security parameters, and profile preferences.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-1">
            System Preferences
          </span>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      <div className="bg-white rounded border border-[#E2E8F0] divide-y divide-[#E2E8F0] shadow-xs overflow-hidden">
        {/* Profile Link */}
        <Link href="/seller/profile" className="p-5 flex justify-between items-center hover:bg-slate-50/80 transition-colors group">
          <div className="flex gap-3.5 items-center">
            <div className="w-9 h-9 rounded bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center shadow-xs">
              <User size={18} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-[#0F172A] text-sm">Nursery Profile &amp; Storefront Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage business description, contact details, dispatch address, and brand logo.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#1B4D3E] group-hover:translate-x-1 transition-transform uppercase tracking-wider font-mono">Configure →</span>
        </Link>

        {/* Notification Settings Toggle Group */}
        <div className="p-5 space-y-4">
          <div className="flex gap-3.5 items-center">
            <div className="w-9 h-9 rounded bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-[#0F172A] text-sm">Notification Preferences</h3>
              <p className="text-xs text-slate-500 mt-0.5">Control which order and stock events trigger live alerts on your nursery control center.</p>
            </div>
          </div>

          {loading ? (
            <div className="py-4 flex justify-center text-[#1B4D3E]">
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : (
            <div className="space-y-3 text-xs border-t border-[#E2E8F0] pt-4">
              {/* New Order Notifications */}
              <div className="flex justify-between items-center gap-4 bg-[#F8FAFC] p-3.5 rounded border border-[#E2E8F0]">
                <div>
                  <p className="font-bold text-[#0F172A] text-xs sm:text-sm">New Order Alerts</p>
                  <p className="text-xs text-slate-500 mt-0.5">Receive instant notifications when a customer places an order containing your nursery products.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("new_order_notifications")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none flex-shrink-0 ${
                    settings.new_order_notifications ? "bg-[#1B4D3E]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm ${
                      settings.new_order_notifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Low Stock Notifications */}
              <div className="flex justify-between items-center gap-4 bg-[#F8FAFC] p-3.5 rounded border border-[#E2E8F0]">
                <div>
                  <p className="font-bold text-[#0F172A] text-xs sm:text-sm">Low Stock &amp; Inventory Alerts</p>
                  <p className="text-xs text-slate-500 mt-0.5">Receive replenishment warnings when plant inventory drops below threshold limits.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("low_stock_notifications")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none flex-shrink-0 ${
                    settings.low_stock_notifications ? "bg-[#1B4D3E]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm ${
                      settings.low_stock_notifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex justify-between items-center gap-4 bg-[#F8FAFC] p-3.5 rounded border border-[#E2E8F0]">
                <div>
                  <p className="font-bold text-[#0F172A] text-xs sm:text-sm">Email Digest Updates</p>
                  <p className="text-xs text-slate-500 mt-0.5">Send daily summary and operational fulfillment alerts to your registered email.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("email_notifications")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none flex-shrink-0 ${
                    settings.email_notifications ? "bg-[#1B4D3E]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm ${
                      settings.email_notifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="p-5 flex justify-between items-center bg-[#F8FAFC]">
          <div className="flex gap-3.5 items-center">
            <div className="w-9 h-9 rounded bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center shadow-xs">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-[#0F172A] text-sm">Security &amp; Authorization</h3>
              <p className="text-xs text-slate-500 mt-0.5">Session security and token authentication managed via Floria backend security layer.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded uppercase tracking-wider">Active</span>
        </div>
      </div>
    </div>
  );
}

