"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSeller } from "@/lib/contexts/SellerContext";
import { api } from "@/lib/api";

export default function SellerRegisterPage() {
  const router = useRouter();
  const { login } = useSeller();
  const [form, setForm] = useState({
    businessName: "",
    email: "",
    phone: "",
    address: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.businessName.trim()) errs.businessName = "Business name is required.";
    if (!form.email.trim() || !form.email.includes("@")) errs.email = "Valid email is required.";
    if (!form.phone.trim()) errs.phone = "Contact phone is required.";
    if (!form.address.trim()) errs.address = "Nursery location is required.";
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

    try {
      setIsSubmitting(true);
      const res = await api.submitSellerApplication({
        business_name: form.businessName.trim(),
        contact_email: form.email.trim(),
        contact_phone: form.phone.trim(),
        address: form.address.trim(),
        business_description: form.description.trim() || undefined,
      });

      if (res.success) {
        await login();
        router.push("/seller/dashboard");
      } else {
        setApiError(res.error?.message || "Failed to submit seller application.");
      }
    } catch (err: any) {
      setApiError(err.message || "Error submitting application.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-2">
            <Image src="/floria-logo.png" alt="Floria" width={32} height={32} className="object-contain" />
            <span className="font-serif text-2xl font-bold text-ink-900">floria</span>
          </Link>
          <p className="text-xs uppercase tracking-widest text-forest-700 font-bold">Seller Partner Program</p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-8 shadow-sm space-y-6">
          <div>
            <h1 className="font-serif text-xl font-bold text-ink-900">Partner Application</h1>
            <p className="text-xs text-ink-500 mt-1">Register your local nursery to list plants on Floria.</p>
          </div>

          {apiError && (
            <div className="bg-error-50 border border-error-100 rounded-xl p-3 text-xs text-error-700">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1">Nursery / Business Name *</label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="e.g. Green Earth Nursery"
                className="w-full px-3 py-2.5 rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
              {errors.businessName && <p className="text-[10px] text-error-600 mt-0.5">{errors.businessName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1">Contact Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nursery@floria.in"
                  className="w-full px-3 py-2.5 rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
                {errors.email && <p className="text-[10px] text-error-600 mt-0.5">{errors.email}</p>}
              </div>

              <div>
                <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
                {errors.phone && <p className="text-[10px] text-error-600 mt-0.5">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1">Nursery Location / Address *</label>
              <textarea
                rows={2}
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Sector 5, Nursery Road, Raipur, Chhattisgarh"
                className="w-full p-3 rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
              {errors.address && <p className="text-[10px] text-error-600 mt-0.5">{errors.address}</p>}
            </div>

            <div>
              <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1">Business Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Specialties, plant varieties, garden supplies..."
                className="w-full p-3 rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-forest-700 hover:bg-forest-800 text-white font-bold rounded-xl transition-colors uppercase tracking-wider disabled:opacity-50"
            >
              {isSubmitting ? "Submitting Application..." : "Submit Partner Application"}
            </button>
          </form>

          <div className="pt-4 border-t border-ink-100 text-center">
            <p className="text-[11px] text-ink-500">
              Already a partner?{" "}
              <Link href="/seller/login" className="text-forest-700 font-bold hover:underline">
                Sign In to Nursery Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
