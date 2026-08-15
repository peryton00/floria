import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { LeafIcon, CheckIcon } from "@/components/ui/Icons";

const STEPS = [
  {
    step: "01",
    title: "Browse Verified Local Nurseries",
    description: "Explore living indoor plants, organic seeds, planters, and fertilizers sourced directly from trusted nurseries near you.",
  },
  {
    step: "02",
    title: "Multi-Nursery Unified Cart",
    description: "Combine items from different nurseries into a single cart. Floria handles split orders and local seller routing automatically.",
  },
  {
    step: "03",
    title: "Eco-Friendly Safe Packaging",
    description: "Our nursery partners package your plants in custom breathable boxes designed to protect leaves and retain soil moisture.",
  },
  {
    step: "04",
    title: "Express Local Delivery & Plant Guarantee",
    description: "Receive your plants fresh at your doorstep. Every plant is backed by our 7-day health replacement guarantee.",
  },
];

export default function HowItWorksPage() {
  return (
    <CustomerShell>
      <div className="space-y-12 py-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest-50 border border-forest-200 text-forest-800 rounded-full text-xs font-bold uppercase tracking-wider">
            <LeafIcon size={14} />
            <span>Botanical Marketplace</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 leading-tight">
            How Floria Delivers Healthy Plants to Your Door
          </h1>
          <p className="text-sm text-ink-600 leading-relaxed">
            We bridge the gap between passionate plant parents and local nursery growers.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STEPS.map((s) => (
            <div key={s.step} className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-3">
              <span className="font-serif text-3xl font-bold text-forest-700 block">
                {s.step}
              </span>
              <h3 className="font-serif text-lg font-bold text-ink-900">
                {s.title}
              </h3>
              <p className="text-xs text-ink-500 leading-relaxed">
                {s.description}
              </p>
            </div>
          ))}
        </div>

        {/* Trust Guarantees */}
        <div className="bg-cream-100 rounded-2xl border border-ink-100 p-8 space-y-4">
          <h2 className="font-serif text-xl font-bold text-ink-900">The Floria Quality Promise</h2>
          <ul className="space-y-3 text-xs text-ink-700">
            <li className="flex items-center gap-2">
              <CheckIcon size={16} className="text-forest-700 shrink-0" />
              <span>Direct nursery prices with zero middleman markup.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon size={16} className="text-forest-700 shrink-0" />
              <span>7-Day Plant Guarantee: Free replacements if your plant arrives damaged.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon size={16} className="text-forest-700 shrink-0" />
              <span>Expert plant care guides included with every order.</span>
            </li>
          </ul>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-3 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
            >
              Start Shopping Plants &rarr;
            </Link>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
