import type { Metadata } from "next";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { getProductListings, getActiveCategories } from "@/lib/services/storefront";
import { ProductCard } from "@/components/ui/ProductCard";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterAndSortControls } from "@/components/ui/FilterAndSortControls";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeafIcon } from "@/components/ui/Icons";


export const metadata: Metadata = {
  title: "Shop All Plants & Gardening — Floria",
  description: "Browse plants, pots, seeds, fertilizers, and tools from verified local nurseries.",
};

interface Props {
  searchParams: Promise<{
    category?: string;
    nursery?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: "featured" | "top-rated" | "most-reviewed" | "price-asc" | "price-desc" | "newest";
    q?: string;
  }>;
}

export default async function ShopPage({ searchParams }: Props) {
  const params = (await searchParams) || {};

  const minPriceNum = params.minPrice ? parseFloat(params.minPrice) : undefined;
  const maxPriceNum = params.maxPrice ? parseFloat(params.maxPrice) : undefined;

  const [listings, categories] = await Promise.all([
    getProductListings(undefined, {
      categorySlug: params.category,
      nurseryId: params.nursery,
      minPrice: minPriceNum,
      maxPrice: maxPriceNum,
      inStockOnly: params.inStock === "true",
      searchQuery: params.q,
      sort: params.sort,
    }),
    getActiveCategories(),
  ]);

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-500 mb-6 font-ui flex-wrap">
        <Link href="/" className="hover:text-forest-800 transition-colors">Home</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <span className="text-ink-900 font-semibold">Shop</span>
      </nav>

      {/* Page Header Banner */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b border-floria-border">
        <div>
          <span className="inline-flex items-center px-2.5 py-1 mb-2 text-[10px] font-bold uppercase tracking-widest text-forest-800 bg-forest-100/90 border border-forest-200/80 rounded-full font-ui">
            Verified Marketplace
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink-900 tracking-tight leading-tight">
            Shop Marketplace
          </h1>
          <p className="text-xs md:text-sm text-ink-500 mt-1 max-w-xl leading-relaxed">
            Discover handpicked botanical plants, artisan planters, and organic care essentials direct from local nursery partners.
          </p>
        </div>
        <Link
          href="/categories"
          className="text-xs font-bold text-forest-800 hover:text-forest-900 flex items-center gap-1.5 transition-colors uppercase tracking-wider font-ui"
        >
          <span>Browse Categories</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Desktop Sidebar with Independent Scroll */}
        <div className="hidden md:block sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          <FilterSidebar currentCategory={params.category} />
        </div>

        {/* Content Area */}
        <div>
          <FilterAndSortControls
            totalCount={listings.length}
            currentCategorySlug={params.category}
          />

          {listings.length === 0 ? (
            <EmptyState
              badge="No Matching Plants"
              title="No products match your filters"
              description="Try adjusting your price range, selected nursery, or category filter to discover more products from local nurseries."
              primaryAction={{
                label: "Clear All Filters",
                href: "/shop",
              }}
              secondaryAction={{
                label: "Explore Top Categories",
                href: "/categories",
              }}
              suggestions={categories.slice(0, 4).map((c) => ({
                label: c.name,
                href: `/categories/${c.slug}`,
              }))}
            />
          ) : (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
              aria-label="Shop product listings"
            >
              {listings.map((listing, i) => (
                <ProductCard
                  key={listing.product.id}
                  listing={listing}
                  showBestSeller={i === 0}
                  discountPercent={i === 1 ? 15 : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerShell>
  );
}
