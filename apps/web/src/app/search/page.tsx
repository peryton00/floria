import type { Metadata } from "next";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <CustomerShell>
      <h1 className="font-serif text-2xl font-semibold text-ink-900 mb-6">Search</h1>
      <EmptyState
        title="Search coming in Phase 2"
        description="Full-text search across all nursery products."
      />
    </CustomerShell>
  );
}
