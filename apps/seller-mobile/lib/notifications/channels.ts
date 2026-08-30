// Floria Seller Mobile — Android Channels Initializer
import { Platform } from "react-native";
import { Notifications, isExpoGo } from "./expoNotifications";
import { ANDROID_SELLER_CHANNELS, AndroidChannelDefinition } from "./types";

export async function initializeSellerAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android" || isExpoGo) {
    return;
  }

  try {
    for (const key of Object.keys(ANDROID_SELLER_CHANNELS)) {
      const channel: AndroidChannelDefinition = ANDROID_SELLER_CHANNELS[key];
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
    console.warn("[FloriaSellerNotifications] Android channel init error:", error);
  }
}
