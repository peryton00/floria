import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "expo-router";
import { api } from "../api";
import { useSellerAuth } from "./SellerAuthContext";
import {
  SellerNotificationItem,
  SELLER_NOTIFICATION_CATEGORIES,
} from "../notifications/types";
import { initializeSellerAndroidChannels } from "../notifications/channels";

export interface SellerNotificationContextType {
  notifications: SellerNotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  handleNotificationNavigation: (notification: SellerNotificationItem) => void;
}

const SellerNotificationContext = createContext<
  SellerNotificationContextType | undefined
>(undefined);

export function SellerNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, seller } = useSellerAuth();
  const [notifications, setNotifications] = useState<SellerNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize Android Notification Channels
  useEffect(() => {
    initializeSellerAndroidChannels();
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.getNotifications({ limit: 40 });
      if (res.success && Array.isArray(res.data)) {
        const items: SellerNotificationItem[] = res.data.map((item: any) => {
          let category: any = SELLER_NOTIFICATION_CATEGORIES.ORDER;
          const typeUpper = (item.type || "").toUpperCase();

          if (typeUpper.includes("INVENTORY") || typeUpper.includes("STOCK")) {
            category = SELLER_NOTIFICATION_CATEGORIES.INVENTORY;
          } else if (typeUpper.includes("SETTLEMENT") || typeUpper.includes("PAYOUT") || typeUpper.includes("EARNING")) {
            category = SELLER_NOTIFICATION_CATEGORIES.SETTLEMENT;
          } else if (typeUpper.includes("PRODUCT")) {
            category = SELLER_NOTIFICATION_CATEGORIES.PRODUCT;
          } else if (typeUpper.includes("ACCOUNT") || typeUpper.includes("VERIFICATION") || typeUpper.includes("ONBOARDING")) {
            category = SELLER_NOTIFICATION_CATEGORIES.ACCOUNT;
          }

          return {
            id: item.id,
            category,
            type: item.type || "INFO",
            title: item.title || "Nursery Update",
            message: item.message || item.body || "",
            isRead: Boolean(item.is_read || item.read_at),
            priority: item.priority || "NORMAL",
            createdAt: item.created_at || new Date().toISOString(),
            data: item.data || {},
            navigation: item.navigation,
          };
        });

        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.warn("[SellerNotificationContext] Notification load warning:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications, seller?.id]);

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn("[SellerNotificationContext] Mark read failed:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn("[SellerNotificationContext] Mark all read failed:", err);
    }
  };

  const handleNotificationNavigation = (notification: SellerNotificationItem) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    const nav = notification.navigation;
    if (nav?.entityType === "ORDER" && nav.entityId) {
      router.push(`/orders/${nav.entityId}` as any);
    } else if (nav?.entityType === "INVENTORY" || nav?.entityType === "PRODUCT") {
      if (nav.entityId) {
        router.push(`/products/${nav.entityId}` as any);
      } else {
        router.push("/(tabs)/products" as any);
      }
    } else if (nav?.entityType === "SETTLEMENT") {
      router.push("/account/settlements" as any);
    } else if (nav?.entityType === "ONBOARDING" || nav?.entityType === "ACCOUNT") {
      router.push("/onboarding" as any);
    } else {
      router.push("/(tabs)/orders" as any);
    }
  };

  return (
    <SellerNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        handleNotificationNavigation,
      }}
    >
      {children}
    </SellerNotificationContext.Provider>
  );
}

export function useSellerNotifications(): SellerNotificationContextType {
  const context = useContext(SellerNotificationContext);
  if (!context) {
    throw new Error(
      "useSellerNotifications must be used within a SellerNotificationProvider",
    );
  }
  return context;
}
