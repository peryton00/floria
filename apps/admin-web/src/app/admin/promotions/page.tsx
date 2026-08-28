"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { AlertIcon, VerifiedIcon } from "@/components/ui/Icons";

export default function AdminPromotionsPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Marketing & Promotions</h1>
          <p className="text-xs text-ink-400 mt-0.5">Manage platform discount campaigns, coupons, and customer referral eligibility rules.</p>
        </div>

        {/* Not yet available notice */}
        <div className="bg-white rounded-xl border border-ink-100 p-8 shadow-xs max-w-2xl space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-warning-50 text-warning-700 flex items-center justify-center flex-shrink-0 animate-pulse">
              <VerifiedIcon size={24} />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-ink-900 leading-tight">Module: Promotions & Coupons — Future Module Placeholder</h2>
              <p className="text-xs text-ink-500 leading-relaxed">
                The campaign and coupon management module is designed to authorize promotional discounts, validate coupon expiry/limits, and check referral logic. This module is currently a placeholder because the core discounts persistence is not implemented in the current database schema.
              </p>
            </div>
          </div>

          <hr className="border-ink-100" />

          {/* Missing dependencies explanation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700">Planned Database Schema Requirements</h3>
            <ul className="space-y-2.5 text-xs text-ink-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-ink-800">Coupons & Campaigns Table:</span> A schema definition (e.g. `promotions_coupons`) mapping `code` (unique text key), `discount_type` (fixed amount vs percentage), `discount_value` (integer paise or percentage points), `min_order_value_paise` (integer), `usage_limit` (integer), `expiry_date` timestamp, and `is_active` (boolean).
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-ink-800">Server-Side Discount Validation:</span> Integrating coupon codes directly into the Checkout API controller so that discount subtotals are verified and calculated server-side, preventing clients from fabricating discount values.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-ink-800">Order Coupon Association:</span> Updating the `orders` table to contain a nullable `coupon_code` column referencing the used promotion code, preserving historical tracking of promotional performance.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
