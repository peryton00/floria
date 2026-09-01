"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterIcon } from "@/components/ui/Icons";

interface FilterAndSortControlsProps {
  totalCount: number;
  currentCategorySlug?: string;
  activeSort?: string;
  activeNursery?: string;
  activeMinPrice?: string;
  activeMaxPrice?: string;
  activeInStock?: boolean;
  onSortChange?: (sort: string) => void;
  onToggleInStock?: (inStock: boolean) => void;
  onRemoveFilter?: (key: string) => void;
  onSelectCategory?: (slug: string | null) => void;
  onSelectNursery?: (nurseryId: string | null) => void;
  onSelectPrice?: (min: number | null, max: number | null) => void;
  onClearAll?: () => void;
}

export function FilterAndSortControls({
  totalCount,
  currentCategorySlug,
  activeSort: propActiveSort,
  activeNursery: propActiveNursery,
  activeMinPrice: propActiveMinPrice,
  activeMaxPrice: propActiveMaxPrice,
  activeInStock: propActiveInStock,
  onSortChange,
  onToggleInStock,
  onRemoveFilter,
  onSelectCategory,
  onSelectNursery,
  onSelectPrice,
  onClearAll,
}: FilterAndSortControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const activeSort = propActiveSort ?? searchParams.get("sort") ?? "featured";
  const activeNursery = propActiveNursery ?? searchParams.get("nursery");
  const activeMinPrice = propActiveMinPrice ?? searchParams.get("minPrice");
  const activeMaxPrice = propActiveMaxPrice ?? searchParams.get("maxPrice");
  const activeInStock = propActiveInStock !== undefined ? propActiveInStock : searchParams.get("inStock") === "true";
  const activeQuery = searchParams.get("q");

  const handleSortChange = (newSort: string) => {
    if (onSortChange) {
      onSortChange(newSort);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (newSort === "featured") {
        params.delete("sort");
      } else {
        params.set("sort", newSort);
      }
      const queryStr = params.toString();
      router.push(queryStr ? `${pathname}?${queryStr}` : pathname);
    }
  };

  const toggleParam = (key: string, value: string) => {
    if (key === "inStock" && onToggleInStock) {
      onToggleInStock(!activeInStock);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (params.get(key) === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const queryStr = params.toString();
      router.push(queryStr ? `${pathname}?${queryStr}` : pathname);
    }
  };

  const removeFilter = (key: string) => {
    if (onRemoveFilter) {
      onRemoveFilter(key);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      const queryStr = params.toString();
      router.push(queryStr ? `${pathname}?${queryStr}` : pathname);
    }
  };

  // Resolve Nursery Name
  const nurseryName = activeNursery ? "Selected Nursery" : null;

  return (
    <div className="space-y-3 mb-5">
      {/* Flipkart/Swiggy Horizontal Scroll Quick Filter Pills (Mobile Only) */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-ui">
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-800 text-white font-bold text-xs rounded-full shadow-2xs flex-shrink-0 active:scale-95 transition-transform"
        >
          <FilterIcon size={13} className="text-white" />
          <span>Filters</span>
        </button>

        <button
          type="button"
          onClick={() => toggleParam("inStock", "true")}
          className={[
            "px-3 py-1.5 text-xs font-semibold rounded-full border transition-all flex-shrink-0 whitespace-nowrap",
            activeInStock
              ? "bg-forest-100 text-forest-800 border-forest-300 font-bold"
              : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50",
          ].join(" ")}
        >
          In Stock Only
        </button>

        <button
          type="button"
          onClick={() =>
            handleSortChange(
              activeSort === "price-asc" ? "featured" : "price-asc",
            )
          }
          className={[
            "px-3 py-1.5 text-xs font-semibold rounded-full border transition-all flex-shrink-0 whitespace-nowrap",
            activeSort === "price-asc"
              ? "bg-forest-100 text-forest-800 border-forest-300 font-bold"
              : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50",
          ].join(" ")}
        >
          Price: Low to High
        </button>

        <button
          type="button"
          onClick={() =>
            handleSortChange(
              activeSort === "top-rated" ? "featured" : "top-rated",
            )
          }
          className={[
            "px-3 py-1.5 text-xs font-semibold rounded-full border transition-all flex-shrink-0 whitespace-nowrap",
            activeSort === "top-rated"
              ? "bg-forest-100 text-forest-800 border-forest-300 font-bold"
              : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50",
          ].join(" ")}
        >
          ★ Top Rated
        </button>
      </div>

      {/* Main Status & Sort Controls Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 text-xs text-stone-500 font-medium font-ui">
        <span>
          Showing{" "}
          <strong className="text-stone-900 font-bold">{totalCount}</strong>{" "}
          {totalCount === 1 ? "product" : "products"}
        </span>

        <div className="flex items-center gap-3">
          {/* Desktop Filter Button (Fallback) */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="hidden md:hidden flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-lg transition-all shadow-2xs active:scale-95 font-ui"
          >
            <span>Filters</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-stone-500 font-semibold hidden sm:inline text-xs"
            >
              Sort by:
            </label>
            <select
              id="sort-select"
              value={activeSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-700 cursor-pointer shadow-2xs hover:border-forest-400 transition-all font-ui"
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

      {/* Active Filter Badges */}
      {(nurseryName ||
        activeMinPrice ||
        activeMaxPrice ||
        activeInStock ||
        activeQuery) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 font-ui">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
            Active Filters:
          </span>

          {activeQuery && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200/80 shadow-2xs">
              &quot;{activeQuery}&quot;
              <button
                type="button"
                onClick={() => removeFilter("q")}
                className="hover:text-red-700 font-bold ml-0.5"
              >
                ✕
              </button>
            </span>
          )}

          {nurseryName && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200/80 shadow-2xs">
              Nursery: {nurseryName}
              <button
                type="button"
                onClick={() => removeFilter("nursery")}
                className="hover:text-red-700 font-bold ml-0.5"
              >
                ✕
              </button>
            </span>
          )}

          {(activeMinPrice || activeMaxPrice) && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200/80 shadow-2xs">
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
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200/80 shadow-2xs">
              In Stock Only
              <button
                type="button"
                onClick={() => removeFilter("inStock")}
                className="hover:text-red-700 font-bold ml-0.5"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}

      {/* Swiggy/Flipkart Mobile Bottom Sheet Modal */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-xs md:hidden">
          <div className="bg-white w-full max-h-[85vh] rounded-t-2xl p-5 overflow-y-auto shadow-2xl flex flex-col justify-between border-t border-stone-200 animate-in slide-in-from-bottom duration-300">
            {/* Drag Pill Handle */}
            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mb-3" />

            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <h3 className="font-serif text-base font-bold text-stone-900">
                  Filters &amp; Sort
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="text-stone-400 hover:text-stone-900 font-bold text-base p-1"
                  aria-label="Close filters"
                >
                  ✕
                </button>
              </div>

              <FilterSidebar
                currentCategory={currentCategorySlug}
                onFilterChange={() => setIsMobileDrawerOpen(false)}
                onSelectCategory={onSelectCategory}
                onSelectNursery={onSelectNursery}
                onSelectPrice={onSelectPrice}
                onToggleInStock={onToggleInStock}
                onClearAll={onClearAll}
                activeCategory={currentCategorySlug}
                activeNursery={activeNursery}
                activeMinPrice={activeMinPrice}
                activeMaxPrice={activeMaxPrice}
                activeInStock={activeInStock}
              />
            </div>

            <div className="pt-4 border-t border-stone-100 mt-5 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full py-3 bg-forest-800 text-white font-bold text-xs uppercase rounded-xl shadow-md active:scale-98 transition-transform"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
