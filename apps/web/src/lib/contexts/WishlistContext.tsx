"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ProductListing } from "@floria/types";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface WishlistContextType {
  wishlistItems: ProductListing[];
  isWishlisted: (productId: string) => boolean;
  addToWishlist: (listing: ProductListing) => Promise<void> | void;
  removeFromWishlist: (productId: string) => Promise<void> | void;
  toggleWishlist: (listing: ProductListing) => Promise<void> | void;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<ProductListing[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const mapDbWishlistItems = useCallback((items: any[]): ProductListing[] => {
    return items.map((wi: any) => {
      const p = wi.product || {};
      const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory || { price_paise: 0, stock_quantity: 0 };
      const imgs = p.images || [];
      const primary = imgs.find((i: any) => i.is_primary) || imgs[0] || null;
      const seller = Array.isArray(p.seller) ? p.seller[0] : p.seller || { id: p.seller_id, business_name: "Nursery" };
      const cat = Array.isArray(p.category) ? p.category[0] : p.category || null;

      return {
        product: p,
        inventory: inv,
        primary_image: primary,
        seller,
        category: cat,
      };
    });
  }, []);

  const refreshWishlist = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setIsAuthenticated(true);
        const res = await api.getWishlist();
        if (res.success && res.data?.wishlist_items) {
          const mapped = mapDbWishlistItems(res.data.wishlist_items);
          setWishlistItems(mapped);
          return;
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }

    try {
      const stored = localStorage.getItem("floria_wishlist");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const validItems = parsed.filter(
            (item: any) => item && typeof item === "object" && item.product && item.inventory
          );
          setWishlistItems(validItems);
        }
      }
    } catch {
      // Ignore
    }
  }, [mapDbWishlistItems]);

  useEffect(() => {
    refreshWishlist().then(() => setIsHydrated(true));

    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const stored = localStorage.getItem("floria_wishlist");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const productIds = parsed.map((item: any) => item.product.id);
              await api.mergeWishlist(productIds);
              localStorage.removeItem("floria_wishlist");
            }
          }
        } catch {
          // Ignore
        }
        await refreshWishlist();
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setWishlistItems([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshWishlist]);

  useEffect(() => {
    if (!isHydrated || isAuthenticated) return;
    try {
      localStorage.setItem("floria_wishlist", JSON.stringify(wishlistItems));
    } catch (e) {
      console.error("Error saving guest wishlist to localStorage:", e);
    }
  }, [wishlistItems, isHydrated, isAuthenticated]);

  const isWishlisted = (productId: string) => {
    return wishlistItems.some((item) => item.product.id === productId);
  };

  const addToWishlist = async (listing: ProductListing) => {
    if (isAuthenticated) {
      const res = await api.addToWishlist(listing.product.id);
      if (res.success && res.data?.wishlist_items) {
        setWishlistItems(mapDbWishlistItems(res.data.wishlist_items));
        return;
      }
    }

    setWishlistItems((prev) => {
      if (prev.some((item) => item.product.id === listing.product.id)) {
        return prev;
      }
      return [...prev, listing];
    });
  };

  const removeFromWishlist = async (productId: string) => {
    if (isAuthenticated) {
      const res = await api.removeFromWishlist(productId);
      if (res.success && res.data?.wishlist_items) {
        setWishlistItems(mapDbWishlistItems(res.data.wishlist_items));
        return;
      }
    }

    setWishlistItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const toggleWishlist = async (listing: ProductListing) => {
    if (isWishlisted(listing.product.id)) {
      await removeFromWishlist(listing.product.id);
    } else {
      await addToWishlist(listing);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isWishlisted,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
