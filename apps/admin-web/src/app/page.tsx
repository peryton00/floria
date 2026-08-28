"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/lib/contexts/AdminAuthContext";

function AdminIndexPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authState, isAdmin } = useAdminAuth();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      const next = searchParams.get("next") || "/dashboard";
      router.replace(`/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`);
      return;
    }

    if (authState === "AUTHENTICATED" && isAdmin) {
      router.replace("/dashboard");
    } else if (
      authState === "UNAUTHENTICATED" ||
      authState === "SESSION_EXPIRED"
    ) {
      router.replace("/login");
    }
  }, [authState, isAdmin, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#142314]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
          Entering Floria Admin Console...
        </span>
      </div>
    </div>
  );
}

export default function AdminIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#142314]">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminIndexPageContent />
    </Suspense>
  );
}
