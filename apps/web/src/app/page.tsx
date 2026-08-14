import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { ProductCard } from "@/components/ui/ProductCard";
import { getProductListings } from "@/lib/services/storefront";
import {
  LeafIcon,
  SproutIcon,
  PlanterIcon,
  FlaskIcon,
  ToolsIcon,
  ShieldIcon,
  TruckIcon,
  ReturnIcon,
  StarIcon,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Floria — Plants & Gardening Marketplace",
  description:
    "Discover. Choose. Grow. Shop premium plants and gardening products from trusted local nurseries. Floria handles packing and delivery.",
};

const CATEGORIES = [
  {
    name: "Plants",
    slug: "indoor-plants",
    subtitle: "Bring life to your space.",
    image: "/cat-plants.png",
  },
  {
    name: "Seeds",
    slug: "herbs-edibles",
    subtitle: "Start something beautiful.",
    image: "/cat-seeds.png",
  },
  {
    name: "Pots & Planters",
    slug: "planters-pots",
    subtitle: "The perfect home for your plants.",
    image: "/cat-pots.png",
  },
  {
    name: "Fertilizers & Soil",
    slug: "soil-fertilizers",
    subtitle: "Nourish your plants the right way.",
    image: "/cat-fertilizers.png",
  },
  {
    name: "Gardening Tools",
    slug: "tools-accessories",
    subtitle: "Everything you need to garden better.",
    image: "/cat-tools.png",
  },
] as const;

const NURSERIES = [
  {
    name: "Green Leaf Nursery",
    location: "Raipur, Chhattisgarh",
    rating: 4.8,
    count: 320,
  },
  {
    name: "Nature's Bloom",
    location: "Bhilai, Chhattisgarh",
    rating: 4.7,
    count: 210,
  },
  {
    name: "Sai Garden Center",
    location: "Durg, Chhattisgarh",
    rating: 4.6,
    count: 160,
  },
  {
    name: "Plant Paradise",
    location: "Raipur, Chhattisgarh",
    rating: 4.8,
    count: 290,
  },
] as const;

export default async function HomePage() {
  const allListings = await getProductListings();
  const bestSellers = allListings.slice(0, 5);

  return (
    <CustomerShell fullWidth>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        style={{ backgroundColor: "#F7F4EF" }}
        className="w-full relative overflow-hidden min-h-[calc(100vh-4rem)] md:h-screen flex flex-col justify-between pt-0"
      >
        {/* Main Content */}
        <div className="flex-1 flex items-center w-full relative z-10">
          <div className="max-w-screen-xl mx-auto w-full px-4 md:px-6 lg:px-8 pt-16 pb-8 md:py-12 relative z-10">
            <div className="w-[58%] md:w-[50%] lg:w-[48%] flex flex-col">
              {/* Pill badge */}
              <div
                className="inline-flex self-start items-center gap-1.5 px-2 py-0.5 mb-2 text-[10px] font-bold uppercase tracking-widest rounded"
                style={{
                  color: "#4A6B43",
                  borderColor: "#D5DEC8",
                  backgroundColor: "#F0F5EB",
                }}
              >
                <LeafIcon
                  size={11}
                  className="text-[#4A6B43] fill-[#4A6B43]/20"
                />
                <span>PURE. ORGANIC. SUSTAINABLE.</span>
              </div>

              {/* Headline */}
              <h1
                id="hero-heading"
                className="font-serif font-bold leading-[1.05] text-forest-700 mb-5"
                style={{
                  fontSize: "clamp(2.4rem, 5vw, 3.75rem)",
                  letterSpacing: "-0.02em",
                }}
              >
                Discover.
                <br />
                Choose. Grow.
              </h1>

              <p className="text-xs md:text-base text-ink-500 leading-relaxed mb-6 max-w-sm font-medium">
                Plants &amp; gardening essentials from trusted nurseries,
                delivered to your door.
              </p>

              <div className="flex flex-wrap gap-3 mt-10.5">
                <Link
                  href="/categories"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-3 md:px-6 md:py-3.5 text-xs font-bold rounded transition-all hover:bg-[#152B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 shadow-sm"
                  style={{ backgroundColor: "#1E3E26", color: "#ffffff" }}
                >
                  <span>Explore Plants</span>
                  <span className="text-[13px] leading-none mb-0.5">→</span>
                </Link>
                <Link
                  href="/search"
                  className="hidden sm:inline-flex items-center justify-center px-6 py-3.5 text-xs font-bold uppercase tracking-wider rounded border transition-all hover:bg-[#1E3E26]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
                  style={{ borderColor: "#1E3E26", color: "#1E3E26" }}
                >
                  SHOP GARDENING
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side Image (always visible, floats to the right edge) */}
          <div className="absolute right-0 top-0 bottom-0 w-[60%] md:w-[50%] lg:w-[52%] h-full z-0">
            {/* Smooth left-edge fade overlay */}
            <div
              className="absolute left-0 top-0 bottom-0 w-20 md:w-32 z-10 bg-gradient-to-r pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, #F7F4EF 0%, rgba(247, 244, 239, 0.8) 30%, rgba(247, 244, 239, 0) 100%)",
              }}
            />
            {/* Main image */}
            <Image
              src="/hero-plants.png"
              alt="Plants from Floria nurseries"
              fill
              priority
              className="object-cover object-left md:object-left"
            />
          </div>
        </div>

        {/* ── TRUST STRIP (Docked at the bottom of the full screen hero section) ────────────────────── */}
        <div className="w-full z-20">
          {/* Mobile version (4 items, vertical stack, centered) */}
          <div className="md:hidden w-full px-2 py-3">
            <ul className="grid grid-cols-4 divide-x divide-ink-100">
              {[
                {
                  icon: (
                    <PlanterIcon
                      size={20}
                      className="text-forest-700 mx-auto"
                    />
                  ),
                  lines: ["Trusted", "Nurseries"],
                },
                {
                  icon: (
                    <LeafIcon size={20} className="text-forest-700 mx-auto" />
                  ),
                  lines: ["Quality", "Products"],
                },
                {
                  icon: (
                    <ShieldIcon size={20} className="text-forest-700 mx-auto" />
                  ),
                  lines: ["Secure", "Payments"],
                },
                {
                  icon: (
                    <TruckIcon size={20} className="text-forest-700 mx-auto" />
                  ),
                  lines: ["Fast", "Delivery"],
                },
              ].map(({ icon, lines }, i) => (
                <li
                  key={i}
                  className="flex flex-col items-center text-center gap-1.5 px-1 first:pl-0"
                >
                  {icon}
                  <div className="flex flex-col text-[8.5px] font-bold leading-tight text-ink-700 font-ui">
                    <span>{lines[0]}</span>
                    <span>{lines[1]}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Desktop version (6 items, horizontal) */}
          <div className="hidden md:block max-w-screen-xl mx-auto px-4 md:px-6">
            <ul className="flex items-center justify-between divide-x divide-ink-100 py-3">
              {[
                {
                  icon: <LeafIcon size={20} className="text-forest-700" />,
                  lines: ["100%", "Organic"],
                },
                {
                  icon: <SproutIcon size={20} className="text-forest-700" />,
                  lines: ["Sustainably", "Sourced"],
                },
                {
                  icon: (
                    <StarIcon
                      size={20}
                      className="text-amber-400 fill-amber-400"
                    />
                  ),
                  lines: ["Premium", "Quality"],
                },
                {
                  icon: <TruckIcon size={20} className="text-forest-700" />,
                  lines: ["Fast & Safe", "Delivery"],
                },
                {
                  icon: <ShieldIcon size={20} className="text-forest-700" />,
                  lines: ["Secure", "Payments"],
                },
                {
                  icon: <ReturnIcon size={20} className="text-forest-700" />,
                  lines: ["Easy", "Returns"],
                },
              ].map(({ icon, lines }, i) => (
                <li
                  key={i}
                  className="flex-shrink-0 flex items-center gap-2.5 px-4 md:px-6 py-1 first:pl-0"
                >
                  {icon}
                  <div className="flex flex-col text-[11px] font-bold leading-tight text-ink-700 font-ui">
                    <span>{lines[0]}</span>
                    <span>{lines[1]}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── SHOP BY CATEGORY ────────────────────────────────── */}
      <section aria-labelledby="categories-heading" className="py-10 md:py-14">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-1.5">
            <div>
              <h2
                id="categories-heading"
                className="font-serif font-semibold text-ink-900"
                style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.625rem)" }}
              >
                Shop by Category
              </h2>
              <p className="text-xs text-ink-400 mt-0.5 font-medium">
                Explore our wide range of plants and gardening essentials.
              </p>
            </div>
            <Link
              href="/categories"
              className="text-xs font-bold uppercase tracking-wider text-forest-700 hover:text-forest-900 transition-colors flex-shrink-0 ml-4"
            >
              VIEW ALL
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="group flex flex-col bg-white rounded-xl overflow-hidden border border-ink-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
              >
                {/* Photo Container */}
                <div className="relative aspect-[4/3] w-full bg-cream-50 overflow-hidden">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                </div>
                {/* Text Area */}
                <div className="p-3 bg-white flex flex-col flex-1 border-t border-ink-100/50">
                  <p className="font-sans text-xs font-bold text-ink-900 leading-tight group-hover:text-forest-700 transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-[10px] text-ink-400 leading-snug mt-1 font-medium">
                    {cat.subtitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEST SELLERS ──────────────────────────────────────── */}
      <section
        aria-labelledby="best-sellers-heading"
        className="py-10 md:py-14"
        style={{ backgroundColor: "#FAFAF7" }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2
                id="best-sellers-heading"
                className="font-serif font-semibold text-ink-900"
                style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.625rem)" }}
              >
                Best Sellers
              </h2>
              <p className="text-xs text-ink-400 mt-0.5 font-medium">
                Handpicked favorites from top nurseries.
              </p>
            </div>
            <Link
              href="/categories"
              className="text-xs font-bold uppercase tracking-wider text-forest-700 hover:text-forest-900 transition-colors flex-shrink-0 ml-4"
            >
              VIEW ALL
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bestSellers.map((listing, i) => (
              <ProductCard
                key={listing.product.id}
                listing={listing}
                showBestSeller={i === 0}
                discountPercent={i === 2 ? 20 : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FROM TRUSTED NURSERIES ──────────────────────────── */}
      <section
        aria-labelledby="nurseries-heading"
        className="py-10 md:py-14"
        style={{ backgroundColor: "var(--color-canopy-900)" }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2
                id="nurseries-heading"
                className="font-serif font-semibold"
                style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.625rem)", color: "var(--color-forest-100)" }}
              >
                From Trusted Nurseries
              </h2>
              <p className="text-xs text-white/60 mt-0.5 font-medium">
                Curated products from verified nurseries you can trust.
              </p>
            </div>
            <Link
              href="/categories"
              className="text-xs font-bold uppercase tracking-wider text-white hover:text-white/80 transition-colors flex-shrink-0 ml-4"
            >
              VIEW ALL
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {NURSERIES.map((nursery, i) => (
              <Link
                key={nursery.name}
                href="/categories"
                className="group flex flex-col bg-white rounded-xl overflow-hidden border border-ink-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
              >
                {/* Photo Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={`/nursery-${i + 1}.png`}
                    alt={nursery.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                </div>
                {/* Info */}
                <div className="p-3 bg-white flex flex-col flex-1">
                  <p className="font-sans text-xs font-bold text-ink-900 group-hover:text-forest-700 transition-colors leading-tight">
                    {nursery.name}
                  </p>
                  <p className="text-[10px] text-ink-400 mt-1 font-medium">
                    {nursery.location}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <StarIcon
                      size={10}
                      className="text-amber-400 fill-amber-400"
                    />
                    <span className="text-[10px] font-bold text-ink-700">
                      {nursery.rating}
                    </span>
                    <span className="text-[10px] text-ink-300 font-medium">
                      ({nursery.count})
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </CustomerShell>
  );
}
