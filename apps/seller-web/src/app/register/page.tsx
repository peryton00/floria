"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { api } from "@/lib/api";
import { useToast } from "@/lib/contexts/ToastContext";
import { useSellerAuth } from "@/lib/contexts/SellerAuthContext";
import { Store, Mail, Lock, Phone, MapPin } from "@/components/ui/Icons";

export default function SellerRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshProfile } = useSellerAuth();

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !email || !password || !phone) {
      setError("Please fill out all mandatory fields.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();

      // 1. Sign up Supabase user with role: "seller" in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: "seller",
            full_name: businessName,
          },
        },
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || "Registration failed");
      }

      // 2. Submit seller application via Floria API
      const appRes = await api.submitSellerApplication({
        business_name: businessName.trim(),
        contact_phone: phone.trim(),
        contact_email: email.trim(),
        city: city.trim() || "Bengaluru",
      });

      if (!appRes.success) {
        throw new Error(
          appRes.error?.message || "Failed to initialize nursery profile",
        );
      }

      await refreshProfile();
      toast.success(
        "Application Submitted",
        "Your nursery partner application is under review.",
      );
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-forest-800 text-white font-serif font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
          F
        </div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 tracking-tight">
          Nursery Partner Onboarding
        </h1>
        <p className="text-xs text-ink-500">
          Apply to list and fulfill plant orders on the Floria marketplace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-cream-50 py-8 px-6 shadow-sm border border-cream-300 rounded-2xl sm:px-10 space-y-6">
          {error && (
            <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Nursery / Business Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-400">
                  <Store size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Green Canopy Botanical Gardens"
                  className="w-full pl-9 pr-3 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-forest-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Official Contact Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@greencanopy.in"
                  className="w-full pl-9 pr-3 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-forest-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Contact Phone (Mobile) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-400">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-9 pr-3 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-forest-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Operating City
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-400">
                  <MapPin size={16} />
                </div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bengaluru"
                  className="w-full pl-9 pr-3 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-forest-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Account Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-forest-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
            >
              {loading
                ? "Submitting Application..."
                : "Submit Partner Application"}
            </button>
          </form>

          <div className="pt-4 border-t border-cream-300 text-center">
            <p className="text-xs text-ink-600">
              Already have an approved nursery account?{" "}
              <Link
                href="/login"
                className="font-bold text-forest-800 hover:text-forest-900 uppercase tracking-wider"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
