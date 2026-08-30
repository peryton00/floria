"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";

export default function SellerForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError("Please enter your Gmail address or Seller ID.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.requestSellerPasswordReset(identifier.trim());
      if (res.success) {
        setIsSubmitted(true);
      } else {
        setError(res.error?.message || "Failed to process password reset.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to process password reset.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4 py-16 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-2 group">
            <Image
              src="/floria-logo.png"
              alt="Floria"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <span className="font-serif text-3xl font-semibold text-[#1A2E22]">Floria</span>
          </Link>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#2D5A3C] bg-[#EAF2EC] px-3 py-1 rounded-full border border-[#D0E2D4]">
            Seller Portal
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-8 shadow-sm space-y-6">
          {!isSubmitted ? (
            <>
              <div className="text-center space-y-1">
                <h1 className="font-serif text-2xl font-bold text-[#1A2E22]">
                  Forgot Password?
                </h1>
                <p className="text-xs text-[#6B7280]">
                  Enter your Gmail address or Seller ID to reset your credentials.
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="seller-identifier"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#4B5563] mb-1.5"
                  >
                    Gmail or Seller ID
                  </label>
                  <input
                    id="seller-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="hello@yournursery.in or FLR-SLR-XXXX"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#2D5A3C] bg-[#FAFAF9]"
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#2D5A3C] hover:bg-[#1E4D2B] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm disabled:opacity-60 min-h-[46px]"
                >
                  {isSubmitting ? "Sending Instructions..." : "Continue"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 bg-[#EAF2EC] text-[#2D5A3C] rounded-full flex items-center justify-center mx-auto text-2xl">
                ✉️
              </div>
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-bold text-[#1A2E22]">
                  Check Your Inbox
                </h2>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  If an eligible account exists for <strong>{identifier}</strong>, we&apos;ve sent secure instructions to reset your password.
                </p>
              </div>
              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-[11px] text-[#6B7280]">
                Have a reset token?{" "}
                <Link href="/reset-password" className="text-[#2D5A3C] font-bold hover:underline">
                  Enter token here
                </Link>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#F3F4F6] text-center">
            <Link href="/login" className="text-xs text-[#2D5A3C] font-bold hover:underline">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
