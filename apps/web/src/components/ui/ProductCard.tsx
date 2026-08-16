// Floria — ProductCard (Phase 3.18.3 Customer Pricing & Value Presentation System)
"use client";

import Link from "next/link";
import Image from "next/image";
import type { ProductListing } from "@floria/types";
import { StarRating } from "@/components/ui/StarRating";
import { ProductPriceBlock } from "@/components/ui/ProductPriceBlock";
import { BagIcon } from "@/components/ui/Icons";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { useCart } from "@/lib/contexts/CartContext";
import { WishlistHeartButton } from "@/components/ui/motion";

interface ProductCardProps {
  listing: ProductListing;
  showBestSeller?: boolean;
  discountPercent?: number;
  originalPricePaise?: number;
}

export function ProductCard({
  listing,
  showBestSeller,
  discountPercent,
  originalPricePaise,
}: ProductCardProps) {
  const { product, inventory, primary_image, seller, rating_summary, pricing } = listing;
  const isOutOfStock = inventory.stock_quantity === 0;

  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const wishlisted = isWishlisted(product.id);

  const reviewCount = rating_summary?.review_count ?? 0;
  const avgRating = rating_summary?.avg_rating ?? 0;

  // Server price or inventory price
  const sellingPricePaise = pricing?.sellingPricePaise ?? inventory.price_paise;
  const isFreeDelivery = Boolean(pricing?.isFreeDelivery);

  // Badge priority logic (Max 2 badges total to prevent badge overload)
  const badges: Array<{ key: string; label: string; className: string }> = [];

  if (isOutOfStock) {
    badges.push({ key: "stock", label: "OUT OF STOCK", className: "bg-ink-500 text-white" });
  }

  if (discountPercent && discountPercent > 0 && originalPricePaise && originalPricePaise > sellingPricePaise) {
    badges.push({ key: "discount", label: `${discountPercent}% OFF`, className: "bg-terracotta-700 text-white font-bold" });
  }

  if (isFreeDelivery && badges.length < 2) {
    badges.push({ key: "free-del", label: "FREE DELIVERY", className: "bg-forest-800 text-white font-bold" });
  }

  if (showBestSeller && badges.length < 2) {
    badges.push({ key: "bestseller", label: "BEST SELLER", className: "bg-terracotta-700 text-white font-bold" });
  }

  return (
    <div className="group flex flex-col bg-white rounded-xl overflow-hidden border border-ink-150 shadow-xs hover:shadow-md hover:border-forest-300 transition-all duration-250 ease-out focus-within:ring-2 focus-within:ring-forest-800">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="focus-visible:outline-none">
        <div className="relative overflow-hidden bg-cream-200" style={{ paddingBottom: "100%" }}>
          <Image
            src={primary_image?.url || "/floria-logo.png"}
            alt={primary_image?.alt_text || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-[1.025] transition-transform duration-300 ease-out"
          />
          {/* Capped Badges (Max 2) */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 font-ui">
            {badges.map((b) => (
              <span
                key={b.key}
                className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${b.className}`}
              >
                {b.label}
              </span>
            ))}
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
      <Link href={`/products/${product.slug}`} className="p-3.5 flex flex-col flex-1 focus-visible:outline-none">
        {/* Rating */}
        <div className="mb-1.5 min-h-[18px]">
          {reviewCount > 0 ? (
            <StarRating rating={avgRating} count={reviewCount} size="sm" />
          ) : (
            <span className="text-[11px] text-ink-500 font-ui font-medium">No reviews yet</span>
          )}
        </div>

        {/* Name */}
        <p className="font-sans text-[13px] font-semibold text-ink-900 leading-snug line-clamp-2 mb-0.5 group-hover:text-forest-800 transition-colors">
          {product.name}
        </p>

        {/* Seller / Nursery */}
        <p className="text-[11px] text-ink-500 mb-2 font-ui flex items-center gap-1">
          <span>{seller.business_name}</span>
          {seller.is_verified && <span className="text-forest-800 font-bold" title="Verified Nursery Partner">✓</span>}
        </p>

        {/* Price & Cart button row */}
        <div className="mt-auto flex items-end justify-between pt-1">
          <ProductPriceBlock
            sellingPricePaise={sellingPricePaise}
            originalPricePaise={originalPricePaise}
            discountPercentage={discountPercent}
            size="sm"
            showSavings={false}
          />

          {/* Cart Icon circle */}
          <button
            type="button"
            aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
            disabled={isOutOfStock}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(listing);
            }}
            className={[
              "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-1 flex-shrink-0",
              isOutOfStock
                ? "bg-cream-300 text-ink-400 cursor-not-allowed"
                : "bg-terracotta-700 hover:bg-terracotta-800 text-white focus:ring-terracotta-700 active:scale-95",
            ].join(" ")}
          >
            <BagIcon size={14} />
          </button>
        </div>
      </Link>
    </div>
  );
}
