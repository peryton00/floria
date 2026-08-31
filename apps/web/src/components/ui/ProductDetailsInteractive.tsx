"use client";

import { useState, useEffect, useRef } from "react";
import { ReviewList } from "@/components/ui/ReviewList";
import { ReviewForm } from "@/components/ui/ReviewForm";
import { StarRating } from "@/components/ui/StarRating";
import Image from "next/image";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { ProductPriceBlock } from "@/components/ui/ProductPriceBlock";
import { DeliveryBenefit } from "@/components/ui/DeliveryBenefit";
import { ValueSummary } from "@/components/ui/ValueSummary";
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

export function ProductDetailsInteractive({
  listing,
}: ProductDetailsInteractiveProps) {
  const { product, inventory, seller, category, images } = listing;
  const invObj = Array.isArray(inventory) ? inventory[0] : (inventory || {});
  const availableStock =
    typeof invObj?.stock_quantity === "number"
      ? invObj.stock_quantity
      : (typeof (product as any)?.stock_quantity === "number"
        ? (product as any).stock_quantity
        : 99);
  const isOutOfStock = availableStock <= 0;

  // States
  const [selectedImage, setSelectedImage] = useState(images[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  // Smooth Auto-Change Slideshow States & Controls
  const [isHovered, setIsHovered] = useState(false);
  const pausedUntilRef = useRef<number>(0);

  // Sync selectedImage if images array updates dynamically
  useEffect(() => {
    if (
      images &&
      images.length > 0 &&
      (!selectedImage ||
        !images.some((img: any) => img.url === selectedImage.url))
    ) {
      setSelectedImage(images[0]);
    }
  }, [images, selectedImage]);

  // Auto-switch image slideshow timer (runs when >1 image uploaded)
  useEffect(() => {
    if (!images || images.length <= 1) return;

    const AUTO_PLAY_INTERVAL = 3500; // Switch image every 3.5 seconds

    const timer = setInterval(() => {
      // Pause slideshow if user is hovering or clicked an image within the last 30s
      if (isHovered) return;
      if (Date.now() < pausedUntilRef.current) return;

      setSelectedImage((prev: any) => {
        const currentIndex = images.findIndex(
          (img: any) => img.url === (prev?.url || images[0]?.url),
        );
        const nextIndex = (currentIndex + 1) % images.length;
        return images[nextIndex];
      });
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [images, isHovered]);

  const handleSelectImage = (img: any) => {
    setSelectedImage(img);
    // User explicitly selected an image: pause auto-switch animation for at least 30 seconds
    pausedUntilRef.current = Date.now() + 30000;
  };

  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart, cartItems } = useCart();
  const wishlisted = isWishlisted(product.id);

  const handleBuyNow = async () => {
    if (isOutOfStock) return;

    // Client-side condition check: verify if product is already in cart
    const existsInCart = cartItems.some(
      (item) => item.listing?.product?.id === product.id,
    );

    if (!existsInCart) {
      await addToCart(listing, quantity);
    }

    window.location.href = "/cart";
  };

  // Real rating from rating_summary (joined by backend)
  const ratingSummary = listing.rating_summary;
  const displayRating = ratingSummary?.avg_rating ?? 0;
  const reviewCount = ratingSummary?.review_count ?? 0;
  const [reviewPage, setReviewPage] = useState(1);

  const features = [
    "Large, glossy leaves",
    "Air purifying plant",
    "Easy to care",
  ];

  const handleIncrement = () => {
    if (quantity < availableStock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
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
            <p>
              {seller.business_name} is a verified nursery specializing in
              premium indoor foliage and exotic plants located in Raipur,
              Chhattisgarh.
            </p>
            <p className="text-xs text-forest-700 font-semibold">
              100% Organic Soils & Sustainable Farming practices.
            </p>
          </div>
        );
      case "reviews":
        return (
          <div className="space-y-4">
            <ReviewList
              reviews={ratingSummary?.reviews ?? []}
              total={reviewCount}
              summary={ratingSummary}
              productId={product.id}
              page={reviewPage}
              onPageChange={setReviewPage}
            />
            <ReviewForm productId={product.id} />
          </div>
        );
      default:
        return null;
    }
  };

  const pricing = listing.pricing;
  const isFreeDelivery = Boolean(pricing?.isFreeDelivery);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 items-start">
      {/* LEFT — Images & Badges */}
      <div>
        {/* Main Image Container with Touch & Hover Interruption Listeners */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
          className="relative aspect-square w-full rounded-3xl overflow-hidden bg-floria-natural-sand border border-floria-border mb-4 shadow-xs group"
        >
          {images && images.length > 0 ? (
            images.map((img: any, idx: number) => {
              const isSelected =
                selectedImage?.url === img.url || (idx === 0 && !selectedImage);
              return (
                <Image
                  key={img.url || idx}
                  src={img.url}
                  alt={img.alt_text || `${product.name} image ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={idx === 0}
                  className={[
                    "object-cover transition-all duration-700 ease-in-out group-hover:scale-105",
                    isSelected
                      ? "opacity-100 z-10 scale-100"
                      : "opacity-0 z-0 pointer-events-none scale-102",
                  ].join(" ")}
                />
              );
            })
          ) : (
            <Image
              src="/brand_logo.svg"
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="object-scale-down p-12 transition-all duration-500 ease-in-out opacity-60"
            />
          )}

          {isOutOfStock && (
            <div className="absolute top-4 left-4 z-20">
              <Badge variant="error">Out of Stock</Badge>
            </div>
          )}

          {/* Wishlist floating frosted heart */}
          <button
            type="button"
            aria-label={
              wishlisted
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            onClick={() => toggleWishlist(listing)}
            className={[
              "absolute bottom-4 right-4 w-12 h-12 flex items-center justify-center rounded-full transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-forest-800 z-20",
              wishlisted
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/80 scale-105"
                : "bg-white/90 hover:bg-white backdrop-blur-md text-ink-400 hover:text-red-600 border border-white/80 active:scale-95",
            ].join(" ")}
          >
            <WishlistIcon
              size={20}
              className={wishlisted ? "fill-red-600" : ""}
            />
          </button>
        </div>

        {/* Thumbnail Row */}
        {images.length > 0 && (
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex gap-2.5 overflow-x-auto pb-1 mb-8"
          >
            {images.map((img: any, i: number) => (
              <button
                key={i}
                onClick={() => handleSelectImage(img)}
                className={[
                  "relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all focus:outline-none bg-floria-natural-sand",
                  selectedImage?.url === img.url
                    ? "border-forest-800 ring-2 ring-forest-800/20 shadow-xs scale-105"
                    : "border-floria-border hover:border-forest-400 opacity-75 hover:opacity-100",
                ].join(" ")}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text || `${product.name} thumbnail ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* SVG Trust Badges (PC/Desktop only - sits under image gallery) */}
        <div className="hidden md:grid grid-cols-2 gap-3.5 border-t border-floria-border pt-6">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-floria-soft-sand/80 border border-floria-border">
            <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800 flex-shrink-0 shadow-2xs">
              <TruckIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-ink-900 leading-tight">
                Fast &amp; Safe Delivery
              </p>
              <p className="text-[10px] text-ink-500 mt-0.5">
                Secure green packaging
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-floria-soft-sand/80 border border-floria-border">
            <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800 flex-shrink-0 shadow-2xs">
              <ShieldIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-ink-900 leading-tight">
                Secure Payments
              </p>
              <p className="text-[10px] text-ink-500 mt-0.5">
                100% encrypted checkout
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-floria-soft-sand/80 border border-floria-border">
            <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800 flex-shrink-0 shadow-2xs">
              <ReturnIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-ink-900 leading-tight">
                7 Days Easy Returns
              </p>
              <p className="text-[10px] text-ink-500 mt-0.5">
                No questions asked
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-floria-soft-sand/80 border border-floria-border">
            <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800 flex-shrink-0 shadow-2xs">
              <StarIcon size={18} className="fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink-900 leading-tight">
                Quality Assured
              </p>
              <p className="text-[10px] text-ink-500 mt-0.5">
                Direct from nurseries
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Info & Add to Cart */}
      <div className="flex flex-col">
        {/* Category & Verified Seller Row */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-forest-800 bg-forest-100/90 border border-forest-200/80 px-2.5 py-1 rounded-full font-ui">
            {category?.name || "Indoor Plant"}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-forest-800 bg-forest-100/80 border border-forest-200/80 px-2.5 py-1 rounded-full font-semibold">
            <VerifiedIcon size={13} className="text-forest-800" />
            <span>Verified Nursery</span>
          </div>
        </div>

        {/* Product Name */}
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 leading-tight mb-2 tracking-tight">
          {product.name}
        </h1>

        {/* Seller Info */}
        <p className="text-xs text-ink-500 mb-3.5 leading-tight flex items-center gap-1.5">
          <span>
            Sold by{" "}
            <strong className="text-ink-900 font-semibold">
              {seller.business_name}
            </strong>
          </span>
          <span className="text-ink-300">•</span>
          <span>Raipur, Chhattisgarh</span>
        </p>

        {/* Rating stars */}
        <div className="flex items-center gap-2 mb-4">
          <StarRating rating={displayRating} size="sm" />
          {displayRating > 0 && (
            <span className="text-xs font-bold text-ink-900">
              {displayRating.toFixed(1)}
            </span>
          )}
          <span className="text-xs text-ink-500">
            {reviewCount > 0
              ? `(${reviewCount} review${reviewCount !== 1 ? "s" : ""})`
              : "No reviews yet"}
          </span>
        </div>

        {/* Pricing Block & Delivery Benefit */}
        <div className="mb-5 pb-5 border-b border-floria-border space-y-2.5">
          <ProductPriceBlock
            sellingPricePaise={
              pricing?.sellingPricePaise ?? inventory.price_paise
            }
            originalPricePaise={pricing?.originalPricePaise}
            discountPercentage={pricing?.discountPercentage}
            discountAmountPaise={pricing?.discountAmountPaise}
            isFreeDelivery={isFreeDelivery}
            size="lg"
            showSavings={true}
          />
          <DeliveryBenefit
            isFreeDelivery={isFreeDelivery}
            deliverySavingsPaise={pricing?.deliverySavingsPaise}
          />
        </div>

        {/* Value Summary Box */}
        <ValueSummary
          isFreeDelivery={isFreeDelivery}
          isVerifiedSeller={seller.is_verified ?? true}
          sellerName={seller.business_name}
          rating={displayRating}
          reviewCount={reviewCount}
          className="mb-6"
        />

        {/* Botanical Highlights / Feature Chips */}
        <div className="flex flex-wrap gap-2 mb-6" role="list">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-forest-50 border border-forest-100/90 text-xs font-semibold text-forest-800"
            >
              <LeafIcon size={13} className="text-forest-700" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Stock status & Qty Selector */}
        <div className="flex items-center justify-between mb-6 p-3.5 rounded-2xl bg-floria-soft-sand/80 border border-floria-border">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
              Availability
            </span>
            <span
              className={`text-xs font-bold ${isOutOfStock ? "text-error-600" : "text-forest-800"}`}
            >
              {isOutOfStock
                ? "Out of Stock"
                : `In Stock (${availableStock} available)`}
            </span>
          </div>

          {!isOutOfStock && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                Quantity
              </span>
              <div className="flex items-center border border-floria-border rounded-xl overflow-hidden bg-floria-sand/60 shadow-2xs">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-8 h-8 flex items-center justify-center text-ink-700 hover:bg-floria-soft-sand font-bold transition-colors active:scale-95"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold text-ink-900 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-8 h-8 flex items-center justify-center text-ink-700 hover:bg-floria-soft-sand font-bold transition-colors active:scale-95"
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
            style={!isOutOfStock ? { color: "#ffffff" } : undefined}
            className={[
              "py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-2",
              isOutOfStock
                ? "bg-cream-300 text-ink-400 cursor-not-allowed"
                : "bg-terracotta-700 !text-white hover:bg-terracotta-800 hover:shadow-md hover:scale-[1.01] focus:ring-terracotta-700 active:scale-[0.98]",
            ].join(" ")}
          >
            Add to Cart
          </button>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleBuyNow}
            style={!isOutOfStock ? { color: "#ffffff" } : undefined}
            className={[
              "py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-2",
              isOutOfStock
                ? "bg-cream-300 text-ink-400 cursor-not-allowed"
                : "bg-forest-800 !text-white hover:bg-forest-900 hover:shadow-md hover:scale-[1.01] focus:ring-forest-800 active:scale-[0.98]",
            ].join(" ")}
          >
            Buy Now
          </button>
        </div>

        {/* Tab System */}
        <div className="border-t border-floria-border pt-6">
          {/* Tab buttons */}
          <div className="flex border-b border-floria-border overflow-x-auto pb-px gap-6 text-xs font-bold uppercase tracking-wider text-ink-500">
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
                    isActive
                      ? "text-forest-800 font-bold"
                      : "hover:text-ink-900",
                  ].join(" ")}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest-800" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content area */}
          <div className="py-5">{renderTabContent()}</div>
        </div>

        {/* SVG Trust Badges (Mobile only - sits under product tabs) */}
        <div className="grid md:hidden grid-cols-2 gap-3.5 border-t border-floria-border pt-6">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-floria-soft-sand/80 border border-floria-border">
            <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800 flex-shrink-0 shadow-2xs">
              <TruckIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-ink-900 leading-tight">
                Fast &amp; Safe Delivery
              </p>
              <p className="text-[10px] text-ink-500 mt-0.5">
                Secure green packaging
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-floria-soft-sand/80 border border-floria-border">
            <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800 flex-shrink-0 shadow-2xs">
              <ShieldIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-ink-900 leading-tight">
                Secure Payments
              </p>
              <p className="text-[10px] text-ink-500 mt-0.5">
                100% encrypted checkout
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-floria-soft-sand/80 border border-floria-border">
            <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800 flex-shrink-0 shadow-2xs">
              <ReturnIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-ink-900 leading-tight">
                7 Days Easy Returns
              </p>
              <p className="text-[10px] text-ink-500 mt-0.5">
                No questions asked
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-floria-soft-sand/80 border border-floria-border">
            <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800 flex-shrink-0 shadow-2xs">
              <StarIcon size={18} className="fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink-900 leading-tight">
                Quality Assured
              </p>
              <p className="text-[10px] text-ink-500 mt-0.5">
                Direct from nurseries
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
