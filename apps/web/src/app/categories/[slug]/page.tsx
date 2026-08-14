import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { getCategoryBySlug, getProductListingsByCategorySlug } from "@/lib/services/storefront";
import { ProductCard } from "@/components/ui/ProductCard";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterAndSortControls } from "@/components/ui/FilterAndSortControls";
import { LeafIcon } from "@/components/ui/Icons";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    nursery?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: "featured" | "price-asc" | "price-desc" | "newest";
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
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400 mb-6">
        <Link href="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <Link href="/categories" className="hover:text-forest-700 transition-colors">Categories</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <span className="text-ink-700 font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900 mb-1">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-xs text-ink-400">{category.description}</p>
        )}
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
            <div className="bg-white rounded-2xl border border-ink-100 p-8 sm:p-12 text-center shadow-sm my-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-cream-100 text-ink-400 flex items-center justify-center mx-auto">
                <LeafIcon size={24} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-ink-900 text-lg">No products match your filters</h3>
                <p className="text-xs text-ink-500 mt-1 max-w-sm mx-auto">
                  Try clearing your filters or exploring other categories on Floria.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  href={`/categories/${slug}`}
                  className="py-2.5 px-5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                >
                  Reset Category Filters
                </Link>
              </div>
            </div>
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
