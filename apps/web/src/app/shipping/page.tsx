import { CustomerShell } from "@/components/layout/CustomerShell";

export default function ShippingPage() {
  return (
    <CustomerShell>
      <div className="space-y-8 py-4 max-w-3xl mx-auto">
        <div className="space-y-3">
          <h1 className="font-serif text-3xl font-bold text-ink-900">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="text-xs text-ink-500">
            Last updated: August 14, 2026
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-8 space-y-6 text-xs text-ink-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-ink-900">1. Local Nursery Shipping</h2>
            <p>
              Floria partners with local delivery couriers and nursery dispatch personnel to deliver fresh plants within 2-4 business days.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-ink-900">2. Free Shipping Eligibility</h2>
            <p>
              Orders above ₹799 qualify for Free Express Shipping across supported cities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-ink-900">3. Live Tracking</h2>
            <p>
              Once your order is packed by the nursery, you will receive an SMS and email notification with a real-time order tracking link.
            </p>
          </section>
        </div>
      </div>
    </CustomerShell>
  );
}
