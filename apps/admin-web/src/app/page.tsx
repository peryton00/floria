"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/contexts/AdminAuthContext";

export default function AdminIndexPage() {
  const router = useRouter();
  const { authState, isAdmin } = useAdminAuth();

  useEffect(() => {
    if (authState === "AUTHENTICATED" && isAdmin) {
      router.replace("/dashboard");
    } else if (
      authState === "UNAUTHENTICATED" ||
      authState === "SESSION_EXPIRED"
    ) {
      router.replace("/login");
    }
  }, [authState, isAdmin, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-forest-900 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
          Entering Floria Admin Console...
        </span>
      </div>
    </div>
  );
}
