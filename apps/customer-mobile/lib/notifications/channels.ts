// Floria Customer Mobile — Android Notification Channels Configuration
import { Platform } from "react-native";
import { Notifications, isExpoGo } from "./expoNotifications";
import { ANDROID_NOTIFICATION_CHANNELS, AndroidChannelDefinition } from "./types";

/**
 * Initializes and registers official Floria Android Notification Channels.
 * Configured with distinctive Floria sound asset ('floria_chime.wav') and calibrated importance.
 */
export async function initializeAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android" || isExpoGo) {
    return;
  }

  try {
    for (const key of Object.keys(ANDROID_NOTIFICATION_CHANNELS)) {
      const channel: AndroidChannelDefinition = ANDROID_NOTIFICATION_CHANNELS[key];

      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: channel.importance as any,
        sound: channel.sound,
        vibrationPattern: channel.vibrationPattern,
        lightColor: channel.lightColor,
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
    }
  } catch (error) {
    console.warn("[FloriaNotifications] Failed to initialize Android notification channels:", error);
  }
}

/**
 * Maps a notification category to its corresponding Android channel ID.
 */
export function getChannelIdForCategory(category: string): string {
  switch (category?.toUpperCase()) {
    case "ORDER":
    case "DELIVERY":
    case "PAYMENT":
      return ANDROID_NOTIFICATION_CHANNELS.ORDERS.id;
    case "WISHLIST":
      return ANDROID_NOTIFICATION_CHANNELS.WISHLIST.id;
    case "PRODUCT":
      return ANDROID_NOTIFICATION_CHANNELS.PRODUCTS.id;
    case "ACCOUNT":
    case "SYSTEM":
      return ANDROID_NOTIFICATION_CHANNELS.ACCOUNT.id;
    case "PROMOTION":
      return ANDROID_NOTIFICATION_CHANNELS.PROMOTIONS.id;
    default:
      return ANDROID_NOTIFICATION_CHANNELS.ORDERS.id;
  }
}
