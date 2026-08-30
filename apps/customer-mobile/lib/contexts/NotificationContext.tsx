// Floria Customer Mobile — Centralized Notification Context
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { Notifications, isExpoGo, type PermissionStatus } from "../notifications/expoNotifications";
import Constants from "expo-constants";
import { api } from "../api";
import { useCustomerAuth } from "./CustomerAuthContext";
import { NotificationService } from "../notifications/service";
import { resolveNotificationRoute } from "../notifications/resolver";
import type {
  FloriaNotificationItem,
  NotificationPreferences,
  NotificationCategory,
} from "../notifications/types";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../notifications/types";
import { haptics } from "../haptics";

export interface NotificationContextType {
  notifications: FloriaNotificationItem[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  preferences: NotificationPreferences;
  permissionStatus: PermissionStatus | null;
  updatePreference: (key: keyof NotificationPreferences, value: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  requestPermissionContextually: () => Promise<boolean>;
  openNotification: (item: FloriaNotificationItem) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useCustomerAuth();

  const [notifications, setNotifications] = useState<FloriaNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(
    null,
  );

  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // 1. Initialize notification system & check permissions
  useEffect(() => {
    NotificationService.initialize();
    NotificationService.getPreferences().then(setPreferences);
    NotificationService.getPermissionStatus().then(setPermissionStatus);

    // Foreground notification listener
    try {
      const isExpoGo =
        Constants.appOwnership === "expo" ||
        (Constants.executionEnvironment as string) === "storeClient";

      if (!isExpoGo || Platform.OS !== "android") {
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
          // Increment unread count & refresh unread count silently
          setUnreadCount((prev) => prev + 1);
        });

        // Notification response listener (User tapped a push notification banner)
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;
          if (data) {
            const resolved = resolveNotificationRoute(data as any);
            if (resolved.pathname) {
              router.push({
                pathname: resolved.pathname,
                params: resolved.params,
              } as any);
            }
          }
        });
      }
    } catch {
      // Mock for non-native / test environments
    }

    return () => {
      if (notificationListener.current) {
        try {
          notificationListener.current.remove();
        } catch {}
      }
      if (responseListener.current) {
        try {
          responseListener.current.remove();
        } catch {}
      }
    };
  }, [router]);

  // Helper to map raw backend notification to FloriaNotificationItem
  const mapApiNotification = useCallback((item: any): FloriaNotificationItem => {
    const rawType = (item.type || "").toUpperCase();
    let category: NotificationCategory = "ORDER";

    if (rawType.includes("DELIVERY") || rawType.includes("DISPATCH") || rawType.includes("SHIPPED")) {
      category = "DELIVERY";
    } else if (rawType.includes("PAYMENT") || rawType.includes("REFUND")) {
      category = "PAYMENT";
    } else if (rawType.includes("WISHLIST") || rawType.includes("RESTOCK")) {
      category = "WISHLIST";
    } else if (rawType.includes("PRODUCT") || rawType.includes("ARRIVAL")) {
      category = "PRODUCT";
    } else if (rawType.includes("ACCOUNT") || rawType.includes("SECURITY")) {
      category = "ACCOUNT";
    } else if (rawType.includes("PROMOTION") || rawType.includes("OFFER")) {
      category = "PROMOTION";
    }

    return {
      id: item.id,
      user_id: item.user_id,
      type: item.type,
      title: item.title || "Floria Update",
      message: item.message || "",
      data: item.data || {},
      category,
      priority: item.data?.priority || "NORMAL",
      navigation: item.data?.navigation,
      isRead: Boolean(item.read_at),
      timeAgo: NotificationService.formatRelativeTime(item.created_at || new Date().toISOString()),
      created_at: item.created_at || new Date().toISOString(),
      read_at: item.read_at,
    };
  }, []);

  // 2. Fetch Notifications from backend
  const fetchNotifications = useCallback(
    async (targetPage = 1, isRefresh = false) => {
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (targetPage === 1) {
          setLoading(true);
        }
        setError(null);

        const res = await api.getNotifications({
          page: targetPage,
          limit: 20,
        });

        if (res.success && res.data) {
          const rawItems = res.data.notifications || [];
          const mapped = rawItems.map(mapApiNotification);

          if (targetPage === 1) {
            setNotifications(mapped);
          } else {
            setNotifications((prev) => {
              const existingIds = new Set(prev.map((i) => i.id));
              const newUnique = mapped.filter((i) => !existingIds.has(i.id));
              return [...prev, ...newUnique];
            });
          }

          setUnreadCount(res.data.unreadCount ?? mapped.filter((i) => !i.isRead).length);
          setHasMore(mapped.length >= 20);
          setPage(targetPage);
        } else {
          setError(res.error?.message || "Failed to load notifications.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load notifications.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, mapApiNotification],
  );

  // 3. User Session Isolation: Refresh when user logs in, reset on logout
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotifications(1);
    } else {
      // Clear all state on logout to prevent cross-account leakage
      setNotifications([]);
      setUnreadCount(0);
      setPage(1);
      setHasMore(false);
      setError(null);
    }
  }, [isAuthenticated, user?.id, fetchNotifications]);

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications(1, true);
  }, [fetchNotifications]);

  const loadMoreNotifications = useCallback(async () => {
    if (loading || refreshing || !hasMore) return;
    await fetchNotifications(page + 1);
  }, [loading, refreshing, hasMore, page, fetchNotifications]);

  // 4. Mark Single Notification as Read
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true, read_at: new Date().toISOString() } : item)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.markNotificationRead(id);
    } catch {
      // Background sync
    }
  }, []);

  // 5. Mark All Notifications as Read
  const markAllAsRead = useCallback(async () => {
    haptics.success();
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true, read_at: new Date().toISOString() })),
    );
    setUnreadCount(0);

    try {
      await api.markAllNotificationsRead();
    } catch {
      // Background sync
    }
  }, []);

  // 6. Delete Notification
  const deleteNotification = useCallback(async (id: string) => {
    haptics.light();
    let wasUnread = false;
    setNotifications((prev) => {
      const target = prev.find((i) => i.id === id);
      wasUnread = target ? !target.isRead : false;
      return prev.filter((item) => item.id !== id);
    });
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await api.deleteNotification(id);
    } catch {
      // Background sync
    }
  }, []);

  // 7. Update User Notification Preference
  const updatePreference = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      haptics.selection();
      const updated = { ...preferences, [key]: value };
      setPreferences(updated);
      await NotificationService.savePreferences(updated);
    },
    [preferences],
  );

  // 8. Request Permission Contextually
  const requestPermissionContextually = useCallback(async () => {
    const granted = await NotificationService.requestPermissions();
    const status = await NotificationService.getPermissionStatus();
    setPermissionStatus(status);

    if (granted) {
      haptics.success();
      // Register token with backend
      const token = await NotificationService.getExpoPushToken();
      if (token && isAuthenticated) {
        // Idempotent token registration
        console.log("[FloriaNotifications] Push token registered:", token);
      }
    }
    return granted;
  }, [isAuthenticated]);

  // 9. Open Notification & Trigger Deep Link
  const openNotification = useCallback(
    (item: FloriaNotificationItem) => {
      if (!item.isRead) {
        markAsRead(item.id);
      }

      haptics.light();
      const resolved = resolveNotificationRoute(item);
      if (resolved.pathname) {
        router.push({
          pathname: resolved.pathname,
          params: resolved.params,
        } as any);
      }
    },
    [markAsRead, router],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshing,
        error,
        hasMore,
        preferences,
        permissionStatus,
        updatePreference,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
        loadMoreNotifications,
        requestPermissionContextually,
        openNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
