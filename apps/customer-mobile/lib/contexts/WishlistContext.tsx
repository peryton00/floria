import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { StorageService } from "../storage";

const WISHLIST_STORAGE_KEY = "@floria:wishlist_v1";

export interface WishlistItem {
  productId: string;
  name: string;
  pricePaise: number;
  nurseryName: string;
  imageUrl?: string;
}

export interface WishlistContextType {
  wishlist: WishlistItem[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Hydrate wishlist from storage
  useEffect(() => {
    StorageService.getItem<WishlistItem[]>(WISHLIST_STORAGE_KEY, []).then(
      (saved) => {
        if (Array.isArray(saved) && saved.length > 0) {
          setWishlist(saved);
        }
        setIsHydrated(true);
      },
    );
  }, []);

  // 2. Persist wishlist changes
  useEffect(() => {
    if (isHydrated) {
      StorageService.setItem(WISHLIST_STORAGE_KEY, wishlist);
    }
  }, [wishlist, isHydrated]);

  const isInWishlist = useCallback(
    (productId: string) => wishlist.some((i) => i.productId === productId),
    [wishlist],
  );

  const toggleWishlist = useCallback((item: WishlistItem) => {
    setWishlist((prev) => {
      const exists = prev.some((i) => i.productId === item.productId);
      if (exists) {
        return prev.filter((i) => i.productId !== item.productId);
      }
      return [...prev, item];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
