import type { Metadata } from "next";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <CustomerShell>
      <h1 className="font-serif text-2xl font-semibold text-ink-900 mb-6">Categories</h1>
      <EmptyState
        title="Categories coming in Phase 2"
        description="Product categories will be loaded from Supabase."
      />
    </CustomerShell>
  );
}
