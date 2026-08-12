import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { getCategoryBySlug, getProductListings } from "@/lib/services/storefront";
import { ProductCard } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
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

export default async function CategorySlugPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const productListings = await getProductListings(category.id);

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400 mb-6">
        <Link href="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/categories" className="hover:text-forest-700 transition-colors">Categories</Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink-700 font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold text-ink-900 mb-1">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-sm text-ink-400">{category.description}</p>
        )}
        <p className="text-xs text-ink-300 mt-2">
          {productListings.length} product{productListings.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Product Grid */}
      {productListings.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="No active products in this category yet. Check back soon."
        />
      ) : (
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          aria-label={`Products in ${category.name}`}
        >
          {productListings.map((listing) => (
            <ProductCard key={listing.product.id} listing={listing} />
          ))}
        </div>
      )}
    </CustomerShell>
  );
}
