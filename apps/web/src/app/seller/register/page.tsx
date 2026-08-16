"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSeller } from "@/lib/contexts/SellerContext";
import { api } from "@/lib/api";

export default function SellerRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRequiredNotice = searchParams.get("required") === "1" || searchParams.get("incomplete") === "1";
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
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Pre-fill form if an application or profile already exists
  useEffect(() => {
    async function loadExistingApplication() {
      try {
        setIsLoadingExisting(true);
        const res = await api.getSellerApplication();
        if (res.success && res.data) {
          const app = res.data;
          const isDummyName = app.business_name === "Nursery Partner" || app.business_name === "New Nursery";

          setForm({
            businessName: isDummyName ? "" : (app.business_name || ""),
            email: app.contact_email || "",
            phone: app.contact_phone || "",
            address: app.address || "",
            description: app.business_description || "",
          });
        }
      } catch (e) {
        // Silently handle if user is not logged in yet
      } finally {
        setIsLoadingExisting(false);
      }
    }
    loadExistingApplication();
  }, []);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.businessName.trim() || form.businessName.trim() === "Nursery Partner" || form.businessName.trim() === "New Nursery") {
      errs.businessName = "Valid nursery business name is required.";
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Valid contact email address is required.";
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
      errs.address = "Nursery location / address is required.";
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

          {isRequiredNotice && (
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-3.5 text-xs text-warning-900 leading-relaxed font-medium">
              <strong className="font-bold text-warning-950 block mb-0.5">⚠️ Registration Details Required</strong>
              Please complete all required fields below (Nursery Name, Contact Email, Phone, and Address) to activate your Seller Portal.
            </div>
          )}

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
