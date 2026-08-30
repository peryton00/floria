"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSellerAuth } from "@/lib/contexts/SellerAuthContext";

export default function SellerLoginPage() {
  const router = useRouter();
  const { signIn, isLoading } = useSellerAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    type: "info" | "warning" | "error";
    title: string;
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatusBanner(null);

    if (!identifier.trim()) {
      setError("Please enter your Gmail address or Seller ID.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn(identifier.trim(), password);
      if (result.success) {
        router.push("/seller/dashboard");
      } else if (result.error) {
        if (result.error.includes("under review")) {
          setStatusBanner({
            type: "info",
            title: "Application Under Review",
            message: "Your seller application is currently being reviewed by our botanical onboarding team. You will be notified once approved.",
          });
        } else if (result.error.includes("correction")) {
          setStatusBanner({
            type: "warning",
            title: "Application Needs Correction",
            message: result.error,
          });
        } else if (result.error.includes("unavailable") || result.error.includes("suspended")) {
          setStatusBanner({
            type: "error",
            title: "Account Unavailable",
            message: "Your seller account is currently unavailable. Please reach out to partner support.",
          });
        } else {
          setError(result.error);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <Link href="/" className="flex items-center gap-2.5 mb-2 group">
            <Image
              src="/floria-logo.png"
              alt="Floria"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <span className="font-serif text-3xl font-semibold text-[#1A2E22] tracking-tight">
              Floria
            </span>
          </Link>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#2D5A3C] bg-[#EAF2EC] px-3 py-1 rounded-full border border-[#D0E2D4]">
            Seller Portal
          </span>
        </div>

        {/* Tab Switcher: Login vs Become a Seller */}
        <div className="flex bg-[#EFECE6] p-1 rounded-xl mb-6 text-xs font-bold">
          <Link
            href="/login"
            className="flex-1 text-center py-2.5 rounded-lg bg-white text-[#1A2E22] shadow-sm tracking-wider uppercase transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="flex-1 text-center py-2.5 rounded-lg text-[#6B7280] hover:text-[#1A2E22] tracking-wider uppercase transition-all"
          >
            Become a Seller
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-[#E8E4DC] shadow-sm p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="font-serif text-2xl font-bold text-[#1A2E22]">
              Sign In to Your Nursery
            </h1>
            <p className="text-xs text-[#6B7280]">
              Enter your Gmail/Email or Seller ID and password to access your dashboard.
            </p>
          </div>

          {/* Account Lifecycle Status Banners */}
          {statusBanner && (
            <div
              className={`p-4 rounded-xl border text-xs leading-relaxed ${
                statusBanner.type === "info"
                  ? "bg-[#F0F7F3] border-[#B8DEC4] text-[#1E4D2B]"
                  : statusBanner.type === "warning"
                    ? "bg-[#FEF8EC] border-[#FBD38D] text-[#8C5E06]"
                    : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
              }`}
            >
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <span>{statusBanner.type === "info" ? "⏳" : statusBanner.type === "warning" ? "⚠️" : "🚫"}</span>
                <span>{statusBanner.title}</span>
              </div>
              <p>{statusBanner.message}</p>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">•</span>
              <span>{error}</span>
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
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="hello@yournursery.in or FLR-SLR-XXXX"
                className="w-full px-4 py-3 text-sm rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#2D5A3C] focus:border-[#2D5A3C] bg-[#FAFAF9] transition-colors placeholder:text-gray-400"
                aria-required="true"
                disabled={isSubmitting || isLoading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="seller-password"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#4B5563]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#2D5A3C] font-semibold hover:text-[#1E4D2B] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="seller-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#2D5A3C] focus:border-[#2D5A3C] bg-[#FAFAF9] transition-colors placeholder:text-gray-400"
                aria-required="true"
                disabled={isSubmitting || isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-3.5 bg-[#2D5A3C] hover:bg-[#1E4D2B] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A3C] min-h-[46px] flex items-center justify-center"
            >
              {isSubmitting || isLoading ? "Signing in..." : "Login"}
            </button>
          </form>

          {/* Action Links */}
          <div className="pt-4 border-t border-[#F3F4F6] text-center space-y-3">
            <p className="text-xs text-[#6B7280]">
              Want to sell your plants on Floria?{" "}
              <Link
                href="/register"
                className="text-[#2D5A3C] font-bold hover:underline"
              >
                Become a Seller
              </Link>
            </p>
            <p className="text-xs text-[#9CA3AF]">
              Shopping for your garden?{" "}
              <a
                href="https://floriaa-web.vercel.app"
                className="text-[#6B7280] font-medium hover:text-[#111827]"
              >
                Customer Storefront
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
