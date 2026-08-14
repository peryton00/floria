import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { getProductListingBySlug } from "@/lib/services/storefront";
import { ProductDetailsInteractive } from "@/components/ui/ProductDetailsInteractive";

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
    </CustomerShell>
  );
}
