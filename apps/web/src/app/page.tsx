import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { ProductCard } from "@/components/ui/ProductCard";
import {
  getActiveCategories,
  getProductListings,
} from "@/lib/services/storefront";
import { getSystemMediaUrl } from "@/lib/services/systemMedia";

import type { NurserySummary } from "@/lib/api";
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
  VerifiedIcon,
  MapPinIcon,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Floria — Plants & Gardening Marketplace",
  description:
    "Discover. Choose. Grow. Shop premium plants and gardening products from trusted local nurseries. Floria handles packing and delivery.",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchRankedNurseries(): Promise<NurserySummary[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/catalog/sellers`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

import { redirect } from "next/navigation";
import {
  FadeUp,
  AnimatedSection,
  BotanicalAmbient,
} from "@/components/ui/motion";

interface HomePageProps {
  searchParams?: Promise<{ code?: string; next?: string }>;
}

export default async function HomePage(props: HomePageProps) {
  const params = props.searchParams ? await props.searchParams : undefined;
  if (params?.code) {
    const next = params.next || "/";
    redirect(
      `/auth/callback?code=${encodeURIComponent(params.code)}&next=${encodeURIComponent(next)}`,
    );
  }

  const [allListings, nurseries, categories] = await Promise.all([
    getProductListings(),
    fetchRankedNurseries(),
    getActiveCategories(),
  ]);
  const bestSellers = allListings.slice(0, 5);

  return (
    <CustomerShell fullWidth>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        style={{ backgroundColor: "#F9F8F3" }}
        className="w-full relative overflow-hidden min-h-[calc(100vh-4rem)] md:h-screen flex flex-col justify-between pt-0"
      >
        {/* Main Content */}
        <div className="flex-1 flex items-center w-full relative z-10">
          <div className="max-w-screen-xl mx-auto w-full px-4 md:px-6 lg:px-8 pt-16 pb-8 md:py-12 relative z-10">
            <div className="w-[58%] md:w-[50%] lg:w-[48%] flex flex-col">
              {/* Pill badge */}
              <FadeUp delay={0}>
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
              </FadeUp>

              {/* Headline */}
              <FadeUp delay={60}>
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
              </FadeUp>

              <FadeUp delay={120}>
                <p className="text-xs md:text-base text-ink-500 leading-relaxed mb-6 max-w-sm font-medium">
                  Plants &amp; gardening essentials from trusted nurseries,
                  delivered to your door.
                </p>
              </FadeUp>

              <FadeUp delay={180}>
                <div className="flex flex-wrap gap-3 mt-10.5">
                  <Link
                    href="/categories"
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-3 md:px-6 md:py-3.5 text-xs font-bold rounded transition-all hover:bg-[#152B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                    style={{ backgroundColor: "#1E3E26", color: "#ffffff" }}
                  >
                    <span>Explore Plants</span>
                    <span className="text-[13px] leading-none mb-0.5 group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </Link>
                  <Link
                    href="/search"
                    className="hidden sm:inline-flex items-center justify-center px-6 py-3.5 text-xs font-bold uppercase tracking-wider rounded border transition-all hover:bg-[#1E3E26]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
                    style={{ borderColor: "#1E3E26", color: "#1E3E26" }}
                  >
                    SHOP GARDENING
                  </Link>
                </div>
              </FadeUp>
            </div>
          </div>

          {/* Right Side Image with Botanical Ambient Sway */}
          <div className="absolute right-0 top-0 bottom-0 w-[60%] md:w-[50%] lg:w-[52%] h-full z-0 overflow-hidden">
            {/* Smooth left-edge fade overlay */}
            <div
              className="absolute left-0 top-0 bottom-0 w-20 md:w-32 z-10 bg-gradient-to-r pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, #F7F4EF 0%, rgba(247, 244, 239, 0.8) 30%, rgba(247, 244, 239, 0) 100%)",
              }}
            />
            {/* Main image wrapped in subtle botanical float */}
            <BotanicalAmbient className="w-full h-full relative">
              <Image
                src={getSystemMediaUrl("/hero-plants.png", "cover")}
                alt="Plants from Floria nurseries"
                fill
                priority
                className="object-cover object-left md:object-left"
              />
            </BotanicalAmbient>
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
      <section aria-labelledby="categories-heading" className="py-12 md:py-16">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-4 border-b border-floria-border">
            <div>
              <span className="inline-flex items-center px-2.5 py-1 mb-2 text-[10px] font-bold uppercase tracking-widest text-forest-800 bg-forest-100/90 border border-forest-200/80 rounded-full font-ui">
                Curated Flora &amp; Essentials
              </span>
              <h2
                id="categories-heading"
                className="font-serif font-bold text-ink-900 tracking-tight"
                style={{ fontSize: "clamp(1.35rem, 2.5vw, 1.85rem)" }}
              >
                Shop by Category
              </h2>
              <p className="text-xs md:text-sm text-ink-500 mt-1 font-medium max-w-lg">
                Explore our curated botanical collections, from air-purifying
                foliage to handcrafted planters.
              </p>
            </div>
            <Link
              href="/categories"
              className="text-xs font-bold uppercase tracking-wider text-forest-800 hover:text-forest-950 flex items-center gap-1.5 transition-all font-ui group flex-shrink-0"
            >
              <span>View All Categories</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">
                &rarr;
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5">
            {categories.slice(0, 5).map((cat) => {
              const imgUrl =
                cat.banner_url ||
                cat.image_url ||
                getSystemMediaUrl("/cat-plants.png", "banner");
              return (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="group flex flex-col bg-floria-linen rounded-2xl sm:rounded-3xl overflow-hidden border border-floria-border shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:border-forest-400 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-800"
                >
                  {/* Photo Frame with subtle gradient */}
                  <div className="relative aspect-[4/3] w-full bg-floria-natural-sand overflow-hidden border-b border-floria-border">
                    <Image
                      src={imgUrl}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Text & Explore prompt */}
                  <div className="p-3 sm:p-4 bg-floria-linen flex flex-col flex-1">
                    <p className="font-serif text-xs sm:text-sm font-bold text-ink-900 leading-tight group-hover:text-forest-800 transition-colors">
                      {cat.name}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-ink-500 leading-snug mt-1 font-medium font-ui line-clamp-1">
                      {cat.description || "Curated marketplace collection."}
                    </p>
                    <div className="mt-auto pt-2.5 sm:pt-3 border-t border-floria-border flex items-center justify-between font-ui text-[10px] sm:text-[11px] font-bold text-forest-800">
                      <span className="group-hover:text-forest-900 transition-colors">
                        Explore
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BEST SELLERS ──────────────────────────────────────── */}
      <section
        aria-labelledby="best-sellers-heading"
        className="py-10 md:py-14 bg-floria-soft-sand/70 border-y border-floria-border"
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
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FROM TRUSTED NURSERIES ──────────────────────────── */}
      <section
        aria-labelledby="nurseries-heading"
        className="py-12 md:py-16 bg-floria-soft-sand/90 border-b border-floria-border"
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-4 border-b border-floria-border">
            <div>
              <span className="inline-flex items-center px-2.5 py-1 mb-2 text-[10px] font-bold uppercase tracking-widest text-forest-800 bg-forest-100/90 border border-forest-200/80 rounded-full font-ui">
                Regional Nursery Network
              </span>
              <h2
                id="nurseries-heading"
                className="font-serif font-bold text-ink-900 tracking-tight"
                style={{ fontSize: "clamp(1.35rem, 2.5vw, 1.85rem)" }}
              >
                From Trusted Local Nurseries
              </h2>
              <p className="text-xs md:text-sm text-ink-500 mt-1 font-medium max-w-lg">
                Freshly cultivated plants and botanical supplies direct from
                certified regional growers across India.
              </p>
            </div>
            <Link
              href="/nurseries"
              className="text-xs font-bold uppercase tracking-wider text-forest-800 hover:text-forest-950 flex items-center gap-1.5 transition-all font-ui group flex-shrink-0"
            >
              <span>View All Nurseries</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">
                &rarr;
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {nurseries.slice(0, 4).map((nursery, i) => {
              const rs = Array.isArray(nursery.rating_summary)
                ? nursery.rating_summary[0]
                : nursery.rating_summary;
              const rating = rs?.avg_rating ?? 0;
              const count = rs?.review_count ?? 0;
              const fallbackImages = [
                getSystemMediaUrl("/nursery-1.png", "card"),
                getSystemMediaUrl("/nursery-2.png", "card"),
                getSystemMediaUrl("/nursery-3.png", "card"),
                getSystemMediaUrl("/nursery-4.png", "card"),
              ];
              const displayImage =
                nursery.logo_url ||
                fallbackImages[i % fallbackImages.length] ||
                getSystemMediaUrl("/nursery-1.png", "card");

              return (
                <Link
                  key={nursery.id}
                  href={`/shop?nursery=${nursery.id}`}
                  className="group flex flex-col bg-floria-linen rounded-3xl overflow-hidden border border-floria-border shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-forest-400 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-800"
                >
                  {/* Photo Frame with Verified Chip */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-floria-natural-sand border-b border-floria-border">
                    <Image
                      src={displayImage}
                      alt={nursery.business_name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-bold text-forest-800 bg-white/95 backdrop-blur-md rounded-full shadow-2xs font-ui">
                        <VerifiedIcon size={11} className="text-forest-800" />
                        <span>Verified</span>
                      </span>
                    </div>
                  </div>

                  {/* Nursery Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="font-serif text-sm sm:text-base font-bold text-ink-900 group-hover:text-forest-800 transition-colors leading-snug">
                      {nursery.business_name}
                    </p>
                    <p className="text-[11px] text-ink-500 mt-1 font-medium truncate flex items-center gap-1 font-ui">
                      <MapPinIcon
                        size={12}
                        className="text-ink-400 flex-shrink-0"
                      />
                      <span className="truncate">
                        {nursery.address || "Verified Partner Nursery"}
                      </span>
                    </p>

                    {/* Rating and Explore Link */}
                    <div className="mt-auto pt-3 border-t border-ink-100/80 flex items-center justify-between font-ui">
                      <div className="flex items-center gap-1">
                        {count > 0 ? (
                          <>
                            <StarIcon
                              size={11}
                              className="text-amber-400 fill-amber-400"
                            />
                            <span className="text-[11px] font-bold text-ink-800">
                              {rating.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-ink-400 font-medium">
                              ({count})
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] text-forest-800 font-bold uppercase tracking-wider bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/60">
                            Partner
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-forest-800 group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-0.5">
                        <span>Shop</span>
                        <span>&rarr;</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </CustomerShell>
  );
}
