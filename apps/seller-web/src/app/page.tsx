"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSellerAuth } from "@/lib/contexts/SellerAuthContext";
import { FloriaBusinessLandingPage } from "@/components/landing/FloriaBusinessLandingPage";

function SellerHomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authState, isAuthenticated } = useSellerAuth();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      const next = searchParams.get("next") || "/dashboard";
      router.replace(
        `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`,
      );
      return;
    }

    if (authState === "AUTHENTICATED" && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [authState, isAuthenticated, router, searchParams]);

  // If authenticated, show a clean transition while redirecting
  if (authState === "AUTHENTICATED" && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-forest-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
            Entering Floria Seller Portal...
          </span>
        </div>
      </div>
    );
  }

  // Public acquisition landing page for unauthenticated visitors
  return <FloriaBusinessLandingPage />;
}

export default function SellerHomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream-100">
          <div className="w-8 h-8 border-2 border-forest-800 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SellerHomePageContent />
    </Suspense>
  );
}
