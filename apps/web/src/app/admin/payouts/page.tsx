"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { AlertIcon, PayoutIcon } from "@/components/ui/Icons";

export default function AdminPayoutsPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Seller Payouts Portal</h1>
          <p className="text-xs text-ink-400 mt-0.5">Disburse net earnings to seller nursery bank accounts via automated transactions.</p>
        </div>

        {/* Not yet available notice */}
        <div className="bg-white rounded-xl border border-ink-100 p-8 shadow-xs max-w-2xl space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-warning-50 text-warning-700 flex items-center justify-center flex-shrink-0 animate-pulse">
              <AlertIcon size={24} />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-ink-900 leading-tight">Module: Seller Payouts Integration — Not Yet Available</h2>
              <p className="text-xs text-ink-500 leading-relaxed">
                The automated payout system is currently not connected to the live ledger. While you can view net commission statistics under <span className="font-semibold">Finance & Commission</span>, the programmatic bank disbursement integration remains a pending backend dependency.
              </p>
            </div>
          </div>

          <hr className="border-ink-100" />

          {/* Missing dependencies explanation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700">Required Backend Dependencies</h3>
            <ul className="space-y-2.5 text-xs text-ink-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-ink-800">Payout Records Schema:</span> A dedicated database table (e.g. `seller_payouts`) is required to store disbursement ID, seller reference, amount, currency, transaction status, bank reference, and transfer logs.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-ink-800">Payment Gateway Disbursal API:</span> Integration with Cashfree Payouts API to programmatically route funds from the platform escrow account to verified partner nursery bank accounts.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-ink-800">Nursery KYC & Bank Verification:</span> Expanding the onboarding portal to capture and verify nursery bank details, GSTIN alignment, and identity proofs before payouts are cleared.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
