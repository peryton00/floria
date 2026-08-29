import { Easing, Animated, AccessibilityInfo } from "react-native";
import { useEffect, useState } from "react";

/**
 * Floria Mobile Motion System Tokens & Configuration
 *
 * Guiding Principle:
 * "Motion should communicate interaction, state, and continuity.
 * It should never exist merely for decoration."
 */

export const MotionTokens = {
  // Duration scales (ms)
  duration: {
    instant: 100, // Button press, tactile click
    micro: 140, // Wishlist pulse, badge toggle
    short: 180, // Image fade-in, snackbar transition
    standard: 240, // Bottom sheet entrance/exit, modal reveal
    content: 300, // Section & view transitions
  },

  // Interactive Scale Factors (Conservative & Restrained)
  scale: {
    pressed: 0.985, // Subtle button press response
    pressedCompact: 0.96, // Smaller controls (steppers, chips, icons)
    heartPulse: 1.10, // Wishlist heart toggle pulse
    tabActive: 1.05, // Bottom nav active tab indicator
  },

  // Easing Curves (Platform-safe for React Native NativeDriver)
  easing: {
    easeOut: Easing.out(Easing.cubic),
    easeInOut: Easing.inOut(Easing.cubic),
    easeIn: Easing.in(Easing.cubic),
    decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
    accelerate: Easing.bezier(0.4, 0.0, 1, 1),
  },

  // Conservative Spring Configurations (No Exaggerated Bounce)
  spring: {
    subtle: {
      tension: 180,
      friction: 12,
      useNativeDriver: true,
    },
    sheet: {
      tension: 160,
      friction: 14,
      useNativeDriver: true,
    },
  },
};

/**
 * Hook to respect OS-level Reduced Motion accessibility preference
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Check initial OS accessibility setting
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        if (mounted) setReducedMotion(enabled);
      },
    );

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return reducedMotion;
}

export default MotionTokens;
