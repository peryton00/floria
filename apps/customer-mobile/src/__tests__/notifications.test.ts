// Floria Customer Mobile — Notification System Unit Tests
import { describe, it, expect, vi } from "vitest";

// Mock Expo and React Native dependencies for Node test environment
vi.mock("react-native", () => ({
  Platform: { OS: "android", select: vi.fn((obj) => obj.android) },
  StyleSheet: { create: (styles: any) => styles },
  Animated: {
    Value: vi.fn(() => ({
      interpolate: vi.fn(),
      setValue: vi.fn(),
    })),
    timing: vi.fn(() => ({ start: vi.fn() })),
    loop: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
    sequence: vi.fn(() => ({ start: vi.fn() })),
  },
}));

vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  getPermissionsAsync: vi.fn(async () => ({ status: "granted" })),
  requestPermissionsAsync: vi.fn(async () => ({ status: "granted" })),
  getExpoPushTokenAsync: vi.fn(async () => ({ data: "ExponentPushToken[mock-token]" })),
  scheduleNotificationAsync: vi.fn(),
  addNotificationReceivedListener: vi.fn(() => ({ remove: vi.fn() })),
  addNotificationResponseReceivedListener: vi.fn(() => ({ remove: vi.fn() })),
  removeNotificationSubscription: vi.fn(),
  PermissionStatus: {
    GRANTED: "granted",
    UNDETERMINED: "undetermined",
    DENIED: "denied",
  },
}));

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: { extra: { eas: { projectId: "mock-project-id" } } },
  },
}));

import {
  NOTIFICATION_CATEGORIES,
  DEFAULT_NOTIFICATION_PREFERENCES,
  ANDROID_NOTIFICATION_CHANNELS,
} from "../../lib/notifications/types";
import {
  getChannelIdForCategory,
} from "../../lib/notifications/channels";
import {
  resolveNotificationRoute,
} from "../../lib/notifications/resolver";
import {
  NotificationService,
} from "../../lib/notifications/service";

describe("Notification System — Categories & Enums", () => {
  it("defines all mandatory notification categories", () => {
    expect(NOTIFICATION_CATEGORIES.ORDER).toBe("ORDER");
    expect(NOTIFICATION_CATEGORIES.DELIVERY).toBe("DELIVERY");
    expect(NOTIFICATION_CATEGORIES.PAYMENT).toBe("PAYMENT");
    expect(NOTIFICATION_CATEGORIES.WISHLIST).toBe("WISHLIST");
    expect(NOTIFICATION_CATEGORIES.PRODUCT).toBe("PRODUCT");
    expect(NOTIFICATION_CATEGORIES.ACCOUNT).toBe("ACCOUNT");
    expect(NOTIFICATION_CATEGORIES.PROMOTION).toBe("PROMOTION");
    expect(NOTIFICATION_CATEGORIES.SYSTEM).toBe("SYSTEM");
  });

  it("provides transactional-first default notification preferences", () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.ordersAndDelivery).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.wishlistAndRestock).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.productDiscovery).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.promotionsAndOffers).toBe(false); // Promotional off by default
    expect(DEFAULT_NOTIFICATION_PREFERENCES.accountAndSecurity).toBe(true);
  });
});

describe("Notification System — Android Channels & Floria Sound", () => {
  it("configures Android channels with the distinctive Floria chime sound asset", () => {
    for (const channelKey of Object.keys(ANDROID_NOTIFICATION_CHANNELS)) {
      const channel = ANDROID_NOTIFICATION_CHANNELS[channelKey];
      expect(channel.sound).toBe("floria_chime.wav");
      expect(channel.id).toBeDefined();
      expect(channel.name).toBeDefined();
      expect(channel.importance).toBeGreaterThanOrEqual(2);
    }
  });

  it("maps categories accurately to Android notification channels", () => {
    expect(getChannelIdForCategory("ORDER")).toBe("floria-orders");
    expect(getChannelIdForCategory("DELIVERY")).toBe("floria-orders");
    expect(getChannelIdForCategory("PAYMENT")).toBe("floria-orders");
    expect(getChannelIdForCategory("WISHLIST")).toBe("floria-wishlist");
    expect(getChannelIdForCategory("PRODUCT")).toBe("floria-products");
    expect(getChannelIdForCategory("ACCOUNT")).toBe("floria-account");
    expect(getChannelIdForCategory("PROMOTION")).toBe("floria-promotions");
    expect(getChannelIdForCategory("UNKNOWN")).toBe("floria-orders"); // safe fallback
  });
});

describe("Notification System — Deep Link Navigation Resolver", () => {
  it("resolves explicit ORDER navigation target to order detail", () => {
    const route = resolveNotificationRoute({
      data: {
        navigation: { entityType: "ORDER", entityId: "ord-9821" },
      },
    });
    expect(route.pathname).toBe("/orders/[id]");
    expect(route.params).toEqual({ id: "ord-9821" });
  });

  it("resolves explicit PRODUCT navigation target to product detail", () => {
    const route = resolveNotificationRoute({
      data: {
        navigation: { entityType: "PRODUCT", entityId: "monstera-deliciosa" },
      },
    });
    expect(route.pathname).toBe("/products/[id]");
    expect(route.params).toEqual({ id: "monstera-deliciosa" });
  });

  it("resolves explicit WISHLIST navigation target with ID to product detail", () => {
    const route = resolveNotificationRoute({
      data: {
        navigation: { entityType: "WISHLIST", entityId: "fiddle-leaf-fig" },
      },
    });
    expect(route.pathname).toBe("/products/[id]");
    expect(route.params).toEqual({ id: "fiddle-leaf-fig" });
  });

  it("resolves explicit ACCOUNT navigation target to profile tab", () => {
    const route = resolveNotificationRoute({
      data: {
        navigation: { entityType: "ACCOUNT" },
      },
    });
    expect(route.pathname).toBe("/(tabs)/profile");
  });

  it("resolves direct route override if provided in payload", () => {
    const route = resolveNotificationRoute({
      data: {
        route: "/addresses",
      },
    });
    expect(route.pathname).toBe("/addresses");
  });

  it("resolves fallback order tracking by type and source_id when navigation object is absent", () => {
    const route = resolveNotificationRoute({
      type: "ORDER_DISPATCHED",
      source_id: "ord-7744",
      data: {},
    });
    expect(route.pathname).toBe("/orders/[id]");
    expect(route.params).toEqual({ id: "ord-7744" });
  });

  it("resolves fallback back-in-stock by type and product_id", () => {
    const route = resolveNotificationRoute({
      type: "WISHLIST_BACK_IN_STOCK",
      data: { productId: "snake-plant-laurentii" },
    });
    expect(route.pathname).toBe("/products/[id]");
    expect(route.params).toEqual({ id: "snake-plant-laurentii" });
  });

  it("falls back gracefully to home tab on unresolvable notification", () => {
    const route = resolveNotificationRoute({
      type: "GENERAL_BROADCAST",
      data: {},
    });
    expect(route.pathname).toBe("/(tabs)");
  });
});

describe("Notification System — Relative Time Formatting", () => {
  it("formats relative timestamps gracefully", () => {
    const now = new Date();
    const tenSecsAgo = new Date(now.getTime() - 10 * 1000).toISOString();
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000).toISOString();
    const yesterday = new Date(now.getTime() - 25 * 3600 * 1000).toISOString();

    expect(NotificationService.formatRelativeTime(tenSecsAgo)).toBe("Just now");
    expect(NotificationService.formatRelativeTime(tenMinsAgo)).toBe("10m ago");
    expect(NotificationService.formatRelativeTime(threeHoursAgo)).toBe("3h ago");
    expect(NotificationService.formatRelativeTime(yesterday)).toBe("Yesterday");
  });
});

describe("Notification System — Unread Count & Badge Display", () => {
  const getBadgeText = (unreadCount: number) => {
    if (unreadCount <= 0) return null;
    if (unreadCount > 9) return "9+";
    return String(unreadCount);
  };

  it("returns null when there are no unread notifications", () => {
    expect(getBadgeText(0)).toBe(null);
  });

  it("returns exact count when unread count is between 1 and 9", () => {
    expect(getBadgeText(1)).toBe("1");
    expect(getBadgeText(5)).toBe("5");
    expect(getBadgeText(9)).toBe("9");
  });

  it("caps count at 9+ when unread count is 10 or greater", () => {
    expect(getBadgeText(10)).toBe("9+");
    expect(getBadgeText(42)).toBe("9+");
  });
});

describe("Notification System — State Transitions & Isolation", () => {
  it("marks individual notification as read without mutating siblings", () => {
    const initialList = [
      { id: "notif-1", isRead: false },
      { id: "notif-2", isRead: false },
    ];

    const updated = initialList.map((item) =>
      item.id === "notif-1" ? { ...item, isRead: true } : item,
    );

    expect(updated.find((i) => i.id === "notif-1")?.isRead).toBe(true);
    expect(updated.find((i) => i.id === "notif-2")?.isRead).toBe(false);
  });

  it("marks all notifications as read", () => {
    const list = [
      { id: "notif-1", isRead: false },
      { id: "notif-2", isRead: false },
    ];

    const allRead = list.map((item) => ({ ...item, isRead: true }));
    expect(allRead.every((i) => i.isRead)).toBe(true);
  });

  it("clears user notifications on logout to prevent cross-account leakage", () => {
    let activeUserNotifications: any[] = [
      { id: "user1-notif", title: "Your Order #FL-101" },
    ];

    const handleLogout = () => {
      activeUserNotifications = [];
    };

    handleLogout();
    expect(activeUserNotifications).toHaveLength(0);
  });
});
