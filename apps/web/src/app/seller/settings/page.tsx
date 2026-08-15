"use client";

import Link from "next/link";
import { Settings, User, Bell, Shield } from "lucide-react";

export default function SellerSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Portal Settings</h1>
        <p className="text-xs text-ink-400 mt-0.5">Configure notification frequencies, security settings, and profile verification parameters.</p>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 divide-y divide-ink-100 shadow-xs">
        <Link href="/seller/profile" className="p-5 flex justify-between items-center hover:bg-cream-50/50 transition-colors group">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-ink-900 text-xs">Nursery Profile Details</h3>
              <p className="text-[10px] text-ink-400 mt-0.5">Manage business description, contact details, bank accounts, and verification documents.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-forest-700 group-hover:translate-x-0.5 transition-transform uppercase tracking-wider">Configure →</span>
        </Link>

        <div className="p-5 flex justify-between items-center opacity-60">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-bold text-ink-900 text-xs">Notification Preferences</h3>
              <p className="text-[10px] text-ink-400 mt-0.5">Receive real-time email alerts for incoming orders or inventory reorder alerts.</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-ink-100 text-ink-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Disabled</span>
        </div>

        <div className="p-5 flex justify-between items-center opacity-60">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-ink-900 text-xs">Security & Authentication</h3>
              <p className="text-[10px] text-ink-400 mt-0.5">Two-factor authentication, security access logs, and authorized staff tokens.</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-ink-100 text-ink-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Disabled</span>
        </div>
      </div>
    </div>
  );
}
