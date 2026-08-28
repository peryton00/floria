"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";

export default function OperationsLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error(authErr?.message || "Invalid operations credentials");
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const role = profile?.role || data.user.user_metadata?.role;
      if (role !== "operations" && role !== "admin" && role !== "super_admin") {
        await supabase.auth.signOut();
        throw new Error(
          "Access restricted: Your account does not have Operations privileges.",
        );
      }

      router.replace("/operations");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1C15] text-white flex items-center justify-center p-6 font-ui">
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/floria-logo.png"
              alt="Floria Logo"
              width={32}
              height={32}
              className="object-contain brightness-[5]"
            />
            <span className="font-serif text-xl font-bold text-white tracking-tight">
              Floria Ops
            </span>
          </Link>
          <p className="text-xs text-white/60">
            Fulfillment & Logistics Operator Login.
          </p>
        </div>

        {error && (
          <div className="bg-error-500/20 border border-error-500/40 rounded-xl p-3 text-xs text-error-200 text-center font-medium">
            {error}
          </div>
        )}

        {/* Google OAuth for Operations */}
        <GoogleOAuthButton
          label="Sign in with Google"
          redirectTo="/operations"
        />

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            or password
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1">
              Operator Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ops@floria.in"
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
            {loading
              ? "Authenticating Operator..."
              : "Sign In to Operations Console"}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            ← Return to Floria Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
