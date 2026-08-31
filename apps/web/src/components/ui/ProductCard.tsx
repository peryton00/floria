// Floria — ProductCard (Phase 3.18.3 Customer Pricing & Value Presentation System)
"use client";

import { useState } from "react";
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
  const { product, inventory, primary_image, seller, rating_summary, pricing } =
    listing;
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
    badges.push({
      key: "stock",
      label: "OUT OF STOCK",
      className: "bg-ink-900/80 text-white",
    });
  }

  if (
    discountPercent &&
    discountPercent > 0 &&
    originalPricePaise &&
    originalPricePaise > sellingPricePaise
  ) {
    badges.push({
      key: "discount",
      label: `${discountPercent}% OFF`,
      className: "bg-terracotta-700 text-white font-bold",
    });
  }

  if (isFreeDelivery && badges.length < 2) {
    badges.push({
      key: "free-del",
      label: "FREE DELIVERY",
      className: "bg-forest-800 text-white font-bold",
    });
  }

  if (showBestSeller && badges.length < 2) {
    badges.push({
      key: "bestseller",
      label: "BEST SELLER",
      className: "bg-terracotta-700 text-white font-bold",
    });
  }

  const [imgError, setImgError] = useState(false);
  const isFallback = !primary_image?.url || imgError;

  return (
    <div className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-floria-border/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:border-forest-500/50 transition-all duration-300 ease-out focus-within:ring-2 focus-within:ring-forest-800">
      {/* Image Container */}
      <Link
        href={`/products/${product.slug}`}
        className="focus-visible:outline-none"
      >
        <div
          className="relative overflow-hidden bg-stone-50/50"
          style={{ paddingBottom: "100%" }}
        >
          <Image
            src={isFallback ? "/brand_logo.svg" : primary_image!.url}
            alt={primary_image?.alt_text || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgError(true)}
            className={
              isFallback
                ? "object-scale-down p-6 opacity-60 transition-transform duration-500 ease-out"
                : "object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            }
          />
          {/* Subtle hover overlay */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-0.5 font-ui z-10">
            {badges.map((b) => (
              <span
                key={b.key}
                className={`px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider rounded shadow-2xs ${b.className}`}
              >
                {b.label}
              </span>
            ))}
          </div>

          {/* Wishlist glass heart button */}
          <div className="absolute top-2 right-2 z-10">
            <WishlistHeartButton
              active={wishlisted}
              size={13}
              className="w-7.5 h-7.5 flex items-center justify-center bg-white/90 hover:bg-white backdrop-blur-md shadow-xs border border-stone-200/80 text-stone-400 hover:text-red-600 transition-transform active:scale-90"
              onToggle={() => toggleWishlist(listing)}
            />
          </div>
        </div>
      </Link>

      {/* Card Info Content */}
      <Link
        href={`/products/${product.slug}`}
        className="p-3 flex flex-col flex-1 focus-visible:outline-none"
      >
        {/* Brand / Seller Subtitle */}
        <p className="text-[11px] font-medium text-stone-500 mb-0.5 font-ui flex items-center gap-1 truncate">
          <span className="truncate">{seller.business_name}</span>
          {seller.is_verified && (
            <span
              className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-forest-100 text-forest-800 text-[8px] font-bold flex-shrink-0"
              title="Verified Nursery Partner"
            >
              ✓
            </span>
          )}
        </p>

        {/* Product Title */}
        <p className="font-sans text-[13px] font-semibold text-stone-900 leading-snug line-clamp-1 mb-1.5 group-hover:text-forest-800 transition-colors">
          {product.name}
        </p>

        {/* Flipkart-Style Rating Badge */}
        <div className="mb-2.5 min-h-[18px] flex items-center">
          {reviewCount > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-forest-800 text-white text-[10px] font-bold shadow-2xs">
                <span>{avgRating ? avgRating.toFixed(1) : "4.5"}</span>
                <span className="text-[9px]">★</span>
              </div>
              <span className="text-[11px] text-stone-400 font-medium font-ui">
                ({reviewCount})
              </span>
            </div>
          ) : (
            <span className="text-[10.5px] text-stone-400 font-ui font-medium">
              New arrival
            </span>
          )}
        </div>

        {/* Price & Cart button row (Flipkart pricing style) */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-stone-100">
          <div className="flex flex-col">
            <ProductPriceBlock
              sellingPricePaise={sellingPricePaise}
              originalPricePaise={originalPricePaise}
              discountPercentage={discountPercent}
              size="sm"
              showSavings={false}
            />
            {isFreeDelivery && (
              <span className="text-[10px] font-semibold text-emerald-700 font-ui mt-0.5">
                Free delivery
              </span>
            )}
          </div>

          {/* Quick Add to Cart button */}
          <button
            type="button"
            aria-label={
              isOutOfStock
                ? `${product.name} is out of stock`
                : `Add ${product.name} to cart`
            }
            disabled={isOutOfStock}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(listing);
            }}
            style={!isOutOfStock ? { color: "#ffffff" } : undefined}
            className={[
              "w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all duration-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-1 flex-shrink-0",
              isOutOfStock
                ? "bg-cream-300 text-ink-400 cursor-not-allowed"
                : "bg-terracotta-700 hover:bg-terracotta-800 !text-white hover:shadow-md hover:scale-105 active:scale-95 focus:ring-terracotta-700",
            ].join(" ")}
          >
            <BagIcon size={13} className="text-white" />
          </button>
        </div>
      </Link>
    </div>
  );
}
