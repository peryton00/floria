// Floria Customer Mobile — Notification Type Definitions & Enums
import type { NotificationItem as ApiNotificationItem } from "@floria/api-client";

export const NOTIFICATION_CATEGORIES = {
  ORDER: "ORDER",
  DELIVERY: "DELIVERY",
  PAYMENT: "PAYMENT",
  WISHLIST: "WISHLIST",
  PRODUCT: "PRODUCT",
  ACCOUNT: "ACCOUNT",
  PROMOTION: "PROMOTION",
  SYSTEM: "SYSTEM",
} as const;

export type NotificationCategory =
  (typeof NOTIFICATION_CATEGORIES)[keyof typeof NOTIFICATION_CATEGORIES];

export interface NotificationNavigationTarget {
  entityType: "ORDER" | "PRODUCT" | "SELLER" | "REVIEW" | "PAYMENT" | "ACCOUNT" | "EXPLORE" | "SYSTEM";
  entityId?: string;
  action?: "VIEW" | "TRACK" | "REVIEW" | "CHECKOUT";
  route?: string;
}

export interface FloriaNotificationItem extends Omit<ApiNotificationItem, "role"> {
  role?: "customer" | "seller" | "operations" | "admin";
  category: NotificationCategory;
  priority?: "HIGH" | "NORMAL" | "LOW";
  navigation?: NotificationNavigationTarget;
  isRead: boolean;
  timeAgo: string;
}

export interface NotificationPreferences {
  ordersAndDelivery: boolean;
  wishlistAndRestock: boolean;
  productDiscovery: boolean;
  promotionsAndOffers: boolean;
  accountAndSecurity: boolean; // Essential, defaults to true
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  ordersAndDelivery: true,
  wishlistAndRestock: true,
  productDiscovery: true,
  promotionsAndOffers: false, // Promotional off by default (transactional-first principle)
  accountAndSecurity: true,
};

export interface AndroidChannelDefinition {
  id: string;
  name: string;
  description: string;
  importance: number; // 0: None, 1: Min, 2: Low, 3: Default, 4: High, 5: Max
  sound: string; // e.g. "floria_chime.wav"
  vibrationPattern?: number[];
  lightColor?: string;
}

export const ANDROID_NOTIFICATION_CHANNELS: Record<string, AndroidChannelDefinition> = {
  ORDERS: {
    id: "floria-orders",
    name: "Orders & Delivery",
    description: "Real-time updates on your plant orders, dispatch, and courier delivery.",
    importance: 4, // High importance
    sound: "floria_chime.wav",
    vibrationPattern: [0, 150, 80, 150],
    lightColor: "#1C3524",
  },
  WISHLIST: {
    id: "floria-wishlist",
    name: "Wishlist & Back in Stock",
    description: "Notifications when your favorite botanical specimens return to stock.",
    importance: 3, // Default importance
    sound: "floria_chime.wav",
    vibrationPattern: [0, 100, 50, 100],
    lightColor: "#C86D51",
  },
  PRODUCTS: {
    id: "floria-products",
    name: "Botanical Discovery",
    description: "Curated new arrivals and seasonal plant care tips.",
    importance: 3, // Default importance
    sound: "floria_chime.wav",
    vibrationPattern: [0, 100],
    lightColor: "#1C3524",
  },
  ACCOUNT: {
    id: "floria-account",
    name: "Account & Security",
    description: "Critical security notices, login alerts, and address updates.",
    importance: 4, // High importance
    sound: "floria_chime.wav",
    vibrationPattern: [0, 200, 100, 200],
    lightColor: "#12241B",
  },
  PROMOTIONS: {
    id: "floria-promotions",
    name: "Promotions & Seasonal",
    description: "Special nursery offers and seasonal garden collections.",
    importance: 2, // Low importance (quiet)
    sound: "floria_chime.wav",
    vibrationPattern: [0, 80],
    lightColor: "#C86D51",
  },
};
