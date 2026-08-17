"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSeller } from "@/lib/contexts/SellerContext";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";

export default function SellerLoginPage() {
  const router = useRouter();
  const { login } = useSeller();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Email is required."); return; }
    if (!password) { setError("Password is required."); return; }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    login();
    router.push("/seller/dashboard");
  }

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6 py-16 font-ui">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-2">
            <Image src="/floria-logo.png" alt="Floria" width={32} height={32} className="object-contain" />
            <span className="font-serif text-2xl font-semibold text-ink-900">Floria</span>
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-ink-400">Seller Portal</span>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 shadow-sm p-8 space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-900 mb-1 text-center">
              Sign In to Your Nursery
            </h1>
            <p className="text-xs text-ink-400 text-center">
              Manage your products, orders, and nursery profile.
            </p>
          </div>

          {/* Google Sign-In for Seller */}
          <GoogleOAuthButton label="Sign in with Google" redirectTo="/seller/dashboard" />

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-ink-100"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">or password</span>
            <div className="flex-grow border-t border-ink-100"></div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="seller-email"
                className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-2"
              >
                Email Address
              </label>
              <input
                id="seller-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@yournursery.in"
                className="w-full px-4 py-3 text-sm rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700 transition-shadow"
                aria-required="true"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="seller-password"
                  className="block text-xs font-bold uppercase tracking-wider text-ink-500"
                >
                  Password
                </label>
                <a href="#" className="text-xs text-forest-700 font-semibold hover:text-forest-900">
                  Forgot password?
                </a>
              </div>
              <input
                id="seller-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 text-sm rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700 transition-shadow"
                aria-required="true"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs text-error-600 font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ color: "#ffffff" }}
              className="w-full py-3.5 bg-forest-800 hover:bg-forest-900 disabled:opacity-60 !text-white font-bold text-xs uppercase tracking-widest rounded-full transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-800 min-h-[44px]"
            >
              {isSubmitting ? "Signing In…" : "Sign In"}
            </button>
          </form>

          <div className="pt-4 border-t border-ink-100 text-center space-y-2">
            <p className="text-xs text-ink-400">
              New to Floria?{" "}
              <Link href="/seller/register" className="text-forest-700 font-semibold hover:text-forest-900">
                Register Your Nursery
              </Link>
            </p>
            <p className="text-xs text-ink-400">
              Shopping as a customer?{" "}
              <Link href="/login" className="text-forest-700 font-semibold hover:text-forest-900">
                Customer Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
