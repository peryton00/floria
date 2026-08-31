"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function SellerResetPasswordPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("Please provide a valid password reset token.");
      return;
    }
    if (!password || password.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.confirmSellerPasswordReset(token.trim(), password);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.error?.message || "Failed to reset password. Token may have expired.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please request a new link.");
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
              src="/brand_logo.svg"
              alt="Floria"
              width={6}
              height={8}
              className="w-auto h-9 object-contain"
              priority
            />
            <span className="font-serif text-3xl font-semibold text-[#1A2E22]">Floria</span>
          </Link>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#2D5A3C] bg-[#EAF2EC] px-3 py-1 rounded-full border border-[#D0E2D4]">
            Seller Security
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-8 shadow-sm space-y-6">
          {!isSuccess ? (
            <>
              <div className="text-center space-y-1">
                <h1 className="font-serif text-2xl font-bold text-[#1A2E22]">
                  Create New Password
                </h1>
                <p className="text-xs text-[#6B7280]">
                  Set a new secure password for your seller portal account.
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
                {!tokenFromUrl && (
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[#4B5563] mb-1">
                      Reset Token *
                    </label>
                    <input
                      type="text"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste your 32-character reset token"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-[#FAFAF9] font-mono text-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold uppercase tracking-wider text-[#4B5563] mb-1">
                    New Password * (min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-[#FAFAF9]"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-[#4B5563] mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-[#FAFAF9]"
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#2D5A3C] hover:bg-[#1E4D2B] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm disabled:opacity-60 min-h-[46px]"
                >
                  {isSubmitting ? "Updating Password..." : "Reset Password"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 bg-[#EAF2EC] text-[#2D5A3C] rounded-full flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-bold text-[#1A2E22]">
                  Password Updated
                </h2>
                <p className="text-xs text-[#4B5563]">
                  Your password has been changed successfully. You can now sign in with your new credentials.
                </p>
              </div>

              <Link
                href="/login"
                className="block w-full py-3.5 bg-[#2D5A3C] hover:bg-[#1E4D2B] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-sm"
              >
                Back to Login
              </Link>
            </div>
          )}

          {!isSuccess && (
            <div className="pt-4 border-t border-[#F3F4F6] text-center">
              <Link href="/login" className="text-xs text-[#2D5A3C] font-bold hover:underline">
                ← Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
