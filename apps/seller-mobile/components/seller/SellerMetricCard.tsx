import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";

export function SellerMetricCard({
  title,
  value,
  subtitle,
  variant = "default",
  onPress,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "alert" | "success" | "forest";
  onPress?: () => void;
}) {
  const getColors = () => {
    switch (variant) {
      case "alert":
        return {
          bg: Colors.warningBg,
          border: Colors.warning,
          text: Colors.warning,
        };
      case "success":
        return {
          bg: Colors.successBg,
          border: Colors.success,
          text: Colors.success,
        };
      case "forest":
        return {
          bg: Colors.forest,
          border: Colors.forestDark,
          text: Colors.white,
        };
      case "default":
      default:
        return { bg: Colors.linen, border: Colors.border, text: Colors.ink };
    }
  };

  const { bg, border, text } = getColors();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.card, { backgroundColor: bg, borderColor: border }]}
    >
      <Text
        style={[
          styles.title,
          variant === "forest" && { color: Colors.botanical },
        ]}
      >
        {title}
      </Text>
      <Text style={[styles.value, { color: text }]}>{value}</Text>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            variant === "forest" && { color: Colors.botanical },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    margin: Spacing.xs,
  },
  title: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    fontFamily: "Georgia",
  },
  subtitle: {
    fontSize: 10,
    color: Colors.inkLight,
    marginTop: 4,
  },
});
