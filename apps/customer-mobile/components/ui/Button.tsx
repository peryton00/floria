import React from "react";
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Colors, Typography, BorderRadius } from "../../lib/theme";
import { PressableScale } from "./PressableScale";
import { MotionTokens } from "../../lib/motion";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "terracotta";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return Colors.border;
    switch (variant) {
      case "secondary":
        return Colors.sage;
      case "terracotta":
        return Colors.terracotta;
      case "outline":
        return "transparent";
      case "primary":
      default:
        return Colors.forest;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.inkMuted;
    if (variant === "outline") return Colors.forest;
    return Colors.white;
  };

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      targetScale={MotionTokens.scale.pressed}
      style={[
        styles.base,
        styles[size],
        { backgroundColor: getBackgroundColor() },
        variant === "outline" && styles.outlineBorder,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`${size}Text`],
            { color: getTextColor() },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  sm: {
    minHeight: 38,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  md: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  lg: {
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  outlineBorder: {
    borderWidth: 1.5,
    borderColor: Colors.forest,
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  smText: {
    fontSize: Typography.fontSizes.xs,
  },
  mdText: {
    fontSize: Typography.fontSizes.sm,
  },
  lgText: {
    fontSize: Typography.fontSizes.base,
  },
});
