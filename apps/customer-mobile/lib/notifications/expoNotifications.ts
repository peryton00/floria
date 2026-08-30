// Floria Customer Mobile — Safe Notifications Driver (Expo Go SDK 53+ Resilient Proxy)
import { Platform } from "react-native";
import Constants from "expo-constants";

export const isExpoGo =
  Constants?.appOwnership === "expo" ||
  (Constants?.executionEnvironment as string) === "storeClient";

export type PermissionStatus = "granted" | "undetermined" | "denied";

let NativeNotifications: any = null;

// Only evaluate and import native expo-notifications when NOT running inside Android Expo Go
if (!isExpoGo || Platform.OS !== "android") {
  try {
    // Dynamic import to prevent Expo Go SDK 53+ module evaluation error
    NativeNotifications = require("expo-notifications");
  } catch (e) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[FloriaNotifications] Native expo-notifications module load notice:", e);
    }
  }
}

export const Notifications = {
  setNotificationHandler: (handler: any) => {
    if (NativeNotifications?.setNotificationHandler) {
      try {
        NativeNotifications.setNotificationHandler(handler);
      } catch {}
    }
  },
  setNotificationChannelAsync: async (channelId: string, config: any) => {
    if (NativeNotifications?.setNotificationChannelAsync) {
      try {
        return await NativeNotifications.setNotificationChannelAsync(channelId, config);
      } catch {}
    }
    return null;
  },
  getPermissionsAsync: async () => {
    if (NativeNotifications?.getPermissionsAsync) {
      try {
        return await NativeNotifications.getPermissionsAsync();
      } catch {}
    }
    return { status: "granted", canAskAgain: true, granted: true, expires: "never" };
  },
  requestPermissionsAsync: async (options?: any) => {
    if (NativeNotifications?.requestPermissionsAsync) {
      try {
        return await NativeNotifications.requestPermissionsAsync(options);
      } catch {}
    }
    return { status: "granted", canAskAgain: true, granted: true, expires: "never" };
  },
  getExpoPushTokenAsync: async (options?: any) => {
    if (NativeNotifications?.getExpoPushTokenAsync) {
      try {
        return await NativeNotifications.getExpoPushTokenAsync(options);
      } catch {}
    }
    return { data: "ExponentPushToken[expo-go-dev-token]" };
  },
  scheduleNotificationAsync: async (request: any) => {
    if (NativeNotifications?.scheduleNotificationAsync) {
      try {
        return await NativeNotifications.scheduleNotificationAsync(request);
      } catch {}
    }
    return "dev-notification-id";
  },
  addNotificationReceivedListener: (listener: (notification: any) => void) => {
    if (NativeNotifications?.addNotificationReceivedListener) {
      try {
        return NativeNotifications.addNotificationReceivedListener(listener);
      } catch {}
    }
    return { remove: () => {} };
  },
  addNotificationResponseReceivedListener: (listener: (response: any) => void) => {
    if (NativeNotifications?.addNotificationResponseReceivedListener) {
      try {
        return NativeNotifications.addNotificationResponseReceivedListener(listener);
      } catch {}
    }
    return { remove: () => {} };
  },
  removeNotificationSubscription: (subscription: any) => {
    if (NativeNotifications?.removeNotificationSubscription) {
      try {
        NativeNotifications.removeNotificationSubscription(subscription);
      } catch {}
    } else if (subscription?.remove) {
      try {
        subscription.remove();
      } catch {}
    }
  },
  PermissionStatus: {
    GRANTED: "granted",
    UNDETERMINED: "undetermined",
    DENIED: "denied",
  },
};
