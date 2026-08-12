import type { Metadata } from "next";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { searchProductListings } from "@/lib/services/storefront";
import { ProductCard } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" — Search — Floria` : "Search — Floria",
    description: "Search for plants and gardening products across all nurseries on Floria.",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const results = query ? await searchProductListings(query) : [];

  return (
    <CustomerShell>
      <h1 className="font-serif text-2xl md:text-3xl font-semibold text-ink-900 mb-6">
        Search
      </h1>

      {/* Search Form — navigates via GET */}
      <form method="GET" action="/search" className="mb-8" role="search">
        <div className="flex gap-2">
          <label htmlFor="search-input" className="sr-only">
            Search products
          </label>
          <input
            id="search-input"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search plants, pots, tools…"
            autoComplete="off"
            className={[
              "flex-1 px-4 py-3 rounded-xl",
              "border border-ink-200 bg-white text-ink-900 text-sm placeholder-ink-300",
              "focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent",
              "transition-shadow",
            ].join(" ")}
          />
          <button
            type="submit"
            className={[
              "px-5 py-3 rounded-xl",
              "bg-forest-700 text-white text-sm font-semibold",
              "hover:bg-forest-800 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2",
            ].join(" ")}
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      {!query ? (
        <p className="text-sm text-ink-400">Enter a search term to find plants and gardening products.</p>
      ) : results.length === 0 ? (
        <EmptyState
          title={`No results for "${query}"`}
          description="Try a different search term or browse by category."
        />
      ) : (
        <>
          <p className="text-sm text-ink-400 mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            aria-label={`Search results for ${query}`}
          >
            {results.map((listing) => (
              <ProductCard key={listing.product.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </CustomerShell>
  );
}
