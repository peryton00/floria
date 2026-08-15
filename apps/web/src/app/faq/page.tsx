import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";

const FAQS = [
  {
    q: "How are live plants packaged for shipping?",
    a: "Our nursery partners package plants in custom breathable boxes designed to protect delicate leaves and lock moisture into the root pot during transit.",
  },
  {
    q: "Can I order from multiple nurseries at once?",
    a: "Yes! Floria lets you combine items from different nurseries into a single cart and checkout. Sub-orders are routed to each nursery automatically.",
  },
  {
    q: "What if my plant arrives damaged?",
    a: "Every plant is covered by our 7-Day Health Guarantee. Simply send a photo of the plant to support@floria.in for a free replacement or refund.",
  },
  {
    q: "How long does delivery take?",
    a: "Local nursery deliveries usually arrive within 2-4 business days.",
  },
];

export default function FAQPage() {
  return (
    <CustomerShell>
      <div className="space-y-8 py-4 max-w-3xl mx-auto">
        <div className="space-y-3">
          <h1 className="font-serif text-3xl font-bold text-ink-900">
            Frequently Asked Questions
          </h1>
          <p className="text-xs text-ink-500">
            Find answers to common questions about ordering, deliveries, and plant care.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-8 space-y-6">
          {FAQS.map((faq, i) => (
            <div key={i} className="space-y-1 pb-4 border-b border-ink-100 last:border-0 last:pb-0">
              <h3 className="font-serif text-sm font-bold text-ink-900">{faq.q}</h3>
              <p className="text-xs text-ink-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}

          <div className="pt-4 border-t border-ink-100">
            <p className="text-xs text-ink-500 mb-2">Still have questions?</p>
            <Link href="/contact" className="text-xs font-bold text-forest-700 hover:text-forest-900">
              Contact Support Team &rarr;
            </Link>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
