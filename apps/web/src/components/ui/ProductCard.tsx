// Floria — ProductCard (visual match to reference)
// "use client" is required for the wishlist onClick button
"use client";

import Link from "next/link";
import Image from "next/image";
import type { ProductListing } from "@floria/types";
import { StarRating } from "@/components/ui/StarRating";
import { formatINR } from "@/lib/format";
import { WishlistIcon, BagIcon } from "@/components/ui/Icons";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { useCart } from "@/lib/contexts/CartContext";

import { WishlistHeartButton } from "@/components/ui/motion";

interface ProductCardProps {
  listing: ProductListing;
  showBestSeller?: boolean;
  discountPercent?: number;
}

export function ProductCard({ listing, showBestSeller, discountPercent }: ProductCardProps) {
  const { product, inventory, primary_image, seller, rating_summary } = listing;
  const isOutOfStock = inventory.stock_quantity === 0;

  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const wishlisted = isWishlisted(product.id);

  const reviewCount = rating_summary?.review_count ?? 0;
  const avgRating = rating_summary?.avg_rating ?? 0;
  const originalPrice = discountPercent
    ? Math.round(inventory.price_paise / (1 - discountPercent / 100) / 100) * 100
    : null;

  return (
    <div className="group flex flex-col bg-white rounded-xl overflow-hidden border border-ink-100 shadow-xs hover:shadow-md hover:border-forest-200 transition-all duration-250 ease-out focus-within:ring-2 focus-within:ring-forest-700">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="focus-visible:outline-none">
        <div className="relative overflow-hidden" style={{ paddingBottom: "100%" }}>
          <Image
            src={primary_image?.url || "/floria-logo.png"}
            alt={primary_image?.alt_text || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-[1.025] transition-transform duration-300 ease-out"
          />
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 font-ui">
            {showBestSeller && (
              <span
                className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white rounded"
                style={{ backgroundColor: "var(--color-red-700)" }}
              >
                BEST SELLER
              </span>
            )}
            {discountPercent && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white rounded bg-forest-700">
                {discountPercent}% OFF
              </span>
            )}
            {isOutOfStock && (
              <span className="px-2 py-0.5 text-[10px] font-bold text-white rounded bg-ink-500">
                OUT OF STOCK
              </span>
            )}
          </div>
          {/* Wishlist heart */}
          <div className="absolute top-1.5 right-1.5 z-10">
            <WishlistHeartButton
              active={wishlisted}
              size={14}
              onToggle={() => toggleWishlist(listing)}
            />
          </div>
        </div>
      </Link>

      {/* Info */}
      <Link href={`/products/${product.slug}`} className="p-3 flex flex-col flex-1 focus-visible:outline-none">
        {/* Rating */}
        <div className="mb-1.5 min-h-[18px]">
          {reviewCount > 0 ? (
            <StarRating rating={avgRating} count={reviewCount} size="sm" />
          ) : (
            <span className="text-[11px] text-ink-400 font-ui">No reviews yet</span>
          )}
        </div>
        {/* Name */}
        <p className="font-sans text-[13px] font-semibold text-ink-900 leading-snug line-clamp-2 mb-0.5 group-hover:text-forest-700 transition-colors">
          {product.name}
        </p>
        {/* Seller */}
        <p className="text-[11px] text-ink-400 mb-2 font-ui">{seller.business_name}</p>
        {/* Price & Cart button row */}
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-ink-900">
                {formatINR(inventory.price_paise)}
              </span>
              {originalPrice && (
                <span className="text-[11px] text-ink-300 line-through">
                  {formatINR(originalPrice)}
                </span>
              )}
            </div>
          </div>
          {/* Cart Icon circle */}
          <button
            type="button"
            aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
            disabled={isOutOfStock}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(listing); }}
            className={[
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1",
              isOutOfStock
                ? "bg-ink-100 text-ink-300 cursor-not-allowed"
                : "bg-forest-700 hover:bg-forest-800 text-white focus:ring-forest-600",
            ].join(" ")}
          >
            <BagIcon size={14} />
          </button>
        </div>
      </Link>
    </div>
  );
}
