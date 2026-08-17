"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { NurserySummary } from "@/lib/api";
import type { Category } from "@floria/types";

interface FilterSidebarProps {
  currentCategory?: string;
  onFilterChange?: () => void; // Optional callback for closing mobile drawer
}

export function FilterSidebar({ currentCategory, onFilterChange }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [nurseries, setNurseries] = useState<NurserySummary[]>([]);

  useEffect(() => {
    api.getCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
    api.getRankedNurseries().then((res) => {
      if (res.success && res.data) setNurseries(res.data);
    });
  }, []);

  // URL state params
  const activeCategory = currentCategory ?? searchParams.get("category") ?? "all";
  const activeNursery = searchParams.get("nursery") ?? "all";
  const activeMinPrice = searchParams.get("minPrice") ?? "";
  const activeMaxPrice = searchParams.get("maxPrice") ?? "";
  const activeInStock = searchParams.get("inStock") === "true";
  const activeSort = searchParams.get("sort") ?? "featured";
  const activeQuery = searchParams.get("q") ?? "";

  // Local state for price inputs
  const [minPrice, setMinPrice] = useState(activeMinPrice);
  const [maxPrice, setMaxPrice] = useState(activeMaxPrice);

  useEffect(() => {
    setMinPrice(activeMinPrice);
    setMaxPrice(activeMaxPrice);
  }, [activeMinPrice, activeMaxPrice]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Determine target URL path
    let targetPath = pathname;
    if (key === "category") {
      if (value && value !== "all") {
        targetPath = `/categories/${value}`;
        params.delete("category");
      } else {
        targetPath = pathname.startsWith("/categories/") ? "/shop" : pathname;
        params.delete("category");
      }
    }

    const queryStr = params.toString();
    const url = queryStr ? `${targetPath}?${queryStr}` : targetPath;
    router.push(url);
    if (onFilterChange) onFilterChange();
  };

  const handleClearAll = () => {
    let targetPath = pathname;
    if (pathname.startsWith("/categories/")) {
      targetPath = "/shop";
    }
    const params = new URLSearchParams();
    if (activeQuery) params.set("q", activeQuery);
    const queryStr = params.toString();
    router.push(queryStr ? `${targetPath}?${queryStr}` : targetPath);
    if (onFilterChange) onFilterChange();
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    let parsedMin = minPrice ? parseFloat(minPrice) : NaN;
    let parsedMax = maxPrice ? parseFloat(maxPrice) : NaN;

    if (!isNaN(parsedMin) && parsedMin < 0) parsedMin = 0;
    if (!isNaN(parsedMax) && parsedMax < 0) parsedMax = 0;

    if (!isNaN(parsedMin) && !isNaN(parsedMax) && parsedMin > parsedMax) {
      const temp = parsedMin;
      parsedMin = parsedMax;
      parsedMax = temp;
      setMinPrice(parsedMin.toString());
      setMaxPrice(parsedMax.toString());
    }

    if (!isNaN(parsedMin)) params.set("minPrice", parsedMin.toString());
    else params.delete("minPrice");

    if (!isNaN(parsedMax)) params.set("maxPrice", parsedMax.toString());
    else params.delete("maxPrice");

    const queryStr = params.toString();
    router.push(queryStr ? `${pathname}?${queryStr}` : pathname);
    if (onFilterChange) onFilterChange();
  };

  const hasActiveFilters =
    (activeCategory !== "all" && !pathname.startsWith("/categories/")) ||
    activeNursery !== "all" ||
    activeMinPrice ||
    activeMaxPrice ||
    activeInStock;

  return (
    <aside className="w-full space-y-6 bg-floria-linen p-6 rounded-3xl border border-floria-border shadow-xs" aria-label="Product filters">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-floria-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-forest-800" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink-900 font-ui">Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-bold text-terracotta-700 hover:text-terracotta-800 transition-colors uppercase tracking-wider font-ui"
          >
            Reset All
          </button>
        )}
      </div>

      {/* 1. Category Filter */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 mb-3 font-ui">
          Category
        </h3>
        <ul className="space-y-1 text-xs font-ui">
          <li>
            <button
              type="button"
              onClick={() => updateParam("category", "all")}
              className={[
                "w-full text-left py-2 px-3 rounded-xl transition-all flex items-center justify-between group",
                activeCategory === "all"
                  ? "bg-forest-100/90 text-forest-800 font-bold border border-forest-200/80 shadow-2xs"
                  : "text-ink-600 hover:bg-floria-soft-sand hover:text-ink-900",
              ].join(" ")}
            >
              <span>All Categories</span>
              {activeCategory === "all" && (
                <span className="w-1.5 h-1.5 rounded-full bg-forest-800" />
              )}
            </button>
          </li>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => updateParam("category", cat.slug)}
                  className={[
                    "w-full text-left py-2 px-3 rounded-xl transition-all flex items-center justify-between group",
                    isActive
                      ? "bg-forest-100/90 text-forest-800 font-bold border border-forest-200/80 shadow-2xs"
                      : "text-ink-600 hover:bg-floria-soft-sand hover:text-ink-900",
                  ].join(" ")}
                >
                  <span>{cat.name}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-forest-800" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <hr className="border-floria-border" />

      {/* 2. Nursery Filter (Floria Multi-Nursery Source Filter) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 mb-3 font-ui">
          Nursery Source
        </h3>
        <ul className="space-y-1 text-xs font-ui">
          <li>
            <button
              type="button"
              onClick={() => updateParam("nursery", "all")}
              className={[
                "w-full text-left py-2 px-3 rounded-xl transition-all flex items-center justify-between",
                activeNursery === "all"
                  ? "bg-forest-100/90 text-forest-800 font-bold border border-forest-200/80 shadow-2xs"
                  : "text-ink-600 hover:bg-floria-soft-sand hover:text-ink-900",
              ].join(" ")}
            >
              <span>All Nurseries</span>
              {activeNursery === "all" && (
                <span className="w-1.5 h-1.5 rounded-full bg-forest-800" />
              )}
            </button>
          </li>
          {nurseries.map((seller) => {
            const isActive = activeNursery === seller.id;
            return (
              <li key={seller.id}>
                <button
                  type="button"
                  onClick={() => updateParam("nursery", seller.id)}
                  className={[
                    "w-full text-left py-2 px-3 rounded-xl transition-all flex items-center justify-between",
                    isActive
                      ? "bg-forest-100/90 text-forest-800 font-bold border border-forest-200/80 shadow-2xs"
                      : "text-ink-600 hover:bg-floria-soft-sand hover:text-ink-900",
                  ].join(" ")}
                >
                  <span className="truncate">{seller.business_name}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-forest-800 flex-shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <hr className="border-floria-border" />

      {/* 3. Price Filter */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 mb-3 font-ui">
          Price Range (₹)
        </h3>
        <form onSubmit={handlePriceApply} className="space-y-2.5">
          <div className="flex items-center gap-2 font-ui">
            <div className="relative w-1/2">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400 select-none">₹</span>
              <input
                type="number"
                placeholder="Min"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full pl-6 pr-2.5 py-2 text-xs rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-700 transition-all text-ink-900 font-semibold"
              />
            </div>
            <span className="text-ink-400 text-xs font-bold">–</span>
            <div className="relative w-1/2">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400 select-none">₹</span>
              <input
                type="number"
                placeholder="Max"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full pl-6 pr-2.5 py-2 text-xs rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-700 transition-all text-ink-900 font-semibold"
              />
            </div>
          </div>
          <button
            type="submit"
            style={{ color: "#FFFFFF" }}
            className="w-full py-2 bg-terracotta-700 hover:bg-terracotta-800 active:bg-terracotta-900 !text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs hover:shadow-md active:scale-[0.98] font-ui"
          >
            Apply Price
          </button>
        </form>
      </div>

      <hr className="border-ink-150" />

      {/* 4. Stock Availability */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 mb-3 font-ui">
          Availability
        </h3>
        <label className="flex items-center gap-2.5 text-xs text-ink-700 cursor-pointer hover:text-ink-900 font-ui select-none">
          <input
            type="checkbox"
            checked={activeInStock}
            onChange={(e) => updateParam("inStock", e.target.checked ? "true" : null)}
            className="w-4 h-4 rounded border-ink-300 text-forest-800 focus:ring-forest-800 accent-forest-800 cursor-pointer"
          />
          <span className="font-semibold text-ink-800">In Stock Only</span>
        </label>
      </div>
    </aside>
  );
}
