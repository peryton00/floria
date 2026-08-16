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
    <aside className="w-full space-y-6 bg-white p-5 rounded-2xl border border-ink-100 shadow-xs" aria-label="Product filters">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-ink-100">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-900">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-bold text-forest-700 hover:text-forest-900 transition-colors"
          >
            Reset All
          </button>
        )}
      </div>

      {/* 1. Category Filter */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 mb-3">
          Category
        </h3>
        <ul className="space-y-1 text-xs">
          <li>
            <button
              type="button"
              onClick={() => updateParam("category", "all")}
              className={[
                "w-full text-left py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between",
                activeCategory === "all" ? "bg-forest-50 text-forest-700 font-bold" : "text-ink-600 hover:bg-cream-100",
              ].join(" ")}
            >
              <span>All Categories</span>
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
                    "w-full text-left py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between",
                    isActive ? "bg-forest-50 text-forest-700 font-bold" : "text-ink-600 hover:bg-cream-100",
                  ].join(" ")}
                >
                  <span>{cat.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <hr className="border-ink-100" />

      {/* 2. Nursery Filter (Floria Multi-Nursery Source Filter) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 mb-3">
          Nursery Source
        </h3>
        <ul className="space-y-1 text-xs">
          <li>
            <button
              type="button"
              onClick={() => updateParam("nursery", "all")}
              className={[
                "w-full text-left py-1.5 px-2 rounded-lg transition-colors",
                activeNursery === "all" ? "bg-forest-50 text-forest-700 font-bold" : "text-ink-600 hover:bg-cream-100",
              ].join(" ")}
            >
              All Nurseries
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
                    "w-full text-left py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between",
                    isActive ? "bg-forest-50 text-forest-700 font-bold" : "text-ink-600 hover:bg-cream-100",
                  ].join(" ")}
                >
                  <span>{seller.business_name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <hr className="border-ink-100" />

      {/* 3. Price Filter */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 mb-3">
          Price Range (₹)
        </h3>
        <form onSubmit={handlePriceApply} className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
            <span className="text-ink-300 text-xs">–</span>
            <input
              type="number"
              placeholder="Max"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-cream-100 hover:bg-forest-700 hover:text-white text-ink-800 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
          >
            Apply Price
          </button>
        </form>
      </div>

      <hr className="border-ink-100" />

      {/* 4. Stock Availability */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 mb-3">
          Availability
        </h3>
        <label className="flex items-center gap-2.5 text-xs text-ink-700 cursor-pointer hover:text-ink-900">
          <input
            type="checkbox"
            checked={activeInStock}
            onChange={(e) => updateParam("inStock", e.target.checked ? "true" : null)}
            className="w-4 h-4 rounded border-ink-200 text-forest-700 focus:ring-forest-500 accent-forest-700"
          />
          <span className="font-medium">In Stock Only</span>
        </label>
      </div>
    </aside>
  );
}
