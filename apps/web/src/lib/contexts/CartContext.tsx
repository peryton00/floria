"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ProductListing } from "@floria/types";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useToast } from "@/lib/contexts/ToastContext";

import { calculateCustomerProductPricePaise } from "@/lib/format";

export interface CartItem {
  listing: ProductListing;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  subtotal: number;
  addToCart: (listing: ProductListing, qty?: number) => Promise<void> | void;
  removeFromCart: (productId: string) => Promise<void> | void;
  updateQuantity: (productId: string, quantity: number) => Promise<void> | void;
  clearCart: () => Promise<void> | void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const debounceTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  // Helper to map DB API cart items to CartItem format with Customer Selling Price
  const mapDbCartItems = useCallback((items: any[]): CartItem[] => {
    return items.map((ci: any) => {
      const p = ci.product || {};
      const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory || { price_paise: 0, stock_quantity: 0 };
      const imgs = p.images || [];
      const primary = imgs.find((i: any) => i.is_primary) || imgs[0] || null;
      const seller = Array.isArray(p.seller) ? p.seller[0] : p.seller || { id: p.seller_id, business_name: "Nursery" };
      const cat = Array.isArray(p.category) ? p.category[0] : p.category || null;

      const rawBasePrice = ci.unit_price_paise_snapshot ?? inv.price_paise ?? 0;
      const customerPrice = calculateCustomerProductPricePaise(rawBasePrice);
      const originalPricePaise = inv.original_price_paise && inv.original_price_paise > customerPrice ? inv.original_price_paise : null;
      const discountAmountPaise = originalPricePaise ? originalPricePaise - customerPrice : 0;
      const discountPercentage = originalPricePaise ? Math.round((discountAmountPaise / originalPricePaise) * 100) : 0;

      return {
        listing: {
          product: p,
          inventory: {
            ...inv,
            price_paise: customerPrice,
          },
          primary_image: primary,
          seller,
          category: cat,
          pricing: {
            sellingPricePaise: customerPrice,
            originalPricePaise,
            discountAmountPaise,
            discountPercentage,
            isDiscounted: discountAmountPaise > 0,
            isFreeDelivery: customerPrice >= 59900,
          },
        },
        quantity: ci.quantity,
      };
    });
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setIsAuthenticated(true);

        // Merge any guest cart items sitting in localStorage first
        try {
          const stored = localStorage.getItem("floria_cart");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const mergePayload = parsed
                .map((item: any) => ({
                  productId: item?.listing?.product?.id || item?.productId || item?.id,
                  quantity: item?.quantity || 1,
                }))
                .filter((item: any) => item.productId && typeof item.productId === "string");

              if (mergePayload.length > 0) {
                const mergeRes = await api.mergeCart(mergePayload);
                if (mergeRes && mergeRes.success) {
                  localStorage.removeItem("floria_cart");
                }
              } else {
                localStorage.removeItem("floria_cart");
              }
            }
          }
        } catch (e) {
          console.error("Failed to merge guest cart during refresh:", e);
        }

        const res = await api.getCart();
        if (res.success && res.data) {
          const rawItems = res.data.cart_items || res.data.items || [];
          const mapped = mapDbCartItems(rawItems);
          setCartItems(mapped);
          // Keep user resilient cache in sync
          try { localStorage.setItem("floria_cart_cache", JSON.stringify(mapped)); } catch { /* ignore */ }
          return;
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }

    // Fallback: restore from localStorage (guest cart or user cache)
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const key = session?.user ? "floria_cart_cache" : "floria_cart";
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const validItems = parsed.filter(
            (item: any) => item && typeof item === "object" && item.listing && item.listing.inventory
          );
          setCartItems(validItems);
        }
      }
    } catch {
      // Ignore
    }
  }, [mapDbCartItems]);

  // Initial hydration & auth listener for guest cart merge
  useEffect(() => {
    refreshCart().then(() => setIsHydrated(true));

    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        setIsAuthenticated(true);
        await refreshCart();
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setCartItems([]);
        try {
          localStorage.removeItem("floria_cart");
          localStorage.removeItem("floria_cart_cache");
        } catch {
          // Ignore
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      // Clean up all pending update timeouts on unmount
      Object.values(debounceTimeoutRefs.current).forEach(clearTimeout);
    };
  }, [refreshCart]);

  // Persist cart to localStorage (guests -> floria_cart, authenticated -> floria_cart_cache)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (isAuthenticated) {
        localStorage.setItem("floria_cart_cache", JSON.stringify(cartItems));
      } else {
        localStorage.setItem("floria_cart", JSON.stringify(cartItems));
      }
    } catch (e) {
      console.error("Error saving cart to localStorage:", e);
    }
  }, [cartItems, isHydrated, isAuthenticated]);

  const addToCart = async (listing: ProductListing, qty = 1) => {
    toast.success("Added to cart", `${listing.product.name} was added to your cart.`);

    if (isAuthenticated) {
      const res = await api.addToCart(listing.product.id, qty);
      if (res.success && res.data) {
        const rawItems = res.data.cart_items || res.data.items || [];
        const mapped = mapDbCartItems(rawItems);
        setCartItems(mapped);
        try { localStorage.setItem("floria_cart_cache", JSON.stringify(mapped)); } catch { /* ignore */ }
        return;
      }
    }

    // Guest mode or API unavailable — update local state (useEffect will persist to localStorage)
    setCartItems((prev) => {
      const existing = prev.find((item) => item.listing.product.id === listing.product.id);
      if (existing) {
        return prev.map((item) =>
          item.listing.product.id === listing.product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { listing, quantity: qty }];
    });
  };

  const removeFromCart = async (productId: string) => {
    toast.info("Removed from cart", "Item was removed from your cart.");

    // Cancel any pending debounced updates for this product
    if (debounceTimeoutRefs.current[productId]) {
      clearTimeout(debounceTimeoutRefs.current[productId]);
      delete debounceTimeoutRefs.current[productId];
    }

    if (isAuthenticated) {
      const res = await api.removeFromCart(productId);
      if (res.success && res.data) {
        const rawItems = res.data.cart_items || res.data.items || [];
        setCartItems(mapDbCartItems(rawItems));
        return;
      }
    }

    setCartItems((prev) => prev.filter((item) => item.listing.product.id !== productId));
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    // 1. Optimistic UI update — immediate feedback for user
    setCartItems((prev) =>
      prev.map((item) => (item.listing.product.id === productId ? { ...item, quantity } : item))
    );

    // 2. Sync to backend with 500ms debounce to prevent database spamming
    if (isAuthenticated) {
      if (debounceTimeoutRefs.current[productId]) {
        clearTimeout(debounceTimeoutRefs.current[productId]);
      }

      debounceTimeoutRefs.current[productId] = setTimeout(async () => {
        try {
          const res = await api.updateCartQuantity(productId, quantity);
          if (res.success && res.data) {
            const rawItems = res.data.cart_items || res.data.items || [];
            const mapped = mapDbCartItems(rawItems);
            setCartItems(mapped);
            try {
              localStorage.setItem("floria_cart_cache", JSON.stringify(mapped));
            } catch {
              // Ignore
            }
          }
        } catch (e) {
          console.error("Failed to sync cart quantity with server:", e);
        } finally {
          delete debounceTimeoutRefs.current[productId];
        }
      }, 500);
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      await api.clearCart();
    }
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.listing?.inventory?.price_paise ?? 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        subtotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
