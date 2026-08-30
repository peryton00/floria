// Floria Customer Mobile — Notification Client Service
import { Platform } from "react-native";
import Constants from "expo-constants";
import { StorageService } from "../storage";
import { Notifications, isExpoGo, type PermissionStatus } from "./expoNotifications";
import { initializeAndroidNotificationChannels, getChannelIdForCategory } from "./channels";
import type { NotificationPreferences, FloriaNotificationItem, NotificationCategory } from "./types";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "./types";

const STORAGE_KEYS = {
  PREFERENCES: "@floria:notification_preferences_v1",
  PUSH_TOKEN: "@floria:push_token_v1",
  PERMISSION_PROMPTED: "@floria:notification_prompted_v1",
};

// Configure foreground notification behavior safely
try {
  if (!isExpoGo || Platform.OS !== "android") {
    Notifications.setNotificationHandler({
      handleNotification: async (notification: any) => {
        const data = (notification.request?.content?.data || {}) as Record<string, any>;
        const isForegroundQuiet = data.foregroundQuiet === true;

        return {
          shouldShowAlert: !isForegroundQuiet,
          shouldShowBanner: !isForegroundQuiet,
          shouldShowList: true,
          shouldPlaySound: !isForegroundQuiet,
          shouldSetBadge: true,
        };
      },
    });
  }
} catch (e) {
  // Graceful fallback for Expo Go / test environments
}

// In-flight event deduplication cache (event key -> timestamp)
const eventDeduplicationCache = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 10000; // 10s deduplication window

export const NotificationService = {
  /**
   * Initializes notification channels and platform handlers.
   */
  async initialize(): Promise<void> {
    try {
      if (!isExpoGo || Platform.OS !== "android") {
        await initializeAndroidNotificationChannels();
      }
    } catch {
      // Non-blocking in Expo Go
    }
  },

  /**
   * Checks current system notification permission without prompting the user.
   */
  async getPermissionStatus(): Promise<PermissionStatus> {
    try {
      if (isExpoGo && Platform.OS === "android") {
        return "granted";
      }
      const settings = await Notifications.getPermissionsAsync();
      return (settings?.status as PermissionStatus) || "undetermined";
    } catch {
      return "undetermined";
    }
  },

  /**
   * Requests system notification permission contextually.
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (isExpoGo && Platform.OS === "android") {
        await StorageService.setItem(STORAGE_KEYS.PERMISSION_PROMPTED, true);
        return true;
      }
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      await StorageService.setItem(STORAGE_KEYS.PERMISSION_PROMPTED, true);
      return status === Notifications.PermissionStatus.GRANTED;
    } catch (e) {
      console.warn("[FloriaNotifications] Permission request error:", e);
      return false;
    }
  },

  /**
   * Checks if user has already been contextually prompted for permissions.
   */
  async hasBeenPrompted(): Promise<boolean> {
    return StorageService.getItem<boolean>(STORAGE_KEYS.PERMISSION_PROMPTED, false);
  },

  /**
   * Retrieves or registers Expo push token with local idempotency.
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      if (isExpoGo && Platform.OS === "android") {
        // Expo Go SDK 53+ removed remote push; return mock development token
        const devToken = "ExponentPushToken[expo-go-dev-token]";
        await StorageService.setItem(STORAGE_KEYS.PUSH_TOKEN, devToken);
        return devToken;
      }

      const status = await this.getPermissionStatus();
      if (status !== Notifications.PermissionStatus.GRANTED) {
        return null;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

      const tokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );

      const token = tokenResponse.data;
      if (token) {
        await StorageService.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
      }
      return token;
    } catch (error) {
      console.warn("[FloriaNotifications] Push token retrieval notice:", error);
      return null;
    }
  },

  /**
   * Presents a local in-app / push notification with Floria channel and sound.
   */
  async presentLocalNotification(params: {
    id?: string;
    title: string;
    body: string;
    category?: NotificationCategory;
    data?: Record<string, any>;
  }): Promise<void> {
    const dedupeKey = `${params.id || params.title}_${params.body}`;
    const now = Date.now();
    const lastTriggered = eventDeduplicationCache.get(dedupeKey);

    if (lastTriggered && now - lastTriggered < DEDUPLICATION_WINDOW_MS) {
      return; // Suppress duplicate notification
    }
    eventDeduplicationCache.set(dedupeKey, now);

    const channelId = getChannelIdForCategory(params.category || "ORDER");

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: params.title,
          body: params.body,
          data: {
            ...params.data,
            category: params.category,
          },
          sound: "floria_chime.wav",
          color: "#1C3524",
        },
        trigger: {
          channelId,
        } as any,
      });
    } catch (err) {
      console.warn("[FloriaNotifications] Local notification display error:", err);
    }
  },

  /**
   * Fetches user notification preferences from local storage.
   */
  async getPreferences(): Promise<NotificationPreferences> {
    return StorageService.getItem<NotificationPreferences>(
      STORAGE_KEYS.PREFERENCES,
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
  },

  /**
   * Updates user notification preferences.
   */
  async savePreferences(preferences: NotificationPreferences): Promise<boolean> {
    return StorageService.setItem(STORAGE_KEYS.PREFERENCES, preferences);
  },

  /**
   * Helper to format relative time stamps (e.g., "Just now", "25m ago", "3h ago", "Yesterday").
   */
  formatRelativeTime(isoString: string): string {
    try {
      const now = new Date().getTime();
      const past = new Date(isoString).getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDays = Math.floor(diffHour / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  },
};
