"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FilterSidebar } from "@/components/ui/FilterSidebar";

interface FilterAndSortControlsProps {
  totalCount: number;
  currentCategorySlug?: string;
}

export function FilterAndSortControls({
  totalCount,
  currentCategorySlug,
}: FilterAndSortControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const activeSort = searchParams.get("sort") ?? "featured";
  const activeNursery = searchParams.get("nursery");
  const activeMinPrice = searchParams.get("minPrice");
  const activeMaxPrice = searchParams.get("maxPrice");
  const activeInStock = searchParams.get("inStock") === "true";
  const activeQuery = searchParams.get("q");

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === "featured") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }
    const queryStr = params.toString();
    router.push(queryStr ? `${pathname}?${queryStr}` : pathname);
  };

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const queryStr = params.toString();
    router.push(queryStr ? `${pathname}?${queryStr}` : pathname);
  };

  // Resolve Nursery Name
  const nurseryName = activeNursery ? "Selected Nursery" : null;

  return (
    <div className="space-y-3 mb-6">
      {/* Status & Sort Controls Row */}
      <div className="flex items-center justify-between pb-3 border-b border-floria-border text-xs text-ink-500 font-medium font-ui">
        <span>
          Showing <strong className="text-ink-900 font-bold">{totalCount}</strong> {totalCount === 1 ? "product" : "products"}
        </span>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Trigger Button */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-forest-50 hover:bg-forest-100 border border-forest-200 text-forest-800 font-bold text-xs rounded-xl transition-all shadow-2xs active:scale-95 font-ui"
          >
            <span>Filters &amp; Sort</span>
            <span className="text-[10px] font-mono">⚡</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-ink-400 font-semibold hidden sm:inline text-xs">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={activeSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-floria-sand/70 border border-floria-border rounded-xl px-3.5 py-2 text-xs font-bold text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-700 cursor-pointer shadow-2xs hover:border-forest-400 transition-all font-ui"
            >
              <option value="featured">Featured / Recommended</option>
              <option value="top-rated">Top Rated</option>
              <option value="most-reviewed">Most Reviewed</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Pills */}
      {(nurseryName || activeMinPrice || activeMaxPrice || activeInStock || activeQuery) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 font-ui">
          <span className="text-[10px] text-ink-400 font-bold uppercase tracking-wider">Active:</span>

          {activeQuery && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-forest-800 bg-forest-100/90 px-2.5 py-1 rounded-full border border-forest-200/80 shadow-2xs">
              Query: &quot;{activeQuery}&quot;
              <button type="button" onClick={() => removeFilter("q")} className="hover:text-red-700 font-bold ml-0.5">✕</button>
            </span>
          )}

          {nurseryName && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-forest-800 bg-forest-100/90 px-2.5 py-1 rounded-full border border-forest-200/80 shadow-2xs">
              Nursery: {nurseryName}
              <button type="button" onClick={() => removeFilter("nursery")} className="hover:text-red-700 font-bold ml-0.5">✕</button>
            </span>
          )}

          {(activeMinPrice || activeMaxPrice) && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-forest-800 bg-forest-100/90 px-2.5 py-1 rounded-full border border-forest-200/80 shadow-2xs">
              Price: ₹{activeMinPrice || "0"} – ₹{activeMaxPrice || "Max"}
              <button
                type="button"
                onClick={() => {
                  removeFilter("minPrice");
                  removeFilter("maxPrice");
                }}
                className="hover:text-red-700 font-bold ml-0.5"
              >
                ✕
              </button>
            </span>
          )}

          {activeInStock && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-forest-800 bg-forest-100/90 px-2.5 py-1 rounded-full border border-forest-200/80 shadow-2xs">
              In Stock Only
              <button type="button" onClick={() => removeFilter("inStock")} className="hover:text-red-700 font-bold ml-0.5">✕</button>
            </span>
          )}
        </div>
      )}

      {/* Mobile Slide-Over Filter Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40 backdrop-blur-sm md:hidden">
          <div className="bg-floria-linen w-full max-w-xs h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between border-l border-floria-border">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-floria-border mb-6">
                <h3 className="font-serif text-lg font-bold text-ink-900">Filters &amp; Sort</h3>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-lg p-1"
                  aria-label="Close filters"
                >
                  ✕
                </button>
              </div>

              <FilterSidebar
                currentCategory={currentCategorySlug}
                onFilterChange={() => setIsMobileDrawerOpen(false)}
              />
            </div>

            <div className="pt-6 border-t border-floria-border mt-6">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full py-3 bg-forest-800 text-white font-bold text-xs uppercase rounded-xl"
              >
                Apply &amp; View Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
