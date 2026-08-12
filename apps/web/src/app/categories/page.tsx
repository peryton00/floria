import type { Metadata } from "next";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { getActiveCategories } from "@/lib/services/storefront";

export const metadata: Metadata = {
  title: "Categories — Floria",
  description: "Browse all plant and gardening product categories on Floria.",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  "indoor-plants": "🌿",
  "outdoor-plants": "🌳",
  "succulents-cacti": "🌵",
  "flowering-plants": "🌸",
  "herbs-edibles": "🌱",
  "planters-pots": "🪴",
  "soil-fertilizers": "🌍",
  "tools-accessories": "🛠️",
};

export default async function CategoriesPage() {
  const categories = await getActiveCategories();

  return (
    <CustomerShell>
      <h1 className="font-serif text-2xl md:text-3xl font-semibold text-ink-900 mb-2">
        Categories
      </h1>
      <p className="text-sm text-ink-400 mb-8">
        {categories.length} categories available
      </p>

      <div
        role="list"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        aria-label="All product categories"
      >
        {categories.map((cat) => (
          <div key={cat.id} role="listitem">
            <Link
              href={`/categories/${cat.slug}`}
              className={[
                "flex flex-col items-center gap-3 p-5 h-full",
                "bg-white rounded-2xl border border-ink-100",
                "hover:border-forest-300 hover:shadow-md hover:-translate-y-0.5",
                "transition-all duration-300 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700",
                "group",
              ].join(" ")}
            >
              <span
                className="text-4xl group-hover:scale-110 transition-transform duration-300"
                aria-hidden="true"
              >
                {CATEGORY_EMOJIS[cat.slug] || "🌿"}
              </span>
              <div className="text-center">
                <p className="font-sans text-sm font-semibold text-ink-900 group-hover:text-forest-700 transition-colors leading-tight">
                  {cat.name}
                </p>
                {cat.description && (
                  <p className="text-xs text-ink-400 mt-1 leading-snug line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </CustomerShell>
  );
}
