// Floria Delivery Mobile — Button Primitive (Terracotta Primary, Forest Secondary, Outline)
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { theme } from "../../lib/theme";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "md" | "lg" | "sm";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  labelStyle,
  accessibilityLabel,
  icon,
}: ButtonProps) {
  const isInteractive = !disabled && !loading;

  const buttonStyles = [
    styles.base,
    size === "sm" && styles.sizeSm,
    size === "md" && styles.sizeMd,
    size === "lg" && styles.sizeLg,
    variant === "primary" && styles.primary,
    variant === "secondary" && styles.secondary,
    variant === "outline" && styles.outline,
    variant === "ghost" && styles.ghost,
    variant === "danger" && styles.danger,
    !isInteractive && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.textBase,
    size === "sm" && styles.textSm,
    size === "md" && styles.textMd,
    size === "lg" && styles.textLg,
    variant === "primary" && styles.textPrimary,
    variant === "secondary" && styles.textSecondary,
    variant === "outline" && styles.textOutline,
    variant === "ghost" && styles.textGhost,
    variant === "danger" && styles.textDanger,
    !isInteractive && styles.textDisabled,
    labelStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={isInteractive ? onPress : undefined}
      activeOpacity={0.8}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "outline" || variant === "ghost"
              ? theme.colors.forest
              : theme.colors.white
          }
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    gap: theme.spacing.sm,
  },
  sizeSm: {
    height: 36,
    paddingHorizontal: theme.spacing.md,
  },
  sizeMd: {
    height: 48, // Meets min 44px touch target
    paddingHorizontal: theme.spacing.lg,
  },
  sizeLg: {
    height: 54,
    paddingHorizontal: theme.spacing.xl,
  },
  primary: {
    backgroundColor: theme.colors.terracotta,
  },
  secondary: {
    backgroundColor: theme.colors.forest,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.terracotta,
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    ...theme.typography.button,
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 13,
  },
  textLg: {
    fontSize: 14,
  },
  textPrimary: {
    color: theme.colors.white,
  },
  textSecondary: {
    color: theme.colors.white,
  },
  textOutline: {
    color: theme.colors.charcoal,
  },
  textGhost: {
    color: theme.colors.forest,
  },
  textDanger: {
    color: theme.colors.terracotta,
  },
  textDisabled: {
    color: theme.colors.muted,
  },
});
