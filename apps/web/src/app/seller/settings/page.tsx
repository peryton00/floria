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
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Portal Settings</h1>
        <p className="text-xs text-ink-400 mt-0.5">Configure notification frequencies, security settings, and profile verification parameters.</p>
      </div>

      {message && (
        <div className="p-3 bg-success-50 border border-success-100 rounded-xl text-xs text-success-700 font-medium flex items-center gap-2">
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-ink-100 divide-y divide-ink-100 shadow-xs">
        {/* Profile Link */}
        <Link href="/seller/profile" className="p-5 flex justify-between items-center hover:bg-cream-50/50 transition-colors group">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-ink-900 text-xs">Nursery Profile Details</h3>
              <p className="text-[10px] text-ink-400 mt-0.5">Manage business description, contact details, address, and verification documents.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-forest-700 group-hover:translate-x-0.5 transition-transform uppercase tracking-wider">Configure →</span>
        </Link>

        {/* Notification Settings Toggle Group */}
        <div className="p-5 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center flex-shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-bold text-ink-900 text-xs">Notification Preferences</h3>
              <p className="text-[10px] text-ink-400 mt-0.5">Control which event notifications generate alerts for your nursery dashboard.</p>
            </div>
          </div>

          {loading ? (
            <div className="py-4 flex justify-center text-ink-400">
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : (
            <div className="pl-14 space-y-3 text-xs border-t border-ink-100 pt-4">
              {/* New Order Notifications */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-ink-900">New Order Alerts</p>
                  <p className="text-[10px] text-ink-400">Receive instant notifications when a customer places an order containing your nursery products.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("new_order_notifications")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    settings.new_order_notifications ? "bg-forest-700" : "bg-ink-200"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform transform shadow-sm ${
                      settings.new_order_notifications ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Low Stock Notifications */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-ink-900">Low Stock & Out of Stock Alerts</p>
                  <p className="text-[10px] text-ink-400">Receive reorder warnings when plant inventory drops below threshold limits.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("low_stock_notifications")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    settings.low_stock_notifications ? "bg-forest-700" : "bg-ink-200"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform transform shadow-sm ${
                      settings.low_stock_notifications ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-ink-900">Email Digest Notifications</p>
                  <p className="text-[10px] text-ink-400">Send daily digest and operational updates to your registered contact email.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("email_notifications")}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    settings.email_notifications ? "bg-forest-700" : "bg-ink-200"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform transform shadow-sm ${
                      settings.email_notifications ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="p-5 flex justify-between items-center opacity-70">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-ink-900 text-xs">Security & Authentication</h3>
              <p className="text-[10px] text-ink-400 mt-0.5">JWT token authentication managed securely via Supabase Auth.</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-success-50 text-success-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Active</span>
        </div>
      </div>
    </div>
  );
}
