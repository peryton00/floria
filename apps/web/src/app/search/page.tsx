import type { Metadata } from "next";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { searchProductListings } from "@/lib/services/storefront";
import { ProductCard } from "@/components/ui/ProductCard";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterAndSortControls } from "@/components/ui/FilterAndSortControls";
import { SearchIcon, LeafIcon } from "@/components/ui/Icons";

interface Props {
  searchParams: Promise<{
    q?: string;
    category?: string;
    nursery?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: "featured" | "price-asc" | "price-desc" | "newest";
  }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" — Search — Floria` : "Search — Floria",
    description: "Search for plants and gardening products across all local nurseries on Floria.",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const minPriceNum = params.minPrice ? parseFloat(params.minPrice) : undefined;
  const maxPriceNum = params.maxPrice ? parseFloat(params.maxPrice) : undefined;

  const results = await searchProductListings(query, {
    categorySlug: params.category,
    nurseryId: params.nursery,
    minPrice: minPriceNum,
    maxPrice: maxPriceNum,
    inStockOnly: params.inStock === "true",
    sort: params.sort,
  });

  const popularSearches = ["Snake Plant", "Monstera", "Terracotta Pot", "Aloe Vera", "Basil Seeds", "Vermicompost"];

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400 mb-6">
        <Link href="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <span className="text-ink-700 font-medium">Search</span>
      </nav>

      {/* Page Title */}
      <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900 mb-4">
        Search Marketplace
      </h1>

      {/* Search Bar (GET Form) */}
      <form method="GET" action="/search" className="mb-6" role="search">
        <div className="relative flex items-center">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search plants, pots, tools, or nurseries..."
            autoComplete="off"
            className="w-full pl-10 pr-24 py-3 text-xs sm:text-sm rounded-xl border border-ink-200 bg-white text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-700 shadow-xs"
          />
          <SearchIcon className="absolute left-3.5 text-ink-400 pointer-events-none" size={18} />
          <button
            type="submit"
            className="absolute right-1.5 px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Popular Suggestions */}
      {!query && (
        <div className="mb-8 p-4 bg-cream-50 rounded-xl border border-ink-100 space-y-2">
          <p className="text-xs font-bold text-ink-700 uppercase tracking-wider">Popular Searches:</p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="text-xs text-forest-700 bg-white hover:bg-forest-50 px-3 py-1 rounded-full border border-forest-200 font-medium transition-colors"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Desktop Sidebar with Independent Scroll */}
        <div className="hidden md:block sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          <FilterSidebar currentCategory={params.category} />
        </div>

        {/* Content Area */}
        <div>
          <FilterAndSortControls
            totalCount={results.length}
            currentCategorySlug={params.category}
          />

          {!query && results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-ink-100 p-8 sm:p-12 text-center shadow-sm my-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                <SearchIcon size={24} />
              </div>
              <h3 className="font-serif font-bold text-ink-900 text-lg">Explore Floria Marketplace</h3>
              <p className="text-xs text-ink-500 max-w-sm mx-auto">
                Enter a search term above or pick from popular search keywords to find products from local nurseries.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-ink-100 p-8 sm:p-12 text-center shadow-sm my-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-cream-100 text-ink-400 flex items-center justify-center mx-auto">
                <LeafIcon size={24} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-ink-900 text-lg">No results found for &ldquo;{query}&rdquo;</h3>
                <p className="text-xs text-ink-500 mt-1 max-w-sm mx-auto">
                  Check your spelling, try removing filters, or browse all categories.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  href="/search"
                  className="py-2.5 px-5 border border-ink-200 hover:border-forest-700 text-ink-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  Clear Search &amp; Filters
                </Link>
                <Link
                  href="/shop"
                  className="py-2.5 px-5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                >
                  Browse All Products
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="grid grid-cols-2 lg:grid-cols-3 gap-4"
              aria-label={`Search results for ${query}`}
            >
              {results.map((listing, i) => (
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
