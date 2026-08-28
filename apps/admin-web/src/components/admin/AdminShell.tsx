"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/lib/contexts/AdminAuthContext";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import { ShieldAlertIcon } from "@/components/ui/Icons";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { authState, isLoading, user, isAdmin, signOut } = useAdminAuth();

  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main className="min-h-screen bg-cream-100">{children}</main>;
  }

  if (isLoading || authState === "INITIALIZING") {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-forest-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
            Verifying Admin Authorization...
          </span>
        </div>
      </div>
    );
  }

  if (
    authState === "UNAUTHENTICATED" ||
    authState === "SESSION_EXPIRED" ||
    !user
  ) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-cream-50 border border-cream-300 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <h1 className="font-serif text-xl font-bold text-ink-900">
            Admin Authentication Required
          </h1>
          <p className="text-xs text-ink-600">
            Please sign in with your verified Floria Platform Admin credentials.
          </p>
          <a
            href="/login"
            className="inline-block py-2.5 px-6 bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
          >
            Go to Admin Login
          </a>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-cream-50 border border-error-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-error-100 text-error-700 flex items-center justify-center mx-auto border border-error-200">
            <ShieldAlertIcon size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-error-900">
              403 — Unauthorized Role
            </h1>
            <p className="text-xs text-ink-600">
              Your account (<span className="font-semibold">{user.email}</span>)
              is assigned role{" "}
              <span className="font-mono font-bold text-error-700 uppercase">
                {user.role}
              </span>
              . Access to the Floria Admin Governance Console is strictly
              restricted to platform administrators.
            </p>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="w-full py-2.5 px-4 bg-ink-800 hover:bg-ink-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
