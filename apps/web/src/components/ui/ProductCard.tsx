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
    badges.push({ key: "stock", label: "OUT OF STOCK", className: "bg-ink-900/80 text-white" });
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
    <div className="group relative flex flex-col bg-floria-linen rounded-2xl overflow-hidden border border-floria-border shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-forest-400 transition-all duration-300 ease-out focus-within:ring-2 focus-within:ring-forest-800">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="focus-visible:outline-none">
        <div className="relative overflow-hidden bg-floria-natural-sand" style={{ paddingBottom: "100%" }}>
          <Image
            src={primary_image?.url || "/floria-logo.png"}
            alt={primary_image?.alt_text || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          {/* Subtle hover gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Capped Micro Badges (Max 2) */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 font-ui z-10">
            {badges.map((b) => (
              <span
                key={b.key}
                className={`px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider rounded-md shadow-xs backdrop-blur-xs ${b.className}`}
              >
                {b.label}
              </span>
            ))}
          </div>

          {/* Wishlist glass heart button */}
          <div className="absolute top-2 right-2 z-10">
            <WishlistHeartButton
              active={wishlisted}
              size={14}
              className="w-8 h-8 flex items-center justify-center bg-white/85 hover:bg-white backdrop-blur-md shadow-xs border border-white/60 text-ink-400 hover:text-red-600 transition-transform active:scale-90"
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
            <span className="text-[11px] text-ink-400 font-ui font-medium">New arrival</span>
          )}
        </div>

        {/* Name */}
        <p className="font-sans text-[13.5px] font-semibold text-ink-900 leading-snug line-clamp-2 mb-1 group-hover:text-forest-800 transition-colors">
          {product.name}
        </p>

        {/* Seller / Nursery */}
        <p className="text-[11px] text-ink-500 mb-3 font-ui flex items-center gap-1">
          <span className="truncate">{seller.business_name}</span>
          {seller.is_verified && (
            <span
              className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-forest-100 text-forest-800 text-[9px] font-bold flex-shrink-0"
              title="Verified Nursery Partner"
            >
              ✓
            </span>
          )}
        </p>

        {/* Price & Cart button row */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-ink-100/60">
          <ProductPriceBlock
            sellingPricePaise={sellingPricePaise}
            originalPricePaise={originalPricePaise}
            discountPercentage={discountPercent}
            size="sm"
            showSavings={false}
          />

          {/* Cart Icon button */}
          <button
            type="button"
            aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
            disabled={isOutOfStock}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(listing);
            }}
            style={!isOutOfStock ? { color: "#ffffff" } : undefined}
            className={[
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-1 flex-shrink-0",
              isOutOfStock
                ? "bg-cream-300 text-ink-400 cursor-not-allowed"
                : "bg-terracotta-700 hover:bg-terracotta-800 !text-white hover:shadow-md hover:scale-105 active:scale-95 focus:ring-terracotta-700",
            ].join(" ")}
          >
            <BagIcon size={14} className="text-white" />
          </button>
        </div>
      </Link>
    </div>
  );
}
