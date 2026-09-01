"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface GoogleOAuthButtonProps {
  label?: string;
  redirectTo?: string;
  className?: string;
}

export function GoogleOAuthButton({
  label = "Continue with Google",
  redirectTo,
  className = "",
}: GoogleOAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const callbackUrl = `${origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`;

      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (oauthErr) {
        setError(oauthErr.message || "Failed to initialize Google Sign-In.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Could not connect to authentication provider.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      {error && (
        <div className="p-3 bg-error-500/20 border border-error-500/40 rounded-xl text-xs text-error-200 text-center font-medium">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={handleGoogleSignIn}
        className={`group relative w-full h-12 px-5 py-3 bg-white hover:bg-cream-50 active:bg-cream-100 text-[#212529] border border-white/40 font-medium text-xs tracking-wider rounded-2xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15)] flex items-center justify-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50 min-h-[48px] cursor-pointer select-none ${className}`}
        aria-label={label}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-neutral-700 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            className="flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span className="font-sans font-semibold text-[#212529] text-xs sm:text-sm tracking-normal">
          {loading ? "Connecting to Google..." : label}
        </span>
      </button>
    </div>
  );
}
