// Floria Delivery Mobile — Card Primitive (Linen surface with divider border)
import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from "react-native";
import { theme } from "../../lib/theme";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: "default" | "elevated" | "accent";
}

export function Card({
  children,
  style,
  onPress,
  variant = "default",
}: CardProps) {
  const cardStyle = [
    styles.card,
    variant === "elevated" && styles.elevated,
    variant === "accent" && styles.accent,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  elevated: {
    ...theme.shadows.md,
  },
  accent: {
    borderColor: theme.colors.botanicalGreen,
    backgroundColor: "#FDFCF7",
  },
});
