import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { LeafIcon } from "@/components/ui/Icons";

export default function AboutPage() {
  return (
    <CustomerShell>
      <div className="space-y-8 py-4 max-w-3xl mx-auto">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest-50 border border-forest-200 text-forest-800 rounded-full text-xs font-bold uppercase tracking-wider">
            <LeafIcon size={14} />
            <span>Our Botanical Mission</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-ink-900">
            About Floria
          </h1>
          <p className="text-xs text-ink-500 max-w-md mx-auto leading-relaxed">
            Connecting plant lovers directly with India&apos;s finest local nursery growers and garden artisans.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-8 space-y-6 text-xs text-ink-700 leading-relaxed">
          <p>
            Founded with a passion for sustainable green living, Floria is a multi-nursery e-commerce platform designed to bring healthy, locally nurtured plants straight from growers to urban homes.
          </p>
          <p>
            By partnering directly with family-owned plant nurseries, local terracotta potters, and organic soil producers, Floria ensures fairer prices for growers and healthier, fresher plants for customers.
          </p>

          <div className="pt-4 border-t border-ink-100 flex gap-4">
            <Link
              href="/nurseries"
              className="px-5 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-bold rounded-xl uppercase text-[11px] tracking-wider"
            >
              Explore Local Nurseries
            </Link>
            <Link
              href="/shop"
              className="px-5 py-2.5 border border-ink-200 hover:border-ink-400 text-ink-800 font-bold rounded-xl uppercase text-[11px] tracking-wider"
            >
              Browse Plants
            </Link>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
