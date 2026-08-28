import type { Metadata } from "next";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import {
  searchProductListings,
  getActiveCategories,
} from "@/lib/services/storefront";
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

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" — Search — Floria` : "Search — Floria",
    description:
      "Search for plants and gardening products across all local nurseries on Floria.",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const minPriceNum = params.minPrice ? parseFloat(params.minPrice) : undefined;
  const maxPriceNum = params.maxPrice ? parseFloat(params.maxPrice) : undefined;

  const [results, categories] = await Promise.all([
    searchProductListings(query, {
      categorySlug: params.category,
      nurseryId: params.nursery,
      minPrice: minPriceNum,
      maxPrice: maxPriceNum,
      inStockOnly: params.inStock === "true",
      sort: params.sort,
    }),
    getActiveCategories(),
  ]);

  const popularSearches = [
    { label: "Indoor Plants", query: "Indoor Plants" },
    { label: "Snake Plant", query: "Snake Plant" },
    { label: "Monstera", query: "Monstera" },
    { label: "Terracotta Pot", query: "Terracotta Pot" },
    { label: "Aloe Vera", query: "Aloe Vera" },
    { label: "Organic Soil", query: "Soil" },
    { label: "Fertilizer", query: "Fertilizer" },
  ];

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-stone-500 mb-4 sm:mb-6 font-ui"
      >
        <Link href="/" className="hover:text-forest-800 transition-colors">
          Home
        </Link>
        <span aria-hidden="true" className="select-none text-stone-300">
          /
        </span>
        <span className="text-stone-900 font-semibold">Search</span>
      </nav>

      {/* Header Banner */}
      <div className="flex flex-col gap-1.5 mb-6">
        <span className="inline-flex self-start items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-forest-800 bg-forest-100/90 border border-forest-200/80 rounded-full font-ui">
          Botanical Marketplace Search
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 tracking-tight">
          Search Products &amp; Nurseries
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 font-medium max-w-2xl leading-relaxed">
          Explore live plants, handcrafted pots, organic care essentials, and
          garden tools direct from verified local growers.
        </p>
      </div>

      {/* Flipkart/Swiggy Clean Search Bar (GET Form) */}
      <form
        method="GET"
        action="/search"
        className="mb-6 sm:mb-8"
        role="search"
      >
        <div className="group relative flex items-center bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:border-forest-400 focus-within:border-forest-700 focus-within:ring-4 focus-within:ring-forest-800/10 transition-all duration-200 p-1.5">
          <SearchIcon
            className="absolute left-4 text-stone-400 group-focus-within:text-forest-800 transition-colors duration-200 pointer-events-none"
            size={20}
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search plants, pots, fertilizers, tools, or nurseries..."
            autoComplete="off"
            className="w-full pl-11 pr-24 sm:pr-28 py-2.5 text-xs sm:text-sm md:text-base rounded-xl bg-transparent text-stone-900 placeholder-stone-400 font-medium focus:outline-none focus:ring-0 font-ui [appearance:none] [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <Link
              href="/search"
              aria-label="Clear search"
              className="absolute right-24 sm:right-28 text-stone-400 hover:text-stone-700 font-bold text-xs p-1 mr-1"
            >
              ✕
            </Link>
          )}
          <button
            type="submit"
            style={{ color: "#ffffff" }}
            className="absolute right-1.5 px-4 sm:px-6 py-2.5 bg-forest-800 hover:bg-forest-900 active:bg-forest-950 !text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs hover:shadow-md active:scale-95 font-ui flex items-center justify-center"
          >
            Search
          </button>
        </div>
      </form>

      {/* Popular Suggestions & Categories (Shown when pre-search or browsing) */}
      {!query && (
        <div className="space-y-6 mb-8">
          {/* Trending Searches */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-forest-800" />
              <p className="text-[11px] font-bold text-stone-900 uppercase tracking-wider font-ui">
                Popular Searches
              </p>
            </div>
            <div className="flex flex-wrap gap-2 font-ui">
              {popularSearches.map((item) => (
                <Link
                  key={item.label}
                  href={`/search?q=${encodeURIComponent(item.query)}`}
                  className="text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-forest-50 hover:text-forest-800 hover:border-forest-300 active:bg-forest-100 px-3.5 py-1.5 rounded-full border border-stone-200/80 shadow-2xs hover:scale-105 active:scale-95 transition-all font-ui"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Category Chips (Swiggy Instamart style) */}
          {categories.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 font-ui">
                  Explore Top Categories
                </h2>
                <Link
                  href="/categories"
                  className="text-xs font-bold text-forest-800 hover:underline font-ui"
                >
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
                {categories.slice(0, 6).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="group flex items-center justify-between p-3 bg-white hover:bg-forest-50/60 rounded-xl border border-stone-200/80 hover:border-forest-300 shadow-2xs transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <span className="text-xs font-semibold text-stone-800 group-hover:text-forest-900 truncate font-ui">
                      {cat.name}
                    </span>
                    <span className="text-stone-300 group-hover:text-forest-800 transition-colors text-xs font-bold">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
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
            <div className="bg-white rounded-2xl border border-stone-200/80 p-8 sm:p-14 text-center shadow-2xs my-4 space-y-3 font-ui">
              <div className="w-14 h-14 rounded-2xl bg-forest-50 border border-forest-200/60 text-forest-800 flex items-center justify-center mx-auto shadow-2xs">
                <SearchIcon size={26} />
              </div>
              <h3 className="font-serif font-bold text-stone-900 text-lg sm:text-xl">
                Explore Floria Marketplace
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                Enter a search keyword above or tap any popular search tag to
                discover verified growers near you.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200/80 p-8 sm:p-14 text-center shadow-2xs my-4 space-y-4 font-ui">
              <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-200 text-stone-500 flex items-center justify-center mx-auto shadow-2xs">
                <LeafIcon size={26} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg sm:text-xl">
                  No products found for &ldquo;{query}&rdquo;
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Try checking your spelling, removing active filters, or
                  exploring all nursery collections.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  href="/search"
                  className="py-2.5 px-5 border border-stone-200 hover:border-forest-700 bg-stone-50 text-stone-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all font-ui shadow-2xs"
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
              className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
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
