"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AlertIcon, CheckIcon } from "@/components/ui/Icons";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "/cart";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();

      const { data, error: signInErr } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        },
      );

      if (signInErr) {
        setError(signInErr.message || "Invalid email or password.");
        return;
      }

      if (data.user) {
        setSuccessMessage("Signed in successfully! Redirecting...");
        setTimeout(() => {
          router.push(nextParam);
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-6 bg-white rounded-2xl border border-ink-100 shadow-sm animate-fade-in my-8">
      <h1 className="font-serif text-2xl font-bold text-ink-900 mb-1 text-center">
        Login to Floria
      </h1>
      <p className="text-xs text-ink-400 text-center mb-6">
        Welcome back! Please sign in to your account.
      </p>

      {error && (
        <div className="mb-6 p-3 bg-error-50 border border-error-100 rounded-xl text-xs text-error-700 flex items-start gap-2">
          <AlertIcon size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-3 bg-success-50 border border-success-100 rounded-xl text-xs text-success-700 flex items-start gap-2">
          <CheckIcon size={16} className="mt-0.5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <div className="mb-6">
        <GoogleOAuthButton label="Sign in with Google" redirectTo={nextParam} />
      </div>

      <div className="relative flex py-2 items-center mb-6">
        <div className="flex-grow border-t border-ink-100"></div>
        <span className="flex-shrink mx-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">
          or email
        </span>
        <div className="flex-grow border-t border-ink-100"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-2"
          >
            Email Address *
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 text-sm rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="login-pass"
              className="block text-xs font-bold uppercase tracking-wider text-ink-500"
            >
              Password *
            </label>
            <a
              href="#"
              className="text-xs text-forest-700 font-semibold hover:text-forest-900"
            >
              Forgot password?
            </a>
          </div>
          <input
            id="login-pass"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 text-sm rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ color: "#ffffff" }}
          className="w-full py-3.5 bg-forest-800 hover:bg-forest-900 !text-white font-bold text-xs uppercase tracking-widest rounded-full transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-800 pt-3 min-h-[44px] disabled:opacity-50"
        >
          {loading ? "Signing In..." : "Login"}
        </button>
      </form>

      <p className="text-xs text-ink-400 text-center mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href={`/signup${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`}
          className="text-forest-700 font-semibold hover:text-forest-900"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <CustomerShell>
      <Suspense
        fallback={
          <div className="text-center py-20 text-xs text-ink-400">
            Loading...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </CustomerShell>
  );
}
