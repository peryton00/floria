"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAdminAuth } from "@/lib/contexts/AdminAuthContext";
import { useToast } from "@/lib/contexts/ToastContext";
import { ShieldCheckIcon, Mail, Lock } from "@/components/ui/Icons";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshAuth } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both administrator email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: email.trim(),
          password,
        },
      );

      if (authError || !data.user) {
        throw new Error(authError?.message || "Invalid credentials");
      }

      await refreshAuth();
      toast.success(
        "Welcome back",
        "Authenticated to Floria Governance Console.",
      );
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate administrator.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-forest-900 text-white font-serif font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
          F
        </div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 tracking-tight">
          Floria Admin Console
        </h1>
        <p className="text-xs text-ink-500">
          Platform Governance, Moderation & Operational Oversight
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-cream-50 py-8 px-6 shadow-sm border border-cream-300 rounded-2xl sm:px-10 space-y-6">
          {error && (
            <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Admin Email Address
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
                  placeholder="admin@floria.in"
                  className="w-full pl-9 pr-3 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-forest-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
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
              className="w-full py-3 px-4 bg-forest-900 hover:bg-forest-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
            >
              {loading ? "Authenticating..." : "Sign In to Admin Console"}
            </button>
          </form>

          <div className="p-3 bg-cream-200/60 rounded-xl border border-cream-300 text-[10px] text-ink-500 text-center">
            Restricted access. All login attempts and IP addresses are audited.
          </div>
        </div>
      </div>
    </div>
  );
}
