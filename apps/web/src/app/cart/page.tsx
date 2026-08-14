"use client";

import Image from "next/image";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { formatINR } from "@/lib/format";
import { BagIcon, WishlistIcon, LeafIcon } from "@/components/ui/Icons";
import { useCart } from "@/lib/contexts/CartContext";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import type { CartItem } from "@/lib/contexts/CartContext";

function stockStatus(qty: number, threshold: number) {
  if (qty === 0) return "out" as const;
  if (qty <= threshold) return "low" as const;
  return "in" as const;
}

/** Group cart items by seller ID, preserving insertion order of nurseries */
function groupBySeller(items: CartItem[]): { sellerId: string; sellerName: string; items: CartItem[] }[] {
  const map = new Map<string, { sellerId: string; sellerName: string; items: CartItem[] }>();
  for (const item of items) {
    const id = item.listing.seller.id;
    if (!map.has(id)) {
      map.set(id, { sellerId: id, sellerName: item.listing.seller.business_name, items: [] });
    }
    map.get(id)!.items.push(item);
  }
  return Array.from(map.values());
}

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartCount } = useCart();
  const { addToWishlist, isWishlisted } = useWishlist();

  // ── Calculations ────────────────────────────────────────────────────────────
  const subtotalPaise = cartItems.reduce(
    (sum, item) => sum + (item.listing?.inventory?.price_paise ?? 0) * item.quantity,
    0
  );
  // Mock 20% discount off original (original = price / 0.8 = price * 1.25)
  const discountPaise = cartItems.reduce((sum, item) => {
    const price = item.listing?.inventory?.price_paise ?? 0;
    const original = Math.round(price * 1.25);
    return sum + (original - price) * item.quantity;
  }, 0);

  const handleQtyChange = (productId: string, current: number, delta: number, maxStock: number) => {
    const next = current + delta;
    if (next < 1 || next > maxStock) return;
    updateQuantity(productId, next);
  };

  const handleMoveToWishlist = (item: CartItem) => {
    if (!isWishlisted(item.listing.product.id)) {
      addToWishlist(item.listing);
    }
    removeFromCart(item.listing.product.id);
  };

  // ── Empty State ─────────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <CustomerShell>
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400 mb-6">
          <Link href="/" className="hover:text-forest-700 transition-colors">Home</Link>
          <span aria-hidden="true" className="select-none text-ink-300">/</span>
          <span className="text-ink-700 font-medium">Cart</span>
        </nav>
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
          <div className="w-20 h-20 rounded-full bg-forest-50 flex items-center justify-center mb-6 text-forest-700">
            <BagIcon size={36} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 mb-2">Your cart is empty</h1>
          <p className="text-sm text-ink-500 mb-8 leading-relaxed">
            Explore our curated plant collection and add something green to your life.
          </p>
          <Link
            href="/categories"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-forest-700 focus:ring-offset-2"
          >
            Browse Plants
          </Link>
        </div>
      </CustomerShell>
    );
  }

  const nurseryGroups = groupBySeller(cartItems);

  // ── Cart Layout ─────────────────────────────────────────────────────────────
  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400 mb-6">
        <Link href="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <span className="text-ink-700 font-medium">Cart</span>
      </nav>

      {/* Header */}
      <h1 className="font-serif text-3xl font-bold text-ink-900 mb-6">
        Your Cart
        <span className="ml-2 font-sans text-lg font-normal text-ink-400">({cartCount} items)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

        {/* ── LEFT: Nursery-grouped items ─────────────────────────────────── */}
        <div className="space-y-6">
          {nurseryGroups.map((group) => (
            <div key={group.sellerId} className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden">
              {/* Nursery header */}
              <div className="flex items-center gap-2.5 px-4 py-3 bg-forest-50 border-b border-ink-100">
                <LeafIcon size={14} className="text-forest-700 flex-shrink-0" />
                <span className="text-xs font-bold text-forest-800 uppercase tracking-wider">
                  {group.sellerName}
                </span>
                <span className="ml-auto text-[11px] text-ink-400 font-medium">
                  {group.items.reduce((s, i) => s + i.quantity, 0)}{" "}
                  {group.items.reduce((s, i) => s + i.quantity, 0) === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Items in this nursery */}
              <div className="divide-y divide-ink-50">
                {group.items.map((item) => {
                  const { listing, quantity } = item;
                  const { product, inventory, primary_image, category } = listing;
                  const status = stockStatus(inventory.stock_quantity, inventory.low_stock_threshold);
                  const isOOS = status === "out";
                  const isLow = status === "low";
                  const originalPricePaise = Math.round(inventory.price_paise * 1.25);
                  const discountPct = Math.round((1 - inventory.price_paise / originalPricePaise) * 100);

                  return (
                    <div
                      key={product.id}
                      className={["flex gap-4 p-4", isOOS ? "opacity-75" : ""].join(" ")}
                    >
                      {/* Image */}
                      <Link href={`/products/${product.slug}`} className="flex-shrink-0">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-cream-50 border border-ink-100">
                          <Image
                            src={primary_image?.url || "/floria-logo.png"}
                            alt={primary_image?.alt_text || product.name}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                          {isOOS && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-ink-500 bg-white px-1.5 py-0.5 rounded">
                                Out of Stock
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        {/* Name + remove */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Link href={`/products/${product.slug}`} className="min-w-0">
                            <h2 className="font-sans text-sm font-bold text-ink-900 line-clamp-2 leading-snug hover:text-forest-700 transition-colors">
                              {product.name}
                            </h2>
                          </Link>
                          <button
                            type="button"
                            aria-label={`Remove ${product.name} from cart`}
                            onClick={() => removeFromCart(product.id)}
                            className="flex-shrink-0 text-ink-300 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 rounded p-0.5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>

                        {/* Category */}
                        <p className="text-[11px] text-ink-400 mb-2">{category?.name || "Indoor Plant"}</p>

                        {/* Stock badges */}
                        {isLow && (
                          <span className="inline-flex text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 mb-2 w-fit">
                            Only {inventory.stock_quantity} left
                          </span>
                        )}
                        {isOOS && (
                          <span className="inline-flex text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 mb-2 w-fit">
                            Out of Stock
                          </span>
                        )}

                        {/* Bottom row: qty + move-to-wishlist + price */}
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {/* Quantity */}
                            <div className="flex items-center border border-ink-200 rounded-lg overflow-hidden bg-white">
                              <button
                                type="button"
                                aria-label={`Decrease quantity of ${product.name}`}
                                disabled={isOOS || quantity <= 1}
                                onClick={() => handleQtyChange(product.id, quantity, -1, inventory.stock_quantity)}
                                className="w-8 h-8 flex items-center justify-center text-ink-500 hover:bg-cream-100 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-sm font-semibold text-ink-900 select-none">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                aria-label={`Increase quantity of ${product.name}`}
                                disabled={isOOS || quantity >= inventory.stock_quantity}
                                onClick={() => handleQtyChange(product.id, quantity, +1, inventory.stock_quantity)}
                                className="w-8 h-8 flex items-center justify-center text-ink-500 hover:bg-cream-100 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
                              >
                                +
                              </button>
                            </div>

                            {/* Move to wishlist */}
                            <button
                              type="button"
                              aria-label={`Move ${product.name} to wishlist`}
                              onClick={() => handleMoveToWishlist(item)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-ink-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 rounded px-1"
                            >
                              <WishlistIcon size={12} />
                              <span className="hidden sm:inline">Wishlist</span>
                            </button>
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-1.5">
                            {discountPct > 0 && (
                              <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded">
                                {discountPct}% OFF
                              </span>
                            )}
                            <div className="text-right">
                              <p className="text-sm font-bold text-ink-900">
                                {formatINR(inventory.price_paise * quantity)}
                              </p>
                              <p className="text-[11px] text-ink-300 line-through">
                                {formatINR(originalPricePaise * quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── RIGHT: Order Summary ─────────────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-24">


          {/* Price breakdown */}
          <div className="p-5 bg-white rounded-2xl border border-ink-100 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-900 pb-3 border-b border-ink-100 mb-4">
              Price Details
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Price ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-semibold text-ink-900">{formatINR(subtotalPaise + discountPaise)}</span>
              </div>
              <div className="flex justify-between text-forest-700">
                <span>Discount</span>
                <span className="font-semibold">−{formatINR(discountPaise)}</span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Delivery</span>
                <span className="text-ink-400 font-medium italic text-xs">Calculated at checkout</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-ink-100 text-ink-900 font-bold text-base">
                <span>Subtotal</span>
                <span className="text-forest-800">{formatINR(subtotalPaise)}</span>
              </div>
              {discountPaise > 0 && (
                <p className="text-[11px] text-forest-700 bg-forest-50 rounded-lg px-3 py-2 text-center font-semibold">
                  You save {formatINR(discountPaise)} on this order 🌿
                </p>
              )}
            </div>

            {/* CTAs */}
            <div className="space-y-3 mt-6">
              <Link
                href="/checkout"
                aria-label="Proceed to checkout"
                className="w-full flex items-center justify-center py-3.5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-700 focus:ring-offset-2"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/categories"
                className="w-full flex items-center justify-center py-3 border border-ink-200 hover:border-ink-400 text-ink-700 font-semibold text-sm rounded-xl transition-colors focus:outline-none"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Trust note */}
          <div className="px-4 py-3 bg-white rounded-xl border border-ink-100 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] text-ink-400">
              <LeafIcon size={14} className="text-forest-700 flex-shrink-0" />
              <span>All plants are quality-checked from trusted nurseries</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky CTA ──────────────────────────────────────────────── */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-4 pb-2 lg:hidden">
        <Link
          href="/checkout"
          aria-label="Proceed to checkout"
          className="w-full flex items-center justify-between py-3.5 px-5 bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm rounded-xl transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-forest-700"
        >
          <span>Proceed to Checkout</span>
          <span className="font-semibold text-forest-200">{formatINR(subtotalPaise)}</span>
        </Link>
      </div>
    </CustomerShell>
  );
}
