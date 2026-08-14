"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AlertIcon, CheckIcon } from "@/components/ui/Icons";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!termsAgreed) {
      setError("Please agree to the Terms & Conditions and Privacy Policy.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();

      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });

      if (signUpErr) {
        setError(signUpErr.message || "Failed to create account.");
        return;
      }

      if (data.user) {
        setSuccessMessage("Account created successfully! Redirecting...");
        setTimeout(() => {
          router.push("/account");
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerShell>
      <div className="max-w-md mx-auto py-12 px-6 bg-white rounded-2xl border border-ink-100 shadow-sm animate-fade-in my-8">
        <h1 className="font-serif text-2xl font-bold text-ink-900 mb-1 text-center">Create Account</h1>
        <p className="text-xs text-ink-400 text-center mb-6">Join Floria and start your plant journey.</p>

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
          <GoogleOAuthButton label="Sign up with Google" />
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-ink-100"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">or email</span>
          <div className="flex-grow border-t border-ink-100"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-name" className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
              Full Name *
            </label>
            <input
              id="signup-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 text-sm rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
              Email Address *
            </label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 text-sm rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
            />
          </div>

          <div>
            <label htmlFor="signup-phone" className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
              Phone Number
            </label>
            <input
              id="signup-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full px-4 py-3 text-sm rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
            />
          </div>

          <div>
            <label htmlFor="signup-pass" className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
              Password *
            </label>
            <input
              id="signup-pass"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (min. 6 chars)"
              className="w-full px-4 py-3 text-sm rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
            />
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2.5 text-[11px] text-ink-400 font-medium cursor-pointer leading-normal">
            <input
              type="checkbox"
              required
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 rounded border-ink-200 text-forest-700 focus:ring-forest-500 accent-forest-700"
            />
            <span>
              I agree to the{" "}
              <a href="#" className="text-forest-700 font-semibold hover:text-forest-900">Terms &amp; Conditions</a>
              {" "}and{" "}
              <a href="#" className="text-forest-700 font-semibold hover:text-forest-900">Privacy Policy</a>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-widest rounded-full transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-700 pt-3 min-h-[44px] disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-xs text-ink-400 text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-forest-700 font-semibold hover:text-forest-900">
            Login
          </Link>
        </p>
      </div>
    </CustomerShell>
  );
}
