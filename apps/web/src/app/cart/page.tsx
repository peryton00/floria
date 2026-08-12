import type { Metadata } from "next";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <CustomerShell>
      <h1 className="font-serif text-2xl font-semibold text-ink-900 mb-6">Cart</h1>
      <EmptyState
        title="Your cart is empty"
        description="Add plants from the categories to get started."
        action={
          <a
            href="/categories"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-700 text-white text-sm font-medium rounded-lg hover:bg-forest-800 transition-colors"
          >
            Browse Plants
          </a>
        }
      />
    </CustomerShell>
  );
}
