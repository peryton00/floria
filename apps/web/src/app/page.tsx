import type { Metadata } from "next";
import { CustomerShell } from "@/components/layout/CustomerShell";

export const metadata: Metadata = {
  title: "Floria — Plants & Gardening Marketplace",
  description:
    "Shop premium plants and gardening products from local nurseries. Floria handles packing and delivery.",
};

// Demo category data — replace with Supabase query in Phase 2
const DEMO_CATEGORIES = [
  { id: "1", name: "Indoor Plants",      slug: "indoor-plants",      emoji: "🌿" },
  { id: "2", name: "Outdoor Plants",     slug: "outdoor-plants",     emoji: "🌳" },
  { id: "3", name: "Succulents & Cacti", slug: "succulents-cacti",   emoji: "🌵" },
  { id: "4", name: "Flowering Plants",   slug: "flowering-plants",   emoji: "🌸" },
  { id: "5", name: "Herbs & Edibles",    slug: "herbs-edibles",      emoji: "🌱" },
  { id: "6", name: "Planters & Pots",    slug: "planters-pots",      emoji: "🪴" },
  { id: "7", name: "Soil & Fertilizers", slug: "soil-fertilizers",   emoji: "🌍" },
  { id: "8", name: "Tools & Accessories",slug: "tools-accessories",  emoji: "🛠️" },
] as const;

export default function HomePage() {
  return (
    <CustomerShell>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        className={[
          "relative rounded-2xl overflow-hidden",
          "bg-forest-700",
          "px-6 py-10 md:px-12 md:py-16",
          "mb-8",
        ].join(" ")}
      >
        {/* Botanical texture overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 70% 50%, #82c36b 0%, transparent 60%),
                              radial-gradient(circle at 20% 80%, #245718 0%, transparent 50%)`,
          }}
        />

        <div className="relative z-10 max-w-lg">
          <p className="text-sage-200 text-sm font-medium uppercase tracking-widest mb-2">
            Welcome to Floria
          </p>
          <h1
            id="hero-heading"
            className="font-serif text-3xl md:text-5xl font-semibold text-white leading-tight mb-4"
          >
            Bring nature home
          </h1>
          <p className="text-sage-200 text-base md:text-lg leading-relaxed mb-6 max-w-sm">
            Premium plants and gardening products from local nurseries,
            delivered carefully to your door.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/categories"
              className={[
                "inline-flex items-center gap-2 px-5 py-2.5",
                "bg-white text-forest-800 font-medium text-sm rounded-lg",
                "hover:bg-cream-100 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
              ].join(" ")}
            >
              Browse Plants
            </a>
            <a
              href="/search"
              className={[
                "inline-flex items-center gap-2 px-5 py-2.5",
                "bg-transparent border border-white/40 text-white font-medium text-sm rounded-lg",
                "hover:bg-white/10 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
              ].join(" ")}
            >
              Search
            </a>
          </div>
        </div>
      </section>

      {/* ── Shop by Category ────────────────────────────── */}
      <section aria-labelledby="categories-heading" className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            id="categories-heading"
            className="font-serif text-xl md:text-2xl font-semibold text-ink-900"
          >
            Shop by category
          </h2>
          <a
            href="/categories"
            className="text-sm font-medium text-forest-700 hover:text-forest-900 transition-colors"
          >
            View all →
          </a>
        </div>

        <div
          role="list"
          className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3"
          aria-label="Product categories"
        >
          {DEMO_CATEGORIES.map((cat) => (
            <div key={cat.id} role="listitem">
              <a
                href={`/categories/${cat.slug}`}
                className={[
                  "flex flex-col items-center gap-2 p-3",
                  "bg-white rounded-xl border border-ink-100",
                  "hover:border-forest-300 hover:shadow-sm transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700",
                  "group",
                ].join(" ")}
              >
                <span
                  className="text-2xl group-hover:scale-110 transition-transform duration-200"
                  aria-hidden="true"
                >
                  {cat.emoji}
                </span>
                <span className="text-[10px] md:text-xs font-medium text-ink-700 text-center leading-tight">
                  {cat.name}
                </span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Products Placeholder ───────────────── */}
      <section aria-labelledby="featured-heading" className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            id="featured-heading"
            className="font-serif text-xl md:text-2xl font-semibold text-ink-900"
          >
            Featured plants
          </h2>
        </div>

        {/* Skeleton grid — replace with real products in Phase 2 */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          aria-label="Featured product placeholders — data coming soon"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={[
                "bg-white rounded-xl border border-ink-100 overflow-hidden",
                "animate-pulse",
              ].join(" ")}
              aria-hidden="true"
            >
              <div className="aspect-square bg-cream-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-cream-200 rounded-full w-3/4" />
                <div className="h-3 bg-cream-200 rounded-full w-1/2" />
                <div className="h-8 bg-cream-200 rounded-lg mt-3" />
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-ink-300 mt-4">
          Products load in Phase 2 after Supabase is connected.
        </p>
      </section>

      {/* ── How Floria works ────────────────────────────── */}
      <section
        aria-labelledby="how-it-works-heading"
        className="mb-8 bg-white rounded-2xl border border-ink-100 p-6 md:p-8"
      >
        <h2
          id="how-it-works-heading"
          className="font-serif text-xl md:text-2xl font-semibold text-ink-900 mb-6 text-center"
        >
          How Floria works
        </h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6" role="list">
          {[
            {
              step: "01",
              title: "Browse & choose",
              desc: "Explore plants and gardening products from verified local nurseries.",
            },
            {
              step: "02",
              title: "Nursery prepares",
              desc: "Your chosen nursery accepts and prepares your order with care.",
            },
            {
              step: "03",
              title: "Floria delivers",
              desc: "We handle packing and delivery so your plants arrive safely.",
            },
          ].map(({ step, title, desc }) => (
            <li key={step} className="flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-forest-700 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{step}</span>
              </div>
              <h3 className="font-sans text-base font-semibold text-ink-900">{title}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
            </li>
          ))}
        </ol>
      </section>
    </CustomerShell>
  );
}
