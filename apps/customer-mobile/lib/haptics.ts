import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * Floria Context-Aware Haptic Feedback System
 *
 * Provides a semantic, platform-aware haptic abstraction.
 * Includes rate-limiting/spam protection and graceful degradation for unsupported environments.
 */

// Timestamp tracking for throttle / spam prevention (minimum interval between consecutive haptics)
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
   * Use for: filters, toggles, normal quantity stepper increments (+1 / -1), tab navigation.
   */
  selection: () => {
    return executeHapticSafely(() => Haptics.selectionAsync());
  },

  /**
   * Subtle impact.
   * Use for: pull-to-refresh activation threshold, wishlist heart toggle.
   */
  light: () => {
    return executeHapticSafely(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    );
  },

  /**
   * Crisp, positive confirmation.
   * Use for: confirmed Add to Bag success, confirmed order completion, successful profile/address save.
   */
  success: () => {
    return executeHapticSafely(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    );
  },

  /**
   * Noticeable caution feedback.
   * Use for: stock limitations, minimum/maximum boundary reached.
   */
  warning: () => {
    return executeHapticSafely(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    );
  },

  /**
   * Short, firm error buzz.
   * Use for: payment failure, critical network error, destructive item removal.
   */
  error: () => {
    return executeHapticSafely(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    );
  },

  /**
   * Short rigid boundary click.
   * Use for: trying to decrement at quantity 1 or incrementing past max stock.
   */
  boundary: () => {
    return executeHapticSafely(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    );
  },
};

export default haptics;
