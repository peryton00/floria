"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useToast } from "@/lib/contexts/ToastContext";
import { useSellerAuth } from "@/lib/contexts/SellerAuthContext";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { Lock, Mail, Store } from "lucide-react";

export default function SellerLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshProfile, isAuthenticated, sellerProfile } = useSellerAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && sellerProfile) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, sellerProfile, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      await refreshProfile();
      toast.success(
        "Welcome back",
        "Signed in to Floria Nursery Partner Portal.",
      );
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.message || "Failed to sign in. Please verify your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-ui">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#1E3A2B] text-white font-serif font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
          F
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#1B2A1B] tracking-tight">
          Floria Nursery Partner Portal
        </h1>
        <p className="text-xs text-[#5C6B5C]">
          Sign in to manage your nursery store, inventory & orders
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E5DFD3] rounded-2xl sm:px-10 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Google OAuth Login for Seller */}
          <GoogleOAuthButton label="Sign in with Google" redirectTo="/dashboard" />

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#E5DFD3]"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-[#8C9B8C] uppercase tracking-widest">
              or email & password
            </span>
            <div className="flex-grow border-t border-[#E5DFD3]"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3C4B3C] mb-1">
                Partner Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C9B8C]">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nursery@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl text-xs text-[#1B2A1B] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B] focus:border-[#1E3A2B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3C4B3C] mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C9B8C]">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl text-xs text-[#1B2A1B] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B] focus:border-[#1E3A2B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#1E3A2B] hover:bg-[#15291E] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A2B] cursor-pointer"
            >
              {loading ? "Signing In..." : "Sign In to Seller Portal"}
            </button>
          </form>

          <div className="pt-4 border-t border-[#E5DFD3] text-center space-y-3">
            <p className="text-xs text-[#5C6B5C]">
              Want to partner with Floria to sell botanical plants?
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#1E3A2B] hover:text-[#15291E] uppercase tracking-wider"
            >
              <Store size={14} /> Register Nursery Partner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
