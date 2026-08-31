"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function BecomeASellerPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessType: "Botanical Nursery",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    gstNumber: "",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    publicSellerId?: string;
    username?: string;
  } | null>(null);

  function validate() {
    const errs: Record<string, string> = {};

    if (!form.username.trim() || form.username.length < 3) {
      errs.username = "Username / Seller ID must be at least 3 characters.";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(form.username.trim())) {
      errs.username = "Username can only contain letters, numbers, hyphens, and underscores.";
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Valid Gmail/email address is required.";
    }

    if (!form.password || form.password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }

    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    if (!form.businessName.trim() || form.businessName.trim() === "Nursery Partner" || form.businessName.trim() === "New Nursery") {
      errs.businessName = "Valid nursery business name is required.";
    }

    if (!form.phone.trim()) {
      errs.phone = "Contact phone number is required.";
    } else {
      const cleanPhone = form.phone.replace(/[\s\-+()\u00a0]/g, "").replace(/^91/, "");
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        errs.phone = "Enter a valid 10-digit Indian phone number.";
      }
    }

    if (!form.address.trim()) {
      errs.address = "Nursery physical address is required.";
    }
    if (!form.city.trim()) {
      errs.city = "City is required.";
    }
    if (!form.state.trim()) {
      errs.state = "State is required.";
    }
    if (!form.postalCode.trim() || !/^\d{6}$/.test(form.postalCode.trim())) {
      errs.postalCode = "Valid 6-digit Indian PIN code is required.";
    }

    if (form.gstNumber.trim()) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(form.gstNumber.trim().toUpperCase())) {
        errs.gstNumber = "Invalid GSTIN format (e.g. 22AAAAA0000A1Z5).";
      }
    }

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      setIsSubmitting(true);
      const cleanPhone = form.phone.replace(/[\s\-+()\u00a0]/g, "").replace(/^91/, "");

      const res = await api.submitSellerApplication({
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        business_name: form.businessName.trim(),
        business_type: form.businessType,
        business_description: form.description.trim() || undefined,
        contact_phone: cleanPhone,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postal_code: form.postalCode.trim(),
        gst_number: form.gstNumber.trim().toUpperCase() || undefined,
      });

      if (res.success) {
        setSubmittedData({
          publicSellerId: res.data?.publicSellerId,
          username: form.username.trim().toLowerCase(),
        });
        setIsSubmitted(true);
      } else {
        setApiError(res.error?.message || "Failed to submit seller application.");
      }
    } catch (err: any) {
      setApiError(err.message || "Error submitting partner application.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── UNDER REVIEW STATE ──
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4 py-16 font-sans">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E4DC] p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-[#EAF2EC] text-[#2D5A3C] rounded-full flex items-center justify-center mx-auto text-3xl">
            🌱
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#2D5A3C] bg-[#EAF2EC] px-3 py-1 rounded-full border border-[#D0E2D4]">
              ● Under Review
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#1A2E22] pt-2">
              Application Submitted
            </h1>
            <p className="text-sm text-[#4B5563] max-w-md mx-auto">
              We&apos;re reviewing your seller application. Our onboarding team will verify your nursery details and GST documentation.
            </p>
          </div>

          {submittedData?.publicSellerId && (
            <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Assigned Seller ID:</span>
                <span className="font-mono font-bold text-[#111827]">{submittedData.publicSellerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Username:</span>
                <span className="font-mono font-bold text-[#111827]">{submittedData.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Application Status:</span>
                <span className="font-bold text-[#8C5E06]">Under Review</span>
              </div>
            </div>
          )}

          <div className="p-4 bg-[#FEF8EC] border border-[#FBD38D] rounded-xl text-xs text-[#8C5E06] text-left leading-relaxed">
            <strong>Next Steps:</strong> Once an administrator approves your application, your seller account will become <strong>ACTIVE</strong> and you can log in using your Gmail or Seller ID + password.
          </div>

          <Link
            href="/login"
            className="block w-full py-3.5 bg-[#2D5A3C] hover:bg-[#1E4D2B] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-sm"
          >
            Back to Seller Login
          </Link>
        </div>
      </div>
    );
  }

  // ── APPLICATION FORM ──
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
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
            Become a Seller
          </span>
        </div>

        {/* Tab Switcher: Login vs Become a Seller */}
        <div className="flex bg-[#EFECE6] p-1 rounded-xl mb-6 text-xs font-bold">
          <Link
            href="/login"
            className="flex-1 text-center py-2.5 rounded-lg text-[#6B7280] hover:text-[#1A2E22] tracking-wider uppercase transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="flex-1 text-center py-2.5 rounded-lg bg-white text-[#1A2E22] shadow-sm tracking-wider uppercase transition-all"
          >
            Become a Seller
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-8 shadow-sm space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#1A2E22]">Nursery Partner Application</h1>
            <p className="text-xs text-[#6B7280] mt-1">
              Register your nursery on Floria to list botanical plants and receive orders.
            </p>
          </div>

          {apiError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
            {/* Account Credentials Section */}
            <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] space-y-3">
              <h2 className="font-bold text-[11px] uppercase tracking-wider text-[#111827]">
                1. Login & Identity Credentials
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                    Username / Seller ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="e.g. green-roots-raipur"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                  />
                  {errors.username && <p className="text-[10px] text-red-600 mt-0.5">{errors.username}</p>}
                </div>

                <div>
                  <label className="block font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                    Gmail / Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="hello@yournursery.in"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                  />
                  {errors.email && <p className="text-[10px] text-red-600 mt-0.5">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                    Create Password * (min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                  />
                  {errors.password && <p className="text-[10px] text-red-600 mt-0.5">{errors.password}</p>}
                </div>

                <div>
                  <label className="block font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                  />
                  {errors.confirmPassword && (
                    <p className="text-[10px] text-red-600 mt-0.5">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] space-y-3">
              <h2 className="font-bold text-[11px] uppercase tracking-wider text-[#111827]">
                2. Nursery & Business Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                    Nursery / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    placeholder="e.g. Green Earth Botanical"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                  />
                  {errors.businessName && <p className="text-[10px] text-red-600 mt-0.5">{errors.businessName}</p>}
                </div>

                <div>
                  <label className="block font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                  />
                  {errors.phone && <p className="text-[10px] text-red-600 mt-0.5">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  GST Information (GSTIN)
                </label>
                <input
                  type="text"
                  value={form.gstNumber}
                  onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white font-mono uppercase"
                />
                {errors.gstNumber && <p className="text-[10px] text-red-600 mt-0.5">{errors.gstNumber}</p>}
              </div>

              <div>
                <label className="block font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Nursery Location / Street Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Plot 12, Botanical Nursery Road, Sector 5"
                  className="w-full p-3 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                />
                {errors.address && <p className="text-[10px] text-red-600 mt-0.5">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#4B5563] uppercase tracking-wider mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Raipur"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                  />
                  {errors.city && <p className="text-[10px] text-red-600 mt-0.5">{errors.city}</p>}
                </div>
                <div>
                  <label className="block font-bold text-[#4B5563] uppercase tracking-wider mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="Chhattisgarh"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                  />
                  {errors.state && <p className="text-[10px] text-red-600 mt-0.5">{errors.state}</p>}
                </div>
                <div>
                  <label className="block font-bold text-[#4B5563] uppercase tracking-wider mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    placeholder="492001"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                  />
                  {errors.postalCode && <p className="text-[10px] text-red-600 mt-0.5">{errors.postalCode}</p>}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4B5563] uppercase tracking-wider mb-1">
                  Business Description & Specialties
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Indoor plants, rare acclimated aroids, organic fertilizers..."
                  className="w-full p-3 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#2D5A3C] bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#2D5A3C] hover:bg-[#1E4D2B] text-white font-bold rounded-xl transition-colors uppercase tracking-wider shadow-sm disabled:opacity-50 min-h-[46px] flex items-center justify-center text-xs"
            >
              {isSubmitting ? "Submitting Application..." : "Submit Partner Application"}
            </button>
          </form>

          <div className="pt-4 border-t border-[#F3F4F6] text-center">
            <p className="text-xs text-[#6B7280]">
              Already applied or have an account?{" "}
              <Link href="/login" className="text-[#2D5A3C] font-bold hover:underline">
                Sign In to Nursery Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
