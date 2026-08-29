import React, { useRef } from "react";
import {
  Pressable,
  Animated,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
  PressableProps,
} from "react-native";
import { MotionTokens, useReducedMotion } from "../../lib/motion";

export interface PressableScaleProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  targetScale?: number;
  activeOpacity?: number;
  durationIn?: number;
  durationOut?: number;
}

/**
 * PressableScale
 *
 * Restrained micro-interaction wrapper for interactive elements.
 * Provides a subtle tactile press scale response (1.0 -> 0.985 -> 1.0)
 * without exaggerated bounce or slow animations.
 */
export function PressableScale({
  children,
  style,
  targetScale = MotionTokens.scale.pressed,
  activeOpacity = 0.92,
  durationIn = MotionTokens.duration.instant,
  durationOut = 120,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  const handlePressIn = (e: GestureResponderEvent) => {
    if (!disabled && !reducedMotion) {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: targetScale,
          duration: durationIn,
          easing: MotionTokens.easing.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: activeOpacity,
          duration: durationIn,
          easing: MotionTokens.easing.easeOut,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    if (!disabled && !reducedMotion) {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: durationOut,
          easing: MotionTokens.easing.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: durationOut,
          easing: MotionTokens.easing.easeOut,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onPressOut?.(e);
  };

  return (
    <Animated.View style={[{ transform: [{ scale }], opacity }]}>
      <Pressable
        {...rest}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default PressableScale;
