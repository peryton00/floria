"use client";

import Link from "next/link";
import Image from "next/image";
import { useSeller } from "@/lib/contexts/SellerContext";

export function SellerPendingState() {
  const { sellerProfile } = useSeller();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-floria-page flex flex-col items-center justify-center px-4 py-12 font-ui">
      <div className="max-w-lg w-full bg-floria-linen rounded-3xl border border-floria-border shadow-xs p-8 sm:p-10 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center mx-auto mb-5 text-amber-700 shadow-2xs">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/80 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Verification in Progress
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mb-3 leading-tight">
          Nursery Application<br />Under Review
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 leading-relaxed mb-6 max-w-md mx-auto">
          Thanks for joining Floria. Our horticultural team is verifying your nursery details.
          You&apos;ll be notified once approved — typically within 1–2 business days.
        </p>

        {/* Submitted info summary */}
        {sellerProfile && (
          <div className="bg-floria-soft-sand rounded-2xl border border-floria-border p-5 text-left space-y-2.5 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500 mb-2">
              Submitted Nursery Profile
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
            style={{ color: "#ffffff" }}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-forest-800 hover:bg-forest-900 !text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-forest-800"
          >
            Edit Nursery Profile
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-floria-border hover:bg-floria-sand text-ink-700 text-xs font-bold uppercase tracking-wider transition-all focus:outline-none"
          >
            Back to Store
          </Link>
        </div>

        <p className="text-xs text-ink-400 mt-6">
          Need immediate assistance? Contact{" "}
          <a
            href="mailto:support@floria.in"
            className="text-forest-800 hover:underline font-bold"
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
