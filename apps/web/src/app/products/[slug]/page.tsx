import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { getProductListingBySlug } from "@/lib/services/storefront";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/components/ui/ProductCard";

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

  const { product, inventory, seller, category, images } = listing;

  const isOutOfStock = inventory.stock_quantity === 0;
  const isLowStock = !isOutOfStock && inventory.stock_quantity <= inventory.low_stock_threshold;
  const primaryImage = images.find(img => img.is_primary) || images[0] || null;
  const otherImages = images.filter(img => img !== primaryImage);

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span aria-hidden="true">/</span>
        {category && (
          <>
            <Link href={`/categories/${category.slug}`} className="hover:text-forest-700 transition-colors">
              {category.name}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span className="text-ink-700 font-medium line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Panel */}
        <div>
          {/* Primary Image */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-cream-50 border border-ink-100 mb-3">
            <Image
              src={primaryImage?.url || "/floria-logo.png"}
              alt={primaryImage?.alt_text || product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="object-cover"
            />
            {isOutOfStock && (
              <div className="absolute top-4 left-4">
                <Badge variant="error">Out of Stock</Badge>
              </div>
            )}
            {!isOutOfStock && isLowStock && (
              <div className="absolute top-4 left-4">
                <Badge variant="warning">Only {inventory.stock_quantity} left</Badge>
              </div>
            )}
          </div>

          {/* Thumbnail row */}
          {otherImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[primaryImage, ...otherImages].filter((img): img is typeof primaryImage & NonNullable<typeof primaryImage> => img !== null && img !== undefined).map((img, i) => (
                <div
                  key={i}
                  className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-ink-100"
                >
                  <Image
                    src={img.url}
                    alt={img.alt_text || `${product.name} image ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="flex flex-col">
          {/* Nursery */}
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-700 mb-2">
            {seller.business_name}
          </p>

          {/* Name */}
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-ink-900 leading-tight mb-4">
            {product.name}
          </h1>

          {/* Price + Stock Status */}
          <div className="flex items-baseline gap-4 mb-5">
            <span className="font-serif text-3xl font-bold text-forest-800">
              {formatINR(inventory.price_paise)}
            </span>
            {isOutOfStock ? (
              <Badge variant="error">Out of stock</Badge>
            ) : isLowStock ? (
              <Badge variant="warning">{inventory.stock_quantity} in stock</Badge>
            ) : (
              <Badge variant="success">In stock</Badge>
            )}
          </div>

          {/* Add to Cart — Phase 2 wires the action */}
          <button
            disabled={isOutOfStock}
            aria-disabled={isOutOfStock}
            className={[
              "w-full py-3.5 rounded-xl font-semibold text-sm mb-6",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2",
              isOutOfStock
                ? "bg-ink-100 text-ink-400 cursor-not-allowed"
                : "bg-forest-700 text-white hover:bg-forest-800 active:scale-[0.99]",
            ].join(" ")}
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>

          <div className="border-t border-ink-100 pt-6 space-y-5">
            {/* Description */}
            {product.description && (
              <div>
                <h2 className="font-sans text-sm font-semibold text-ink-700 uppercase tracking-wide mb-2">
                  About this plant
                </h2>
                <p className="text-sm text-ink-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Care instructions */}
            {product.care_instructions && (
              <div className="bg-sage-50 rounded-xl p-4">
                <h2 className="font-sans text-sm font-semibold text-forest-800 uppercase tracking-wide mb-2">
                  🌱 Care instructions
                </h2>
                <p className="text-sm text-ink-600 leading-relaxed">{product.care_instructions}</p>
              </div>
            )}

            {/* Sold by */}
            <div>
              <h2 className="font-sans text-sm font-semibold text-ink-700 uppercase tracking-wide mb-1">
                Sold by
              </h2>
              <p className="text-sm text-ink-600">{seller.business_name}</p>
            </div>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
