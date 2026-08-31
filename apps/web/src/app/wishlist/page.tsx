"use client";

import Image from "next/image";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { useCart } from "@/lib/contexts/CartContext";
import { WishlistIcon, BagIcon, MapPinIcon } from "@/components/ui/Icons";
import { StarRating } from "@/components/ui/StarRating";
import { ProductPriceBlock } from "@/components/ui/ProductPriceBlock";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Category } from "@floria/types";

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api
      .getCategories()
      .then((res) => {
        if (res.success && res.data) setCategories(res.data);
      })
      .catch(() => {});
  }, []);

  const handleMoveToCart = (item: any) => {
    // Add to cart (handles duplicates inside CartContext)
    addToCart(item);
    // Remove from wishlist
    removeFromWishlist(item.product.id);
  };

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-ink-400 mb-4 sm:mb-6 font-ui"
      >
        <Link href="/" className="hover:text-forest-800 transition-colors">
          Home
        </Link>
        <span aria-hidden="true" className="select-none text-ink-300">
          /
        </span>
        <span className="text-ink-900 font-semibold">Wishlist</span>
      </nav>

      {/* Header Banner */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-4 border-b border-ink-150/70">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 mb-2 text-[10px] font-bold uppercase tracking-widest text-forest-800 bg-forest-100/90 border border-forest-200/80 rounded-full font-ui">
            Saved Flora
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-ink-900 tracking-tight">
            Your Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-1 font-medium">
            Saved plants and nursery essentials ready for your green space.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-floria-sand border border-floria-border text-forest-800 rounded-full font-ui">
            {wishlistItems.length}{" "}
            {wishlistItems.length === 1 ? "Plant" : "Plants"} Saved
          </span>
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        // Empty State with Botanical Polish & Quick Discover Shortcuts
        <div className="relative max-w-xl mx-auto my-6 sm:my-10 p-8 sm:p-14 bg-gradient-to-b from-floria-linen to-floria-soft-sand rounded-3xl border border-floria-border shadow-sm text-center font-ui overflow-hidden">
          {/* Subtle Ambient Botanical Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-forest-100/50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-cream-200/60 rounded-full blur-3xl pointer-events-none" />

          {/* Circular Heart Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-forest-50 border border-forest-200/90 flex items-center justify-center text-forest-700 mx-auto mb-6 shadow-2xs">
            <WishlistIcon
              size={28}
              className="text-forest-700 fill-terracotta-700/15 stroke-[2.2]"
            />
          </div>

          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink-900 mb-2 tracking-tight">
            Your Wishlist is Empty
          </h2>
          <p className="text-xs sm:text-sm text-ink-600 mb-8 max-w-md mx-auto leading-relaxed font-medium">
            Found a rare monstera, artisan pot, or organic fertilizer you love?
            Tap the heart icon on any product to save your favorites here.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link
              href="/categories"
              style={{ color: "#ffffff" }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-forest-800 hover:bg-forest-900 active:bg-forest-950 !text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 font-ui group"
            >
              <span className="!text-white">Explore All Plants</span>
              <span className="!text-white group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </Link>
            <Link
              href="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 border border-forest-800/30 hover:border-forest-800 hover:bg-forest-800/5 text-forest-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all font-ui"
            >
              Best Sellers
            </Link>
          </div>

          {/* Quick Discovery Category Links */}
          <div className="pt-6 border-t border-floria-border">
            <p className="text-[11px] font-bold text-ink-400 uppercase tracking-widest mb-3">
              Popular Collections to Explore
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="text-xs font-semibold text-forest-800 bg-floria-linen hover:bg-forest-100/90 active:bg-forest-200 border border-forest-200/80 px-3.5 py-1.5 rounded-full transition-all shadow-2xs hover:scale-105 active:scale-95"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Wishlist Grid
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 md:gap-5">
          {wishlistItems.map((item) => {
            const {
              product,
              inventory,
              primary_image,
              seller,
              category,
              rating_summary,
              pricing,
            } = item;
            const isOutOfStock = inventory.stock_quantity === 0;

            const reviewCount = rating_summary?.review_count ?? 0;
            const avgRating = rating_summary?.avg_rating ?? 0;

            const sellingPricePaise =
              pricing?.sellingPricePaise ?? inventory.price_paise;
            const originalPricePaise = pricing?.originalPricePaise;
            const discountPercent =
              originalPricePaise && originalPricePaise > sellingPricePaise
                ? Math.round(
                    ((originalPricePaise - sellingPricePaise) /
                      originalPricePaise) *
                      100,
                  )
                : 0;

            return (
              <div
                key={product.id}
                className="group flex flex-col bg-floria-linen rounded-2xl sm:rounded-3xl overflow-hidden border border-floria-border shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:border-forest-400 transition-all duration-300 ease-out relative"
              >
                {/* Image Section */}
                <div className="relative aspect-square w-full bg-floria-natural-sand overflow-hidden border-b border-floria-border">
                  <Image
                    src={primary_image?.url || "/brand_logo.svg"}
                    alt={primary_image?.alt_text || product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className={
                      primary_image?.url
                        ? "object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                        : "object-scale-down p-8 opacity-60 transition-transform duration-500 ease-out"
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                  {/* Out of Stock & Discount Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 font-ui z-10">
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 text-[9px] font-bold text-white rounded-md bg-ink-700 shadow-2xs">
                        OUT OF STOCK
                      </span>
                    ) : discountPercent > 0 ? (
                      <span className="px-2 py-0.5 text-[9px] font-bold text-white rounded-md bg-terracotta-700 shadow-2xs">
                        {discountPercent}% OFF
                      </span>
                    ) : null}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    aria-label={`Remove ${product.name} from wishlist`}
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-rose-600 hover:scale-110 active:scale-95 transition-all shadow-xs border border-white/60 z-10"
                  >
                    <WishlistIcon size={15} className="fill-rose-600" />
                  </button>
                </div>

                {/* Details Section */}
                <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                  {/* Category */}
                  {category?.name && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-forest-800 mb-1 font-ui">
                      {category.name}
                    </span>
                  )}

                  {/* Rating */}
                  <div className="mb-1.5 min-h-[16px]">
                    {reviewCount > 0 ? (
                      <StarRating
                        rating={avgRating}
                        count={reviewCount}
                        size="sm"
                      />
                    ) : (
                      <span className="text-[10px] text-ink-400 font-ui font-medium">
                        New plant
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="font-serif text-xs sm:text-sm font-bold text-ink-900 leading-snug line-clamp-1 mb-1 group-hover:text-forest-800 transition-colors">
                    {product.name}
                  </h3>

                  {/* Seller */}
                  <p className="text-[11px] text-ink-500 mb-3 font-ui truncate flex items-center gap-1">
                    <MapPinIcon
                      size={11}
                      className="text-ink-400 flex-shrink-0"
                    />
                    <span className="truncate">{seller.business_name}</span>
                  </p>

                  {/* Price & Move to Cart CTA */}
                  <div className="mt-auto pt-2 border-t border-ink-100/70">
                    <ProductPriceBlock
                      sellingPricePaise={sellingPricePaise}
                      originalPricePaise={originalPricePaise}
                      discountPercentage={discountPercent}
                      size="sm"
                      showSavings={false}
                    />

                    <div className="mt-2.5">
                      {isOutOfStock ? (
                        <button
                          disabled
                          aria-label={`${product.name} is out of stock`}
                          className="w-full py-2.5 bg-ink-100 text-ink-400 text-xs font-bold uppercase rounded-xl cursor-not-allowed font-ui"
                        >
                          Out of Stock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMoveToCart(item)}
                          aria-label={`Move ${product.name} to cart`}
                          style={{ color: "#ffffff" }}
                          className="w-full py-2.5 bg-forest-800 hover:bg-forest-900 active:bg-forest-950 !text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs hover:shadow-md active:scale-95 font-ui flex items-center justify-center gap-1.5"
                        >
                          <BagIcon size={13} className="text-white" />
                          <span>Move to Cart</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CustomerShell>
  );
}
