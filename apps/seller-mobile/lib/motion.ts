import { Easing, Animated, AccessibilityInfo } from "react-native";
import { useEffect, useState } from "react";

export const MotionTokens = {
  duration: {
    instant: 100,
    micro: 140,
    short: 180,
    standard: 240,
    content: 300,
  },
  scale: {
    pressed: 0.985,
    pressedCompact: 0.96,
    tabActive: 1.05,
  },
  easing: {
    easeOut: Easing.out(Easing.cubic),
    easeInOut: Easing.inOut(Easing.cubic),
    easeIn: Easing.in(Easing.cubic),
  },
};

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );
    return () => subscription.remove();
  }, []);

  return reducedMotion;
}
