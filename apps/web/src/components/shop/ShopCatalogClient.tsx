"use client";

import { useState, useTransition, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ProductListing, Category } from "@floria/types";
import { ProductCard } from "@/components/ui/ProductCard";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterAndSortControls } from "@/components/ui/FilterAndSortControls";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductGridSkeleton } from "@/components/ui/loading/ProductGridSkeleton";
import { getProductListings } from "@/lib/services/storefront";

interface ShopCatalogClientProps {
  initialListings: ProductListing[];
  categories: Category[];
  initialCategorySlug?: string;
  initialNursery?: string;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  initialInStock?: boolean;
  initialSort?: string;
  initialQuery?: string;
  fixedCategorySlug?: string; // If locked to /categories/[slug]
}

export function ShopCatalogClient({
  initialListings,
  categories,
  initialCategorySlug,
  initialNursery,
  initialMinPrice,
  initialMaxPrice,
  initialInStock = false,
  initialSort = "featured",
  initialQuery = "",
  fixedCategorySlug,
}: ShopCatalogClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active Filter State
  const [activeCategory, setActiveCategory] = useState<string>(
    fixedCategorySlug || initialCategorySlug || "all"
  );
  const [activeNursery, setActiveNursery] = useState<string>(
    initialNursery || "all"
  );
  const [minPrice, setMinPrice] = useState<number | undefined>(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(initialMaxPrice);
  const [inStockOnly, setInStockOnly] = useState<boolean>(initialInStock);
  const [activeSort, setActiveSort] = useState<string>(initialSort);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

  const [listings, setListings] = useState<ProductListing[]>(initialListings);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize dynamic products when filter state changes
  const fetchFilteredProducts = useCallback(
    async (
      catSlug: string,
      nursery: string,
      minP: number | undefined,
      maxP: number | undefined,
      inStock: boolean,
      sort: string,
      query: string
    ) => {
      setIsLoading(true);
      try {
        const effectiveCategory = catSlug !== "all" ? catSlug : undefined;
        const effectiveNursery = nursery !== "all" ? nursery : undefined;

        const results = await getProductListings(undefined, {
          categorySlug: effectiveCategory,
          nurseryId: effectiveNursery,
          minPrice: minP,
          maxPrice: maxP,
          inStockOnly: inStock,
          sort: sort as any,
          searchQuery: query || undefined,
        });

        startTransition(() => {
          setListings(results);
        });

        // Update URL query string shallowly without re-rendering layout
        const params = new URLSearchParams();
        if (effectiveCategory && !fixedCategorySlug) {
          params.set("category", effectiveCategory);
        }
        if (effectiveNursery && effectiveNursery !== "all") params.set("nursery", effectiveNursery);
        if (minP !== undefined && minP > 0) params.set("minPrice", minP.toString());
        if (maxP !== undefined && maxP > 0) params.set("maxPrice", maxP.toString());
        if (inStock) params.set("inStock", "true");
        if (sort && sort !== "featured") params.set("sort", sort);
        if (query) params.set("q", query);

        const newQuery = params.toString();
        const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
        window.history.replaceState(null, "", newUrl);
      } catch (err) {
        console.error("[ShopCatalogClient] Filter fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [fixedCategorySlug, pathname]
  );

  const handleCategoryChange = (slug: string | null) => {
    const nextCat = slug || "all";
    setActiveCategory(nextCat);
    fetchFilteredProducts(
      nextCat,
      activeNursery,
      minPrice,
      maxPrice,
      inStockOnly,
      activeSort,
      searchQuery
    );
  };

  const handleNurseryChange = (nurseryId: string | null) => {
    const nextNursery = nurseryId || "all";
    setActiveNursery(nextNursery);
    fetchFilteredProducts(
      activeCategory,
      nextNursery,
      minPrice,
      maxPrice,
      inStockOnly,
      activeSort,
      searchQuery
    );
  };

  const handlePriceApply = (min: number | null, max: number | null) => {
    const nextMin = min !== null && min > 0 ? min : undefined;
    const nextMax = max !== null && max > 0 ? max : undefined;
    setMinPrice(nextMin);
    setMaxPrice(nextMax);
    fetchFilteredProducts(
      activeCategory,
      activeNursery,
      nextMin,
      nextMax,
      inStockOnly,
      activeSort,
      searchQuery
    );
  };

  const handleToggleInStock = (inStock: boolean) => {
    setInStockOnly(inStock);
    fetchFilteredProducts(
      activeCategory,
      activeNursery,
      minPrice,
      maxPrice,
      inStock,
      activeSort,
      searchQuery
    );
  };

  const handleSortChange = (sort: string) => {
    setActiveSort(sort);
    fetchFilteredProducts(
      activeCategory,
      activeNursery,
      minPrice,
      maxPrice,
      inStockOnly,
      sort,
      searchQuery
    );
  };

  const handleClearAll = () => {
    const nextCat = fixedCategorySlug || "all";
    setActiveCategory(nextCat);
    setActiveNursery("all");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setInStockOnly(false);
    setActiveSort("featured");
    setSearchQuery("");
    fetchFilteredProducts(nextCat, "all", undefined, undefined, false, "featured", "");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
      {/* Desktop Sidebar with Independent Scroll */}
      <div className="hidden md:block sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
        <FilterSidebar
          currentCategory={activeCategory}
          onSelectCategory={fixedCategorySlug ? undefined : handleCategoryChange}
          onSelectNursery={handleNurseryChange}
          onSelectPrice={handlePriceApply}
          onToggleInStock={handleToggleInStock}
          onClearAll={handleClearAll}
          activeCategory={activeCategory}
          activeNursery={activeNursery}
          activeMinPrice={minPrice?.toString()}
          activeMaxPrice={maxPrice?.toString()}
          activeInStock={inStockOnly}
        />
      </div>

      {/* Content Area */}
      <div>
        <FilterAndSortControls
          totalCount={listings.length}
          currentCategorySlug={activeCategory !== "all" ? activeCategory : undefined}
          activeSort={activeSort}
          activeNursery={activeNursery}
          activeMinPrice={minPrice?.toString()}
          activeMaxPrice={maxPrice?.toString()}
          activeInStock={inStockOnly}
          onSortChange={handleSortChange}
          onToggleInStock={handleToggleInStock}
          onRemoveFilter={(key) => {
            if (key === "category") handleCategoryChange("all");
            else if (key === "nursery") handleNurseryChange("all");
            else if (key === "price") handlePriceApply(null, null);
            else if (key === "inStock") handleToggleInStock(false);
          }}
          onSelectCategory={fixedCategorySlug ? undefined : handleCategoryChange}
          onSelectNursery={handleNurseryChange}
          onSelectPrice={handlePriceApply}
          onClearAll={handleClearAll}
        />

        {/* Dynamic Products Grid Section */}
        <div className="relative min-h-[300px]">
          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : listings.length === 0 ? (
            <EmptyState
              badge="No Matching Plants"
              title="No products match your filters"
              description="Try adjusting your price range, selected nursery, or category filter to discover more products from local nurseries."
              primaryAction={{
                label: "Clear All Filters",
                onClick: handleClearAll,
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
              className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 transition-opacity duration-200 ${
                isPending ? "opacity-60" : "opacity-100"
              }`}
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
    </div>
  );
}
