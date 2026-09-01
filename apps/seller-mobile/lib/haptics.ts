import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * Floria Context-Aware Haptic Feedback System for Seller Mobile
 *
 * Provides a semantic, platform-aware haptic abstraction.
 * Includes rate-limiting/spam protection and graceful degradation for unsupported environments.
 */

let lastHapticTimestamp = 0;
const HAPTIC_THROTTLE_MS = 60;

async function executeHapticSafely(hapticFn: () => Promise<void>) {
  if (Platform.OS === "web") return;

  const now = Date.now();
  if (now - lastHapticTimestamp < HAPTIC_THROTTLE_MS) {
    return;
  }
  lastHapticTimestamp = now;

  try {
    await hapticFn();
  } catch {
    // Graceful silent degradation on devices without haptic engines
  }
}

export const haptics = {
  /**
   * Very subtle click/tick.
   * Use for: tab navigation, filters, toggles, steppers.
   */
  selection: () => {
    return executeHapticSafely(() => Haptics.selectionAsync());
  },

  /**
   * Subtle impact.
   * Use for: pull-to-refresh activation threshold, light taps.
   */
  light: () => {
    return executeHapticSafely(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    );
  },

  /**
   * Medium impact.
   * Use for: button clicks, order state changes.
   */
  medium: () => {
    return executeHapticSafely(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    );
  },

  /**
   * Heavy impact.
   */
  heavy: () => {
    return executeHapticSafely(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    );
  },

  /**
   * Success notification pulse.
   */
  success: () => {
    return executeHapticSafely(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    );
  },

  /**
   * Warning notification pulse.
   */
  warning: () => {
    return executeHapticSafely(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    );
  },

  /**
   * Error notification pulse.
   */
  error: () => {
    return executeHapticSafely(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    );
  },
};
