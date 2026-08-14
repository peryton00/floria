"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ProductListing } from "@floria/types";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper to map DB API cart items to CartItem format
  const mapDbCartItems = useCallback((items: any[]): CartItem[] => {
    return items.map((ci: any) => {
      const p = ci.product || {};
      const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory || { price_paise: 0, stock_quantity: 0 };
      const imgs = p.images || [];
      const primary = imgs.find((i: any) => i.is_primary) || imgs[0] || null;
      const seller = Array.isArray(p.seller) ? p.seller[0] : p.seller || { id: p.seller_id, business_name: "Nursery" };
      const cat = Array.isArray(p.category) ? p.category[0] : p.category || null;

      return {
        listing: {
          product: p,
          inventory: inv,
          primary_image: primary,
          seller,
          category: cat,
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
        const res = await api.getCart();
        if (res.success && res.data?.cart_items) {
          const mapped = mapDbCartItems(res.data.cart_items);
          setCartItems(mapped);
          return;
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }

    // Guest localStorage fallback
    try {
      const stored = localStorage.getItem("floria_cart");
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
      if (event === "SIGNED_IN" && session?.user) {
        // Merge guest localStorage cart into DB cart
        try {
          const stored = localStorage.getItem("floria_cart");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const mergePayload = parsed.map((item: any) => ({
                productId: item.listing.product.id,
                quantity: item.quantity,
              }));
              await api.mergeCart(mergePayload);
              localStorage.removeItem("floria_cart");
            }
          }
        } catch {
          // Ignore
        }
        await refreshCart();
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setCartItems([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshCart]);

  // Save guest cart to localStorage when unauthenticated
  useEffect(() => {
    if (!isHydrated || isAuthenticated) return;
    try {
      localStorage.setItem("floria_cart", JSON.stringify(cartItems));
    } catch (e) {
      console.error("Error saving guest cart to localStorage:", e);
    }
  }, [cartItems, isHydrated, isAuthenticated]);

  const addToCart = async (listing: ProductListing, qty = 1) => {
    if (isAuthenticated) {
      const res = await api.addToCart(listing.product.id, qty);
      if (res.success && res.data?.cart_items) {
        setCartItems(mapDbCartItems(res.data.cart_items));
        return;
      }
    }

    // Guest mode
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
    if (isAuthenticated) {
      const res = await api.removeFromCart(productId);
      if (res.success && res.data?.cart_items) {
        setCartItems(mapDbCartItems(res.data.cart_items));
        return;
      }
    }

    setCartItems((prev) => prev.filter((item) => item.listing.product.id !== productId));
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    if (isAuthenticated) {
      const res = await api.updateCartQuantity(productId, quantity);
      if (res.success && res.data?.cart_items) {
        setCartItems(mapDbCartItems(res.data.cart_items));
        return;
      }
    }

    setCartItems((prev) =>
      prev.map((item) => (item.listing.product.id === productId ? { ...item, quantity } : item))
    );
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
