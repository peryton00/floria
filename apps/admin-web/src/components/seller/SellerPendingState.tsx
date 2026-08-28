"use client";

import Link from "next/link";
import Image from "next/image";
import { useSeller } from "@/lib/contexts/SellerContext";

export function SellerPendingState() {
  const { sellerProfile } = useSeller();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#F9F8F3] flex flex-col items-center justify-center px-4 py-12 font-sans antialiased text-[#212529]">
      <div className="max-w-lg w-full bg-white rounded border border-[#E2E8F0] shadow-xs p-8 sm:p-10 text-center">
        {/* Icon */}
        <div className="w-14 h-14 rounded bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-700 shadow-xs">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Verification in Progress
        </div>

        <h1 className="font-sans text-xl sm:text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">
          Nursery Application Under Review
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6 max-w-md mx-auto">
          Thanks for joining Floria. Our horticultural team is verifying your nursery details.
          You&apos;ll be notified once approved — typically within 1–2 business days.
        </p>

        {/* Submitted info summary */}
        {sellerProfile && (
          <div className="bg-[#F8FAFC] rounded border border-[#E2E8F0] p-4 text-left space-y-2 mb-6">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
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
            className="inline-flex items-center justify-center px-5 py-2.5 rounded bg-[#1B4D3E] hover:bg-[#153e31] !text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            Edit Nursery Profile
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Back to Store
          </Link>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Need immediate assistance? Contact{" "}
          <a
            href="mailto:support@floria.in"
            className="text-[#1B4D3E] hover:underline font-bold"
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
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 w-24 flex-shrink-0 pt-px">
        {label}
      </span>
      <span className="text-xs text-[#0F172A] font-medium flex-1">{value}</span>
    </div>
  );
}

