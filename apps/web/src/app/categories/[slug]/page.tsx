import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { getCategoryBySlug, getProductListingsByCategorySlug } from "@/lib/services/storefront";
import { ProductCard } from "@/components/ui/ProductCard";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterAndSortControls } from "@/components/ui/FilterAndSortControls";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeafIcon } from "@/components/ui/Icons";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    nursery?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: "featured" | "top-rated" | "most-reviewed" | "price-asc" | "price-desc" | "newest";
    q?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found — Floria" };
  return {
    title: `${category.name} — Floria`,
    description: category.description ?? `Shop ${category.name} from local nurseries on Floria.`,
  };
}

export default async function CategorySlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sParams = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const minPriceNum = sParams.minPrice ? parseFloat(sParams.minPrice) : undefined;
  const maxPriceNum = sParams.maxPrice ? parseFloat(sParams.maxPrice) : undefined;

  const productListings = await getProductListingsByCategorySlug(slug, {
    nurseryId: sParams.nursery,
    minPrice: minPriceNum,
    maxPrice: maxPriceNum,
    inStockOnly: sParams.inStock === "true",
    searchQuery: sParams.q,
    sort: sParams.sort,
  });

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-500 mb-6 font-ui flex-wrap">
        <Link href="/" className="hover:text-forest-800 transition-colors">Home</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <Link href="/categories" className="hover:text-forest-800 transition-colors">Categories</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <span className="text-ink-900 font-semibold">{category.name}</span>
      </nav>

      {/* Header Banner */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b border-floria-border">
        <div>
          <span className="inline-flex items-center px-2.5 py-1 mb-2 text-[10px] font-bold uppercase tracking-widest text-forest-800 bg-forest-100/90 border border-forest-200/80 rounded-full font-ui">
            Botanical Collection
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink-900 tracking-tight leading-tight">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-xs md:text-sm text-ink-500 mt-1 max-w-xl leading-relaxed">
              {category.description}
            </p>
          )}
        </div>
        <Link
          href="/categories"
          className="text-xs font-bold text-forest-800 hover:text-forest-900 flex items-center gap-1.5 transition-colors uppercase tracking-wider font-ui"
        >
          <span>&larr;</span>
          <span>All Categories</span>
        </Link>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Sidebar with Independent Scroll */}
        <div className="hidden md:block sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          <FilterSidebar currentCategory={slug} />
        </div>

        {/* Content Panel */}
        <div>
          <FilterAndSortControls
            totalCount={productListings.length}
            currentCategorySlug={slug}
          />

          {/* Product Grid */}
          {productListings.length === 0 ? (
            <EmptyState
              badge="No Matching Plants"
              title="No products match your filters"
              description="We couldn't find anything matching your active filters in this category. Try adjusting your criteria or discover other green collections."
              primaryAction={{
                label: "Reset Category Filters",
                href: `/categories/${slug}`,
              }}
              secondaryAction={{
                label: "Explore All Categories",
                href: "/categories",
              }}
              suggestions={[
                { label: "Indoor Plants", href: "/categories/indoor-plants" },
                { label: "Herbs & Edibles", href: "/categories/herbs-edibles" },
                { label: "Planters & Pots", href: "/categories/planters-pots" },
                { label: "Soil & Fertilizers", href: "/categories/soil-fertilizers" },
              ]}
            />
          ) : (
            <div
              className="grid grid-cols-2 lg:grid-cols-3 gap-4"
              aria-label={`Products in ${category.name}`}
            >
              {productListings.map((listing, i) => (
                <ProductCard
                  key={listing.product.id}
                  listing={listing}
                  showBestSeller={i === 0}
                  discountPercent={i === 1 ? 25 : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerShell>
  );
}
