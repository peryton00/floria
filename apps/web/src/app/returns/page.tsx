import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";

export default function ReturnsPage() {
  return (
    <CustomerShell>
      <div className="space-y-8 py-4 max-w-3xl mx-auto">
        <div className="space-y-3">
          <h1 className="font-serif text-3xl font-bold text-ink-900">
            Returns &amp; Replacement Policy
          </h1>
          <p className="text-xs text-ink-500">Last updated: August 14, 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-8 space-y-6 text-xs text-ink-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-ink-900">
              1. 7-Day Plant Guarantee
            </h2>
            <p>
              Plants are living goods. If your plant arrives broken, wilted
              beyond recovery, or infected with pests, Floria guarantees a 100%
              free replacement or full refund within 7 days of delivery.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-ink-900">
              2. How to File a Claim
            </h2>
            <p>
              To file a replacement claim, simply take a photo of the damaged
              plant upon delivery and contact our support team at{" "}
              <strong className="text-ink-900">support@floria.in</strong> or via
              your account orders dashboard.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-ink-900">
              3. Non-Plant Items (Pots &amp; Tools)
            </h2>
            <p>
              Ceramic pots, terracotta planters, and gardening tools can be
              returned within 14 days of delivery in their original unused
              condition.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-ink-900">
              4. Refund Processing
            </h2>
            <p>
              Approved refunds are credited back to your original payment source
              (UPI/Credit Card) within 3-5 business days.
            </p>
          </section>

          <div className="pt-4 border-t border-ink-100 flex gap-4">
            <Link
              href="/contact"
              style={{ color: "#ffffff" }}
              className="px-5 py-2.5 bg-forest-800 hover:bg-forest-900 !text-white font-bold rounded-xl uppercase text-[11px] tracking-wider"
            >
              Contact Support
            </Link>
            <Link
              href="/orders"
              className="px-5 py-2.5 border border-ink-200 hover:border-ink-400 text-ink-800 font-bold rounded-xl uppercase text-[11px] tracking-wider"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
