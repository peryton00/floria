import type { Metadata } from "next";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "My Orders" };

export default function OrdersPage() {
  return (
    <CustomerShell>
      <h1 className="font-serif text-2xl font-semibold text-ink-900 mb-6">My Orders</h1>
      <EmptyState
        title="No orders yet"
        description="Your order history will appear here after you make a purchase."
      />
    </CustomerShell>
  );
}
