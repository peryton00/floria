// Floria Seller Mobile — Notification Types & Android Channels
export const SELLER_NOTIFICATION_CATEGORIES = {
  ORDER: "ORDER",
  INVENTORY: "INVENTORY",
  SETTLEMENT: "SETTLEMENT",
  PRODUCT: "PRODUCT",
  ACCOUNT: "ACCOUNT",
  SYSTEM: "SYSTEM",
} as const;

export type SellerNotificationCategory =
  (typeof SELLER_NOTIFICATION_CATEGORIES)[keyof typeof SELLER_NOTIFICATION_CATEGORIES];

export interface SellerNotificationItem {
  id: string;
  category: SellerNotificationCategory;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority?: "HIGH" | "NORMAL" | "LOW";
  createdAt: string;
  data?: Record<string, any>;
  navigation?: {
    entityType: "ORDER" | "PRODUCT" | "INVENTORY" | "SETTLEMENT" | "ACCOUNT" | "ONBOARDING" | "SYSTEM";
    entityId?: string;
    action?: string;
  };
}

export interface AndroidChannelDefinition {
  id: string;
  name: string;
  description: string;
  importance: number;
  sound: string;
  vibrationPattern?: number[];
  lightColor?: string;
}

export const ANDROID_SELLER_CHANNELS: Record<string, AndroidChannelDefinition> = {
  ORDERS: {
    id: "floria_seller_orders",
    name: "Customer Orders & Fulfillment",
    description: "Urgent notifications when customers place orders or pickup is ready",
    importance: 4, // High
    sound: "floria_chime.wav",
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#1E3A2B",
  },
  INVENTORY: {
    id: "floria_seller_inventory",
    name: "Stock & Low-Stock Alerts",
    description: "Alerts when plant inventory drops below threshold or sells out",
    importance: 3, // Default
    sound: "floria_chime.wav",
    vibrationPattern: [0, 200],
    lightColor: "#943828",
  },
  SETTLEMENTS: {
    id: "floria_seller_settlements",
    name: "Payouts & Settlements",
    description: "Updates on Cashfree payouts, bank transfers, and earnings",
    importance: 3,
    sound: "floria_chime.wav",
    lightColor: "#15803D",
  },
  ACCOUNT: {
    id: "floria_seller_account",
    name: "Verification & Nursery Profile",
    description: "Updates on partner verification, onboarding approval, and policy",
    importance: 3,
    sound: "floria_chime.wav",
    lightColor: "#1E3A2B",
  },
};
