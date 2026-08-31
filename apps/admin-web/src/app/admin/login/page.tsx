"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "admin_role_required") {
      setError("Access restricted: Your account exists, but does not have Admin privileges in the database.");
    } else if (err) {
      setError("Authentication failed. Please try again.");
    }

    async function checkLoggedInAdmin() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle();

          const role = profile?.role || session.user.user_metadata?.role;
          if (role === "admin" || role === "super_admin") {
            router.replace("/admin/dashboard");
          }
        }
      } catch (e) {
        console.error("Check logged in admin error:", e);
      }
    }
    checkLoggedInAdmin();
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr || !data.user) {
        throw new Error(authErr?.message || "Invalid admin credentials");
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const role = profile?.role || data.user.user_metadata?.role;
      if (role !== "admin" && role !== "super_admin") {
        await supabase.auth.signOut();
        throw new Error("Access restricted: Your account does not have Admin privileges.");
      }

      try {
        await fetch("/api/auth/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "USER_LOGIN",
            role: "admin",
            user_id: data.user.id,
            email: data.user.email,
          }),
        });
      } catch (auditErr) {
        console.warn("Failed to audit login:", auditErr);
      }

      router.replace("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A2B1A] text-white flex items-center justify-center p-6 font-ui">
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/brand_logo.svg" alt="Floria Logo" width={6} height={8} className="w-auto h-8 object-contain brightness-0 invert" />
            <span className="font-serif text-xl font-bold text-white tracking-tight">Floria Admin</span>
          </Link>
          <p className="text-xs text-white/60">Enter your credentials to access the Platform Management Control Panel.</p>
        </div>

        {error && (
          <div className="bg-error-500/20 border border-error-500/40 rounded-xl p-3 text-xs text-error-200 text-center font-medium">
            {error}
          </div>
        )}

        {/* Google OAuth for Admin */}
        <GoogleOAuthButton label="Sign in with Google" redirectTo="/admin/dashboard" />

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">or password</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@floria.in"
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-forest-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-forest-400 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-500 font-bold text-xs uppercase tracking-wider text-white transition-colors focus:outline-none disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "Authenticating Admin..." : "Sign In to Admin Console"}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-white/50 hover:text-white transition-colors">
            ← Return to Floria Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1A2B1A] flex items-center justify-center text-white text-xs">Loading Admin Portal...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
