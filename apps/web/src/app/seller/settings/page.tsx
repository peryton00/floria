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
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-ui">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">Portal Settings</h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">Configure notification frequencies, storefront security parameters, and profile preferences.</p>
      </div>

      {message && (
        <div className="p-4 bg-forest-50 border border-forest-200 rounded-2xl text-xs text-forest-800 font-bold flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 size={18} /> {message}
        </div>
      )}

      <div className="bg-floria-linen rounded-3xl border border-floria-border divide-y divide-floria-border shadow-xs overflow-hidden">
        {/* Profile Link */}
        <Link href="/seller/profile" className="p-6 flex justify-between items-center hover:bg-floria-soft-sand/60 transition-colors group">
          <div className="flex gap-4 items-center">
            <div className="w-11 h-11 rounded-2xl bg-forest-50 text-forest-800 border border-forest-200/70 flex items-center justify-center shadow-2xs">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-ink-900 text-sm sm:text-base">Nursery Profile &amp; Storefront Details</h3>
              <p className="text-xs text-ink-500 mt-0.5">Manage business description, contact details, dispatch address, and brand logo.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-forest-800 group-hover:translate-x-1 transition-transform uppercase tracking-wider">Configure →</span>
        </Link>

        {/* Notification Settings Toggle Group */}
        <div className="p-6 space-y-5">
          <div className="flex gap-4 items-center">
            <div className="w-11 h-11 rounded-2xl bg-forest-50 text-forest-800 border border-forest-200/70 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-ink-900 text-sm sm:text-base">Notification Preferences</h3>
              <p className="text-xs text-ink-500 mt-0.5">Control which order and stock events trigger live alerts on your nursery control center.</p>
            </div>
          </div>

          {loading ? (
            <div className="py-4 flex justify-center text-forest-800">
              <Loader2 className="animate-spin" size={22} />
            </div>
          ) : (
            <div className="sm:pl-15 space-y-4 text-xs border-t border-floria-border pt-5">
              {/* New Order Notifications */}
              <div className="flex justify-between items-center gap-4 bg-floria-soft-sand p-4 rounded-2xl border border-floria-border/70">
                <div>
                  <p className="font-bold text-ink-900 text-xs sm:text-sm">New Order Alerts</p>
                  <p className="text-xs text-ink-500 mt-0.5">Receive instant notifications when a customer places an order containing your nursery products.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("new_order_notifications")}
                  className={`w-12 h-6.5 rounded-full transition-colors relative focus:outline-none flex-shrink-0 ${
                    settings.new_order_notifications ? "bg-forest-800" : "bg-floria-sand border border-floria-border"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform transform shadow-sm ${
                      settings.new_order_notifications ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Low Stock Notifications */}
              <div className="flex justify-between items-center gap-4 bg-floria-soft-sand p-4 rounded-2xl border border-floria-border/70">
                <div>
                  <p className="font-bold text-ink-900 text-xs sm:text-sm">Low Stock &amp; Inventory Alerts</p>
                  <p className="text-xs text-ink-500 mt-0.5">Receive replenishment warnings when plant inventory drops below threshold limits.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("low_stock_notifications")}
                  className={`w-12 h-6.5 rounded-full transition-colors relative focus:outline-none flex-shrink-0 ${
                    settings.low_stock_notifications ? "bg-forest-800" : "bg-floria-sand border border-floria-border"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform transform shadow-sm ${
                      settings.low_stock_notifications ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex justify-between items-center gap-4 bg-floria-soft-sand p-4 rounded-2xl border border-floria-border/70">
                <div>
                  <p className="font-bold text-ink-900 text-xs sm:text-sm">Email Digest Updates</p>
                  <p className="text-xs text-ink-500 mt-0.5">Send daily summary and operational fulfillment alerts to your registered email.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("email_notifications")}
                  className={`w-12 h-6.5 rounded-full transition-colors relative focus:outline-none flex-shrink-0 ${
                    settings.email_notifications ? "bg-forest-800" : "bg-floria-sand border border-floria-border"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform transform shadow-sm ${
                      settings.email_notifications ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="p-6 flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <div className="w-11 h-11 rounded-2xl bg-forest-50 text-forest-800 border border-forest-200/70 flex items-center justify-center shadow-2xs">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-ink-900 text-sm sm:text-base">Security &amp; Authorization</h3>
              <p className="text-xs text-ink-500 mt-0.5">Session security and token authentication managed via Floria backend security layer.</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-forest-50 text-forest-800 border border-forest-200 px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">Active</span>
        </div>
      </div>
    </div>
  );
}
