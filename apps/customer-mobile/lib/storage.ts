// Floria Customer Mobile — Universal Resilient Storage Service
// Zero-crash fallback architecture compatible with Expo/React Native and Metro bundler

export const STORAGE_KEYS = {
  CART: "@floria:cart_items",
  RECENTLY_VIEWED: "@floria:recently_viewed_v1",
  RECENT_SEARCHES: "@floria:recent_searches_v1",
  DELIVERY_LOCATION: "@floria:delivery_location",
} as const;

export interface RecentlyViewedItem {
  id: string;
  name: string;
  pricePaise: number;
  imageUrl?: string;
  careLevel?: string;
  rating?: number;
  reviewCount?: number;
  isFreeDelivery?: boolean;
  isOutOfStock?: boolean;
  viewedAt: number;
}

// In-memory memory map ensuring instant session speed and zero module resolution crashes
const memoryStore = new Map<string, string>();

export const StorageService = {
  async getItem<T>(key: string, fallback: T): Promise<T> {
    try {
      if (memoryStore.has(key)) {
        const raw = memoryStore.get(key);
        return raw ? JSON.parse(raw) : fallback;
      }
      if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
        const raw = (globalThis as any).localStorage.getItem(key);
        if (raw) {
          memoryStore.set(key, raw);
          return JSON.parse(raw);
        }
      }
      return fallback;
    } catch {
      return fallback;
    }
  },

  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      memoryStore.set(key, serialized);
      if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
        (globalThis as any).localStorage.setItem(key, serialized);
      }
      return true;
    } catch {
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      memoryStore.delete(key);
      if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
        (globalThis as any).localStorage.removeItem(key);
      }
      return true;
    } catch {
      return false;
    }
  },

  // Specialized Recently Viewed helpers (capped at 10 items, deduplicated)
  async getRecentlyViewed(): Promise<RecentlyViewedItem[]> {
    return this.getItem<RecentlyViewedItem[]>(STORAGE_KEYS.RECENTLY_VIEWED, []);
  },

  async addRecentlyViewed(item: Omit<RecentlyViewedItem, "viewedAt">): Promise<RecentlyViewedItem[]> {
    try {
      const existing = await this.getRecentlyViewed();
      const filtered = existing.filter((i) => i.id !== item.id);
      const updated: RecentlyViewedItem[] = [
        { ...item, viewedAt: Date.now() },
        ...filtered,
      ].slice(0, 10);
      await this.setItem(STORAGE_KEYS.RECENTLY_VIEWED, updated);
      return updated;
    } catch {
      return [];
    }
  },

  // Specialized Recent Searches helpers (capped at 6 items)
  async getRecentSearches(): Promise<string[]> {
    return this.getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES, []);
  },

  async addRecentSearch(query: string): Promise<string[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return this.getRecentSearches();
    try {
      const existing = await this.getRecentSearches();
      const filtered = existing.filter(
        (q) => q.toLowerCase() !== trimmed.toLowerCase(),
      );
      const updated = [trimmed, ...filtered].slice(0, 6);
      await this.setItem(STORAGE_KEYS.RECENT_SEARCHES, updated);
      return updated;
    } catch {
      return [];
    }
  },

  async clearRecentSearches(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  },
};
