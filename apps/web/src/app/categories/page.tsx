import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { getActiveCategories } from "@/lib/services/storefront";

export const metadata: Metadata = {
  title: "Categories — Floria",
  description: "Browse all plant and gardening product categories on Floria.",
};

import { getSystemMediaUrl } from "@/lib/services/systemMedia";

export default async function CategoriesPage() {
  const categories = await getActiveCategories();

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-500 mb-6 flex-wrap font-ui">
        <Link href="/" className="hover:text-forest-800 transition-colors">Home</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <span className="text-ink-900 font-semibold">Categories</span>
      </nav>

      {/* Header Banner */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10 pb-6 border-b border-floria-border">
        <div>
          <span className="inline-flex items-center px-2.5 py-1 mb-2 text-[10px] font-bold uppercase tracking-widest text-forest-800 bg-forest-100/90 border border-forest-200/80 rounded-full font-ui">
            Botanical Collections
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink-900 tracking-tight leading-tight">
            Browse Categories
          </h1>
          <p className="text-xs md:text-sm text-ink-500 mt-1">
            {categories.length} curated marketplace collections from verified local nurseries.
          </p>
        </div>
        <Link
          href="/shop"
          style={{ color: "#FFFFFF" }}
          className="py-3 px-5 bg-terracotta-700 hover:bg-terracotta-800 active:bg-terracotta-900 !text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          View All Products &rarr;
        </Link>
      </div>

      {/* Category Photography Grid */}
      <div
        role="list"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5"
        aria-label="All product categories"
      >
        {categories.map((cat) => {
          const catImgUrl = cat.banner_url || cat.image_url || getSystemMediaUrl("/cat-plants.png", "banner");

          return (
            <div key={cat.id} role="listitem">
              <Link
                href={`/categories/${cat.slug}`}
                className={[
                  "group relative flex flex-col p-4 sm:p-5 h-full",
                  "bg-floria-linen rounded-3xl border border-floria-border shadow-xs",
                  "hover:border-forest-400 hover:shadow-lg hover:-translate-y-1",
                  "transition-all duration-300 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-800",
                ].join(" ")}
              >
                {/* Category Photography Frame */}
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-floria-natural-sand mb-4 border border-floria-border shadow-2xs">
                  <Image
                    src={catImgUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                  />
                  {/* Subtle bottom gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Category Info */}
                <div className="flex flex-col flex-1">
                  <p className="font-serif text-base sm:text-lg font-bold text-ink-900 group-hover:text-forest-800 transition-colors leading-snug">
                    {cat.name}
                  </p>
                  {cat.description && (
                    <p className="text-xs text-ink-500 mt-1 leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>
                  )}

                  {/* Bottom link prompt */}
                  <div className="mt-auto pt-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-forest-800">
                    <span>Explore</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-200">&rarr;</span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </CustomerShell>
  );
}
