import type { Metadata } from "next";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { getActiveCategories } from "@/lib/services/storefront";
import {
  LeafIcon,
  SproutIcon,
  PlanterIcon,
  FlaskIcon,
  ToolsIcon,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Categories — Floria",
  description: "Browse all plant and gardening product categories on Floria.",
};

function CategoryIcon({ slug, className, size = 36 }: { slug: string; className?: string; size?: number }) {
  switch (slug) {
    case "indoor-plants":
    case "outdoor-plants":
    case "succulents-cacti":
    case "flowering-plants":
      return <LeafIcon size={size} className={className} />;
    case "herbs-edibles":
      return <SproutIcon size={size} className={className} />;
    case "planters-pots":
      return <PlanterIcon size={size} className={className} />;
    case "soil-fertilizers":
      return <FlaskIcon size={size} className={className} />;
    case "tools-accessories":
      return <ToolsIcon size={size} className={className} />;
    default:
      return <LeafIcon size={size} className={className} />;
  }
}

export default async function CategoriesPage() {
  const categories = await getActiveCategories();

  return (
    <CustomerShell>
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-ink-900 mb-1">
            Browse Categories
          </h1>
          <p className="text-xs text-ink-400">
            {categories.length} marketplace categories available
          </p>
        </div>
        <Link
          href="/shop"
          className="py-2.5 px-4 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
        >
          View All Products &rarr;
        </Link>
      </div>

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
              <span className="group-hover:scale-110 transition-transform duration-300">
                <CategoryIcon slug={cat.slug} className="text-forest-700" size={36} />
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
