"use client";

import Image from "next/image";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { useCart } from "@/lib/contexts/CartContext";
import { formatINR } from "@/lib/format";
import { WishlistIcon, LeafIcon, StarIcon } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart, cartItems } = useCart();

  const handleMoveToCart = (item: any) => {
    // Add to cart (handles duplicates inside CartContext)
    addToCart(item);
    // Remove from wishlist
    removeFromWishlist(item.product.id);
  };

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400 mb-6">
        <Link href="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <span className="text-ink-700 font-medium">Wishlist</span>
      </nav>

      <div className="flex items-baseline justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold text-ink-900">Your Wishlist</h1>
        <span className="text-sm font-semibold text-ink-500 font-ui">
          {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"}
        </span>
      </div>

      {wishlistItems.length === 0 ? (
        // Empty State
        <div className="text-center py-16 bg-white rounded-2xl border border-ink-100 shadow-sm max-w-md mx-auto p-6">
          <div className="w-16 h-16 rounded-full bg-forest-50 flex items-center justify-center mx-auto mb-4 text-forest-700">
            <WishlistIcon size={28} className="text-forest-700" />
          </div>
          <h2 className="text-lg font-bold text-ink-900 mb-1">Your wishlist is empty</h2>
          <p className="text-sm text-ink-500 mb-6">
            Explore our curated plants and add them to your wishlist to buy them later.
          </p>
          <Link
            href="/categories"
            className="inline-flex items-center justify-center px-6 py-3 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-forest-700"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        // Wishlist Grid
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item) => {
            const { product, inventory, primary_image, seller, category } = item;
            const isOutOfStock = inventory.stock_quantity === 0;

            // Mock rating logic matching ProductCard.tsx
            const mockRating = parseFloat((4.3 + (product.name.charCodeAt(0) % 10) * 0.05).toFixed(1));
            const mockCount = 40 + (product.name.length * 7);

            // Mock discount matching ProductCard.tsx (assume 20% if discount not specified)
            const discountPercent = 20;
            const originalPrice = Math.round(inventory.price_paise / (1 - discountPercent / 100) / 100) * 100;

            return (
              <div
                key={product.id}
                className="group flex flex-col bg-white rounded-xl overflow-hidden border border-ink-100 hover:shadow-md transition-all duration-300 relative"
              >
                {/* Image Section */}
                <div className="relative aspect-square w-full bg-cream-50 overflow-hidden">
                  <Image
                    src={primary_image?.url || "/floria-logo.png"}
                    alt={primary_image?.alt_text || product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* Out of Stock & Discount Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 font-ui">
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 text-[9px] font-bold text-white rounded bg-ink-500">
                        OUT OF STOCK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[9px] font-bold text-white rounded bg-forest-700">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    aria-label={`Remove ${product.name} from wishlist`}
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 text-red-600 hover:bg-red-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  >
                    <WishlistIcon size={14} className="fill-red-600" />
                  </button>
                </div>

                {/* Details Section */}
                <div className="p-3.5 flex flex-col flex-1">
                  {/* Category */}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 mb-1">
                    {category?.name || "Indoor Plant"}
                  </span>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon
                          key={i}
                          size={11}
                          className={i < Math.floor(mockRating) ? "text-amber-400 fill-amber-400" : "text-ink-100"}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-ink-300">({mockCount})</span>
                  </div>

                  {/* Name */}
                  <h3 className="font-sans text-[13.5px] font-semibold text-ink-900 leading-snug line-clamp-2 mb-1">
                    {product.name}
                  </h3>

                  {/* Seller */}
                  <p className="text-[11px] text-ink-400 mb-3 font-ui">{seller.business_name}</p>

                  {/* Price */}
                  <div className="mt-auto">
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className="text-sm font-bold text-ink-900">
                        {formatINR(inventory.price_paise)}
                      </span>
                      <span className="text-[11px] text-ink-300 line-through">
                        {formatINR(originalPrice * 100)}
                      </span>
                    </div>

                    {/* Move to Cart CTA */}
                    {isOutOfStock ? (
                      <button
                        disabled
                        aria-label={`${product.name} is out of stock`}
                        className="w-full py-2 bg-ink-100 text-ink-400 text-xs font-bold uppercase rounded-lg cursor-not-allowed border border-transparent"
                      >
                        Out of Stock
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMoveToCart(item)}
                        aria-label={`Move ${product.name} to cart`}
                        className="w-full py-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold uppercase rounded-lg transition-colors border border-transparent focus:outline-none focus:ring-2 focus:ring-forest-600 focus:ring-offset-1"
                      >
                        Move to Cart
                      </button>
                    )}
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
