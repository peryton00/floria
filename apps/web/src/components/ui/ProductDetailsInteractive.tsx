"use client";

import { useState } from "react";
import Image from "next/image";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import {
  StarIcon,
  VerifiedIcon,
  LeafIcon,
  ShieldIcon,
  TruckIcon,
  ReturnIcon,
  WishlistIcon,
} from "@/components/ui/Icons";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { useCart } from "@/lib/contexts/CartContext";

interface ProductDetailsInteractiveProps {
  listing: any; // ProductListing
}

export function ProductDetailsInteractive({ listing }: ProductDetailsInteractiveProps) {
  const { product, inventory, seller, category, images } = listing;
  const isOutOfStock = inventory.stock_quantity === 0;

  // States
  const [selectedImage, setSelectedImage] = useState(images[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart, cartItems } = useCart();
  const wishlisted = isWishlisted(product.id);

  const handleBuyNow = async () => {
    if (isOutOfStock) return;

    // Client-side condition check: verify if product is already in cart
    const existsInCart = cartItems.some(
      (item) => item.listing?.product?.id === product.id
    );

    if (!existsInCart) {
      await addToCart(listing, quantity);
    }

    window.location.href = "/cart";
  };

  // Mock details
  const mockRating = 4.8;
  const mockReviewsCount = 320;
  const originalPrice = 119900; // ₹1,199
  const discountPercent = 25;

  const features = [
    "Large, glossy leaves",
    "Air purifying plant",
    "Easy to care",
  ];

  const handleIncrement = () => {
    if (quantity < inventory.stock_quantity) {
      setQuantity(q => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  // Tab content selection
  const renderTabContent = () => {
    switch (activeTab) {
      case "description":
        return (
          <p className="text-sm text-ink-500 leading-relaxed">
            {product.description ||
              "Bring home the iconic Monstera Deliciosa, also known as the Swiss Cheese Plant. Famous for its large, glossy leaves with natural fenestrations, it adds a dramatic tropical touch to any indoor space. Highly adaptable and relatively easy to care for."}
          </p>
        );
      case "care":
        return (
          <p className="text-sm text-ink-500 leading-relaxed">
            {product.care_instructions ||
              "Water every 1-2 weeks, allowing soil to dry out between waterings. Expect to water more often in brighter light. Thrive in medium to bright indirect light, but can tolerate low indirect light."}
          </p>
        );
      case "specs":
        return (
          <div className="space-y-2 text-sm text-ink-500">
            <div className="grid grid-cols-2 py-1 border-b border-ink-100">
              <span className="font-semibold text-ink-700">Difficulty</span>
              <span>Easy to Moderate</span>
            </div>
            <div className="grid grid-cols-2 py-1 border-b border-ink-100">
              <span className="font-semibold text-ink-700">Height</span>
              <span>2.5 - 3 feet</span>
            </div>
            <div className="grid grid-cols-2 py-1">
              <span className="font-semibold text-ink-700">Toxic to Pets</span>
              <span>Yes (contains calcium oxalate)</span>
            </div>
          </div>
        );
      case "nursery":
        return (
          <div className="space-y-2 text-sm text-ink-500">
            <p className="font-semibold text-ink-900">{seller.business_name}</p>
            <p>{seller.business_name} is a verified nursery specializing in premium indoor foliage and exotic plants located in Raipur, Chhattisgarh.</p>
            <p className="text-xs text-forest-700 font-semibold">100% Organic Soils & Sustainable Farming practices.</p>
          </div>
        );
      case "reviews":
        return (
          <div className="space-y-3">
            {[
              { name: "Rahul S.", rating: 5, date: "12 May 2024", comment: "Beautiful plant! The packaging was excellent and it arrived in perfect condition." },
              { name: "Priya K.", rating: 4, date: "10 May 2024", comment: "Stunning leaves. Slightly smaller than expected but growing rapidly now." },
            ].map((rev, idx) => (
              <div key={idx} className="border-b border-ink-100 pb-3 last:border-b-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-xs text-ink-900">{rev.name}</span>
                  <span className="text-[10px] text-ink-300">{rev.date}</span>
                </div>
                <div className="flex gap-0.5 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      size={10}
                      className={i < rev.rating ? "text-amber-400 fill-amber-400" : "text-ink-100"}
                    />
                  ))}
                </div>
                <p className="text-xs text-ink-500">{rev.comment}</p>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-12">
      {/* LEFT — Images & Badges */}
      <div>
        {/* Main Image */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-cream-50 border border-ink-100 mb-4 shadow-sm">
          <Image
            src={selectedImage?.url || "/floria-logo.png"}
            alt={selectedImage?.alt_text || product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover transition-all duration-300"
          />
          {isOutOfStock && (
            <div className="absolute top-4 left-4">
              <Badge variant="error">Out of Stock</Badge>
            </div>
          )}

          {/* Wishlist floating heart */}
          <button
            type="button"
            aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            onClick={() => toggleWishlist(listing)}
            className={[
              "absolute bottom-4 right-4 w-12 h-12 flex items-center justify-center rounded-full transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-forest-700 z-10",
              wishlisted ? "bg-red-50 text-red-600 hover:bg-red-100/70" : "bg-white/95 text-ink-300 hover:text-red-600",
            ].join(" ")}
          >
            <WishlistIcon size={20} className={wishlisted ? "fill-red-600" : ""} />
          </button>
        </div>

        {/* Thumbnail Row */}
        {images.length > 0 && (
          <div className="flex gap-2.5 overflow-x-auto pb-1 mb-8">
            {images.map((img: any, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedImage(img)}
                className={[
                  "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border transition-all focus:outline-none",
                  selectedImage?.url === img.url
                    ? "border-forest-700 ring-2 ring-forest-700/20"
                    : "border-ink-100 hover:border-ink-300",
                ].join(" ")}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text || `${product.name} thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* SVG Trust Badges (PC/Desktop only - sits under image gallery) */}
        <div className="hidden md:grid grid-cols-2 gap-4 border-t border-ink-100 pt-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-forest-50 flex items-center justify-center text-forest-700">
              <TruckIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-900 leading-tight">Fast & Safe Delivery</p>
              <p className="text-[10px] text-ink-400 mt-0.5">Secure green packaging</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-forest-50 flex items-center justify-center text-forest-700">
              <ShieldIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-900 leading-tight">Secure Payments</p>
              <p className="text-[10px] text-ink-400 mt-0.5">100% encrypted checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-forest-50 flex items-center justify-center text-forest-700">
              <ReturnIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-900 leading-tight">7 Days Easy Returns</p>
              <p className="text-[10px] text-ink-400 mt-0.5">No questions asked</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-forest-50 flex items-center justify-center text-forest-700">
              <StarIcon size={18} className="fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-900 leading-tight">Quality Assured</p>
              <p className="text-[10px] text-ink-400 mt-0.5">Direct from nurseries</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Info & Add to Cart */}
      <div className="flex flex-col">
        {/* Category & Verified Seller */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-forest-700">
            {category?.name || "Indoor Plant"}
          </span>
          <div className="flex items-center gap-1 text-xs text-forest-600 bg-forest-50 px-2 py-0.5 rounded-full font-medium">
            <VerifiedIcon size={12} className="text-forest-700" />
            <span>Verified Nursery</span>
          </div>
        </div>

        {/* Product Name */}
        <h1 className="font-serif text-3xl font-bold text-ink-900 leading-tight mb-2">
          {product.name}
        </h1>

        {/* Seller Info */}
        <p className="text-xs text-ink-400 mb-3 leading-tight">
          Sold by <span className="font-semibold text-ink-900">{seller.business_name}</span> &bull; {seller.business_name ? "Raipur, Chhattisgarh" : ""}
        </p>

        {/* Rating stars */}
        <div className="flex items-center gap-1.5 mb-5">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                size={14}
                className={i < Math.floor(mockRating) ? "text-amber-400 fill-amber-400" : "text-ink-100"}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-ink-700">{mockRating}</span>
          <span className="text-xs text-ink-300">({mockReviewsCount} reviews)</span>
        </div>

        {/* Pricing */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-ink-100">
          <span className="font-serif text-3xl font-bold text-ink-900">
            {formatINR(inventory.price_paise)}
          </span>
          {originalPrice && (
            <span className="text-base text-ink-300 line-through">
              {formatINR(originalPrice)}
            </span>
          )}
          {discountPercent && (
            <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white rounded bg-forest-700">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Bullet points */}
        <ul className="space-y-2 mb-6" role="list">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2.5 text-sm text-ink-500 font-medium">
              <LeafIcon size={14} className="text-forest-700" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Stock status & Qty Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-300">Availability</span>
            <span className="text-sm font-semibold text-forest-700">
              {isOutOfStock ? "Out of Stock" : `In Stock (${inventory.stock_quantity} available)`}
            </span>
          </div>

          {!isOutOfStock && (
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-300 mb-1">Quantity</span>
              <div className="flex items-center border border-ink-200 rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="px-3 py-1 text-ink-500 hover:bg-cream-100 font-bold transition-colors"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-3 text-sm font-semibold text-ink-900 select-none">{quantity}</span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="px-3 py-1 text-ink-500 hover:bg-cream-100 font-bold transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CTA Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => addToCart(listing, quantity)}
            className={[
              "py-3.5 rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2",
              isOutOfStock
                ? "bg-ink-100 text-ink-400 cursor-not-allowed"
                : "bg-forest-700 text-white hover:bg-forest-800 focus:ring-forest-700 active:scale-[0.98]",
            ].join(" ")}
          >
            Add to Cart
          </button>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleBuyNow}
            className={[
              "py-3.5 rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2",
              isOutOfStock
                ? "bg-ink-100 text-ink-400 cursor-not-allowed"
                : "bg-canopy-900 text-white hover:bg-canopy-800 focus:ring-canopy-900 active:scale-[0.98]",
            ].join(" ")}
          >
            Buy Now
          </button>
        </div>

        {/* Tab System */}
        <div className="border-t border-ink-100 pt-6">
          {/* Tab buttons */}
          <div className="flex border-b border-ink-100 overflow-x-auto pb-px gap-6 text-xs font-bold uppercase tracking-wider text-ink-300">
            {[
              { id: "description", label: "Description" },
              { id: "care", label: "Care Guide" },
              { id: "specs", label: "Specifications" },
              { id: "nursery", label: "Nursery Info" },
              { id: "reviews", label: "Reviews" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "pb-3.5 relative whitespace-nowrap transition-colors focus:outline-none",
                    isActive ? "text-forest-700 font-bold" : "hover:text-ink-900",
                  ].join(" ")}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest-700" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content area */}
          <div className="py-5">
            {renderTabContent()}
          </div>
        </div>

        {/* SVG Trust Badges (Mobile only - sits under product tabs) */}
        <div className="grid md:hidden grid-cols-2 gap-4 border-t border-ink-100 pt-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-forest-50 flex items-center justify-center text-forest-700">
              <TruckIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-900 leading-tight">Fast & Safe Delivery</p>
              <p className="text-[10px] text-ink-400 mt-0.5">Secure green packaging</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-forest-50 flex items-center justify-center text-forest-700">
              <ShieldIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-900 leading-tight">Secure Payments</p>
              <p className="text-[10px] text-ink-400 mt-0.5">100% encrypted checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-forest-50 flex items-center justify-center text-forest-700">
              <ReturnIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-900 leading-tight">7 Days Easy Returns</p>
              <p className="text-[10px] text-ink-400 mt-0.5">No questions asked</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-forest-50 flex items-center justify-center text-forest-700">
              <StarIcon size={18} className="fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-900 leading-tight">Quality Assured</p>
              <p className="text-[10px] text-ink-400 mt-0.5">Direct from nurseries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
