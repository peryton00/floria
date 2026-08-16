import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { getProductListingBySlug, getRelatedListings } from "@/lib/services/storefront";
import { ProductDetailsInteractive } from "@/components/ui/ProductDetailsInteractive";
import { ProductCard } from "@/components/ui/ProductCard";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getProductListingBySlug(slug);
  if (!listing) return { title: "Product not found — Floria" };
  return {
    title: `${listing.product.name} — Floria`,
    description: listing.product.description ?? `Buy ${listing.product.name} from ${listing.seller.business_name} on Floria.`,
  };
}

export default async function ProductSlugPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getProductListingBySlug(slug);

  if (!listing) notFound();

  const { product, category } = listing;
  const relatedListings = await getRelatedListings(slug);

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        {category && (
          <>
            <Link href={`/categories/${category.slug}`} className="hover:text-forest-700 transition-colors">
              {category.name}
            </Link>
            <span aria-hidden="true" className="select-none text-ink-300">/</span>
          </>
        )}
        <span className="text-ink-700 font-medium line-clamp-1">{product.name}</span>
      </nav>

      {/* Main interactive panel */}
      <ProductDetailsInteractive listing={listing} />

      {/* Similar Products */}
      {relatedListings.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-14 pt-10 border-t border-ink-100">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 id="related-heading" className="font-serif text-xl font-bold text-ink-900">
                Similar Products
              </h2>
              <p className="text-xs text-ink-400 mt-0.5">
                More choices from the {category?.name || "same"} category.
              </p>
            </div>
            <Link
              href={category ? `/categories/${category.slug}` : "/shop"}
              className="text-xs font-bold uppercase tracking-wider text-forest-700 hover:text-forest-900 transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {relatedListings.slice(0, 6).map((item) => (
              <ProductCard key={item.product.id} listing={item} />
            ))}
          </div>
        </section>
      )}
    </CustomerShell>
  );
}
