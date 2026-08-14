"use client";

import Link from "next/link";
import Image from "next/image";
import { useSeller } from "@/lib/contexts/SellerContext";

export function SellerPendingState() {
  const { sellerProfile } = useSeller();

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-ink-100 shadow-sm p-8 md:p-10 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-warning-100 flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-warning-600">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-warning-100 text-warning-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-warning-600 animate-pulse" />
          Under Review
        </div>

        <h1 className="font-serif text-2xl font-bold text-ink-900 mb-3 leading-tight">
          Your Nursery Application<br />Is Under Review
        </h1>
        <p className="text-sm text-ink-500 leading-relaxed mb-8">
          Thanks for registering with Floria. Our team is reviewing your nursery information.
          You&apos;ll be notified once your account is approved — typically within 1–2 business days.
        </p>

        {/* Submitted info summary */}
        {sellerProfile && (
          <div className="bg-cream-50 rounded-xl border border-ink-100 p-5 text-left space-y-3 mb-8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-2">
              Submitted Information
            </p>
            <InfoRow label="Business Name" value={sellerProfile.business_name} />
            {sellerProfile.contact_email && (
              <InfoRow label="Email" value={sellerProfile.contact_email} />
            )}
            {sellerProfile.contact_phone && (
              <InfoRow label="Phone" value={sellerProfile.contact_phone} />
            )}
            {sellerProfile.address && (
              <InfoRow label="Address" value={sellerProfile.address} />
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/seller/profile"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-forest-700"
          >
            Edit Nursery Profile
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-ink-200 hover:border-ink-400 text-ink-600 text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-forest-700"
          >
            Back to Store
          </Link>
        </div>

        <p className="text-[11px] text-ink-300 mt-8">
          Questions? Contact{" "}
          <a
            href="mailto:support@floria.in"
            className="text-forest-700 hover:text-forest-900 font-semibold"
          >
            support@floria.in
          </a>
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 w-24 flex-shrink-0 pt-px">
        {label}
      </span>
      <span className="text-xs text-ink-700 font-medium flex-1">{value}</span>
    </div>
  );
}
