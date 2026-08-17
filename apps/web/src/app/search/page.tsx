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
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400 mb-4 sm:mb-6 font-ui">
        <Link href="/" className="hover:text-forest-800 transition-colors">Home</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <span className="text-ink-900 font-semibold">Search</span>
      </nav>

      {/* Header Banner */}
      <div className="flex flex-col gap-1.5 mb-6">
        <span className="inline-flex self-start items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-forest-800 bg-forest-100/90 border border-forest-200/80 rounded-full font-ui">
          Botanical Search
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-ink-900 tracking-tight">
          Search Marketplace
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 font-medium">
          Discover live plants, handcrafted pottery, organic soil, and tools from verified Indian nurseries.
        </p>
      </div>

      {/* Search Bar (GET Form) */}
      <form method="GET" action="/search" className="mb-6 sm:mb-8" role="search">
        <div className="group relative flex items-center bg-floria-linen rounded-2xl border border-floria-border shadow-xs hover:border-ink-300 focus-within:border-forest-800 focus-within:ring-4 focus-within:ring-forest-800/10 focus-within:shadow-sm transition-all duration-200">
          <SearchIcon
            className="absolute left-4 text-ink-400 group-focus-within:text-forest-800 transition-colors duration-200 pointer-events-none"
            size={19}
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search plants, pots, fertilizers, tools, or nurseries..."
            autoComplete="off"
            className="w-full pl-12 pr-26 sm:pr-30 py-3.5 text-xs sm:text-sm md:text-base rounded-2xl bg-transparent text-ink-900 placeholder-ink-400 font-medium focus:outline-none focus:ring-0 font-ui [appearance:none] [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="submit"
            style={{ color: "#ffffff" }}
            className="absolute right-1.5 px-4 sm:px-5 py-2.5 bg-forest-800 hover:bg-forest-900 active:bg-forest-950 !text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs hover:shadow-sm active:scale-95 font-ui flex items-center justify-center"
          >
            Search
          </button>
        </div>
      </form>

      {/* Popular Suggestions */}
      {!query && (
        <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-floria-soft-sand via-floria-sand/40 to-forest-50/50 rounded-2xl border border-floria-border space-y-2.5">
          <p className="text-[11px] font-bold text-ink-700 uppercase tracking-widest font-ui">Trending Botanical Searches:</p>
          <div className="flex flex-wrap gap-2 font-ui">
            {popularSearches.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="text-xs font-semibold text-forest-800 bg-floria-linen hover:bg-forest-100/80 active:bg-forest-200 px-3.5 py-1.5 rounded-full border border-forest-200/90 shadow-2xs hover:scale-105 active:scale-95 transition-all font-ui"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] gap-6 md:gap-8 items-start">
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
            <div className="bg-floria-linen rounded-3xl border border-floria-border p-8 sm:p-14 text-center shadow-xs my-4 space-y-3 font-ui">
              <div className="w-14 h-14 rounded-2xl bg-forest-50 border border-forest-200/60 text-forest-800 flex items-center justify-center mx-auto shadow-2xs">
                <SearchIcon size={26} />
              </div>
              <h3 className="font-serif font-bold text-ink-900 text-lg sm:text-xl">Explore Floria Marketplace</h3>
              <p className="text-xs sm:text-sm text-ink-500 max-w-md mx-auto leading-relaxed">
                Enter a search keyword above or tap any trending plant category to discover verified growers near you.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-floria-linen rounded-3xl border border-floria-border p-8 sm:p-14 text-center shadow-xs my-4 space-y-4 font-ui">
              <div className="w-14 h-14 rounded-2xl bg-floria-sand border border-floria-border text-ink-500 flex items-center justify-center mx-auto shadow-2xs">
                <LeafIcon size={26} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-ink-900 text-lg sm:text-xl">No products found for &ldquo;{query}&rdquo;</h3>
                <p className="text-xs sm:text-sm text-ink-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Try checking your spelling, removing active filters, or exploring all nursery collections.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  href="/search"
                  className="py-2.5 px-5 border border-floria-border hover:border-forest-700 bg-floria-soft-sand text-ink-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all font-ui shadow-2xs"
                >
                  Clear Search &amp; Filters
                </Link>
                <Link
                  href="/shop"
                  style={{ color: "#ffffff" }}
                  className="py-2.5 px-5 bg-forest-800 hover:bg-forest-900 active:bg-forest-950 !text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs font-ui"
                >
                  Browse All Products
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5"
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
