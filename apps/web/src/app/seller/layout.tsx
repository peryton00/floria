"use client";

// Floria — Seller Portal Root Layout
// Wraps ALL /seller/* routes with SellerProvider + SellerShell.
//
// Auth guard logic lives in SellerShell:
//   not logged in → shows login/register page (children)
//   pending       → SellerPendingState
//   suspended     → SellerSuspendedState
//   approved      → full portal with sidebar
//
// ponytail: when Supabase auth is live, this layout can also do a
//   server-side auth check via getSupabaseServerClient().auth.getUser()
//   and redirect() before rendering the shell.

import { SellerProvider } from "@/lib/contexts/SellerContext";
import { SellerProductProvider } from "@/lib/contexts/SellerProductContext";
import { SellerShell } from "@/components/seller/SellerShell";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellerProvider>
      <SellerProductProvider>
        <SellerShell>{children}</SellerShell>
      </SellerProductProvider>
    </SellerProvider>
  );
}
