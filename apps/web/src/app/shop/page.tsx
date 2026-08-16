import type { Metadata } from "next";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { getProductListings } from "@/lib/services/storefront";
import { ProductCard } from "@/components/ui/ProductCard";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterAndSortControls } from "@/components/ui/FilterAndSortControls";
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

  const listings = await getProductListings(undefined, {
    categorySlug: params.category,
    nurseryId: params.nursery,
    minPrice: minPriceNum,
    maxPrice: maxPriceNum,
    inStockOnly: params.inStock === "true",
    searchQuery: params.q,
    sort: params.sort,
  });

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400 mb-6">
        <Link href="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <span className="text-ink-700 font-medium">Shop</span>
      </nav>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900 mb-1">
          Shop Marketplace
        </h1>
        <p className="text-xs text-ink-400">
          Discover handpicked plants, clay pots, and organic fertilizers direct from local nurseries.
        </p>
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
            <div className="bg-white rounded-2xl border border-ink-100 p-8 sm:p-12 text-center shadow-sm my-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-cream-100 text-ink-400 flex items-center justify-center mx-auto">
                <LeafIcon size={24} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-ink-900 text-lg">No products match your filters</h3>
                <p className="text-xs text-ink-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your price range, selected nursery, or category filter to discover more products.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  href="/shop"
                  className="py-2.5 px-5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                >
                  Clear All Filters
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="grid grid-cols-2 lg:grid-cols-3 gap-4"
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
