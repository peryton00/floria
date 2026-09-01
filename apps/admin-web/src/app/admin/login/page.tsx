"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { LockIcon, EyeIcon, ShieldIcon } from "@/components/ui/Icons";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "admin_role_required") {
      setError("Access restricted: Your account exists, but does not have Admin privileges in the database.");
    } else if (err) {
      setError("Authentication failed. Please check your credentials and try again.");
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
    <div className="relative min-h-screen bg-[#0A150F] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Ambient Lighting & Atmospheric Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Glowing Emerald Aura (Top Center) */}
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-emerald-500/10 blur-[140px]" />
        {/* Warm Terracotta Glow (Bottom Right) */}
        <div className="absolute -bottom-48 -right-20 w-[550px] h-[550px] rounded-full bg-[#943828]/10 blur-[160px]" />
        {/* Subtle Botanical Glow (Bottom Left) */}
        <div className="absolute -bottom-32 -left-20 w-[400px] h-[400px] rounded-full bg-forest-500/10 blur-[130px]" />
        {/* Geometric Noise / Grid Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Double-Bezel (Doppelrand) Outer Enclosure */}
      <div className="relative z-10 p-2 sm:p-2.5 rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
        {/* Inner Content Core */}
        <div className="p-6 sm:p-9 rounded-[calc(2.5rem-0.625rem)] bg-[#112117]/90 border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_8px_32px_-8px_rgba(0,0,0,0.5)] space-y-6">
          
          {/* Header & Brand Identity */}
          <div className="text-center space-y-3">
            {/* Eyebrow Micro-Capsule */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-300 text-[10px] font-mono font-medium tracking-[0.2em] uppercase shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Administrative Gateway
            </div>

            {/* Logo + Title */}
            <div>
              <Link href="/" className="inline-flex items-center justify-center gap-2.5 group">
                <div className="p-1.5 rounded-xl bg-white/10 border border-white/10 group-hover:bg-white/15 transition-colors">
                  <Image
                    src="/brand_logo.svg"
                    alt="Floria Logo"
                    width={18}
                    height={18}
                    className="w-5 h-5 object-contain brightness-0 invert"
                  />
                </div>
                <span className="font-serif text-2xl font-semibold text-white tracking-tight">
                  Floria Admin
                </span>
              </Link>
              <p className="text-xs text-white/55 mt-2 max-w-xs mx-auto leading-relaxed">
                Authorized identity verification for botanical catalog & platform operations.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-error-500/15 border border-error-500/30 text-xs text-error-200 text-center font-medium leading-snug animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* Google OAuth Provider Button */}
          <div className="space-y-2">
            <GoogleOAuthButton
              label="Sign in with Google Workspace"
              redirectTo="/admin/dashboard"
            />
          </div>

          {/* Hairline Divider */}
          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-white/[0.08]" />
            <span className="flex-shrink mx-3 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[9px] font-mono font-medium text-white/40 uppercase tracking-[0.2em]">
              or credentials
            </span>
            <div className="flex-grow border-t border-white/[0.08]" />
          </div>

          {/* Password Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-white/70">
                Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@floria.in"
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.12] text-white text-xs placeholder-white/30 focus:outline-none focus:bg-white/[0.09] focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-white/70">
                  Password Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-mono text-emerald-400/80 hover:text-emerald-300 transition-colors uppercase tracking-wider flex items-center gap-1"
                >
                  <EyeIcon size={12} />
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.12] text-white text-xs placeholder-white/30 focus:outline-none focus:bg-white/[0.09] focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans"
                />
              </div>
            </div>

            {/* Primary Island Button CTA */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full inline-flex items-center justify-between pl-6 pr-2 py-2 rounded-full bg-forest-800 hover:bg-forest-700 active:bg-forest-900 border border-emerald-500/30 text-white font-medium text-xs tracking-wider uppercase shadow-[0_8px_24px_-4px_rgba(16,185,129,0.3)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
            >
              <span className="font-semibold tracking-wide">
                {loading ? "Authenticating Root..." : "Sign In to Admin Console"}
              </span>
              <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white/90 group-hover:bg-white/25 group-hover:translate-x-0.5 transition-all duration-300">
                <LockIcon size={13} />
              </span>
            </button>
          </form>

          {/* Footnote & Reassurance */}
          <div className="pt-2 border-t border-white/[0.06] flex flex-col items-center gap-2.5 text-center">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-white/40">
              <ShieldIcon size={12} className="text-emerald-400/80" />
              <span>TLS 1.3 End-to-End Encrypted Session</span>
            </div>

            <Link
              href="/"
              className="text-xs text-white/45 hover:text-white/80 transition-colors inline-flex items-center gap-1 font-sans"
            >
              <span>←</span> Return to Floria Storefront
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A150F] flex items-center justify-center text-white text-xs font-mono">
          Loading Security Vault...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
