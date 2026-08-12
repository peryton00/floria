import type { Metadata } from "next";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <CustomerShell>
      <h1 className="font-serif text-2xl font-semibold text-ink-900 mb-6">Account</h1>
      <EmptyState
        title="Auth coming in Phase 3"
        description="Sign in to manage your profile, addresses and preferences."
      />
    </CustomerShell>
  );
}
