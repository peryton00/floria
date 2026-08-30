// Safe proxy for expo-notifications across Expo Go, Native, and Web
import { Platform } from "react-native";
import Constants from "expo-constants";

export const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === "storeClient";

export let Notifications: any = {
  getPermissionsAsync: async () => ({ status: "undetermined", granted: false }),
  requestPermissionsAsync: async () => ({ status: "undetermined", granted: false }),
  getExpoPushTokenAsync: async () => ({ data: "simulated-token" }),
  setNotificationHandler: () => {},
  setNotificationChannelAsync: async () => {},
  addNotificationReceivedListener: () => ({ remove: () => {} }),
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  setBadgeCountAsync: async () => {},
};

if (Platform.OS !== "web") {
  try {
    const ExpoNotifs = require("expo-notifications");
    if (ExpoNotifs) {
      Notifications = ExpoNotifs;
    }
  } catch {
    // Graceful fallback for non-native environments
  }
}
