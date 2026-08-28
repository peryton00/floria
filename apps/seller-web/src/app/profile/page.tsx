"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useSellerAuth } from "@/lib/contexts/SellerAuthContext";
import { useToast } from "@/lib/contexts/ToastContext";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import {
  UserIcon,
  StoreIcon,
  MapPin,
  Mail,
  Phone,
  ClockIcon,
  DocumentIcon,
} from "@/components/ui/Icons";

export default function SellerProfilePage() {
  const { sellerProfile, refreshProfile } = useSellerAuth();
  const { toast } = useToast();

  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sellerProfile) {
      setBusinessName(sellerProfile.business_name || "");
      setDescription(sellerProfile.business_description || "");
      setContactEmail(sellerProfile.contact_email || "");
      setContactPhone(sellerProfile.contact_phone || "");
      setAddressLine1(
        sellerProfile.address_line1 || sellerProfile.address || "",
      );
      setCity(sellerProfile.city || "Bengaluru");
      setState(sellerProfile.state || "Karnataka");
      setPincode(sellerProfile.pincode || "");
    }
  }, [sellerProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !contactPhone) {
      setError("Business name and contact phone are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await api.updateSellerProfile({
        business_name: businessName.trim(),
        business_description: description.trim() || undefined,
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        address_line1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      });

      if (res.success) {
        toast.success(
          "Profile Updated",
          "Your nursery partner details have been saved.",
        );
        await refreshProfile();
      } else {
        setError(res.error?.message || "Failed to update nursery profile.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Nursery Profile & Settings
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Maintain your nursery's store identity, physical pickup location,
            and contact information
          </p>
        </div>

        {sellerProfile && <SellerStatusBadge status={sellerProfile.status} />}
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-200 rounded-xl text-xs text-error-700 font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Identity */}
        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-base font-bold text-ink-900 border-b border-cream-300 pb-2">
            1. Nursery Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Nursery / Business Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Nursery Story & Specialization
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share your nursery's heritage, plant propagation methods, and botanical focus..."
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-base font-bold text-ink-900 border-b border-cream-300 pb-2">
            2. Contact & Communications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Official Email
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Mobile / Support Phone *
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
          </div>
        </div>

        {/* Physical Pickup Location */}
        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-base font-bold text-ink-900 border-b border-cream-300 pb-2">
            3. Physical Nursery Location (Courier Pickup Address)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Street Address / Nursery Premise
              </label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Plot 42, Botanical Garden Road, Whitefield"
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                PIN Code
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="560066"
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
          >
            {saving ? "Saving Profile..." : "Save Nursery Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
