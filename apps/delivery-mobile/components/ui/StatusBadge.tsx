// Floria Delivery Mobile — StatusBadge Primitive
import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { theme } from "../../lib/theme";
import type { DeliveryAssignmentStatus } from "@floria/types";

interface StatusBadgeProps {
  status: DeliveryAssignmentStatus | string;
  style?: StyleProp<ViewStyle>;
  size?: "sm" | "md";
}

export function StatusBadge({ status, style, size = "md" }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "assigned":
        return {
          label: "ASSIGNED",
          bg: theme.colors.botanicalGreen,
          color: theme.colors.forest,
        };
      case "picked_up":
        return {
          label: "PICKED UP",
          bg: "#E3EBE3",
          color: theme.colors.forest,
        };
      case "out_for_delivery":
        return {
          label: "IN TRANSIT",
          bg: "#F2E8DC",
          color: theme.colors.warning,
        };
      case "delivered":
        return {
          label: "DELIVERED",
          bg: "#DCEADB",
          color: theme.colors.success,
        };
      case "failed":
        return {
          label: "FAILED",
          bg: "#F8DFDC",
          color: theme.colors.error,
        };
      default:
        return {
          label: (status || "UNKNOWN").toUpperCase(),
          bg: theme.colors.inputSand,
          color: theme.colors.muted,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        size === "sm" && styles.badgeSm,
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${config.label}`}
    >
      <Text
        style={[
          styles.text,
          { color: config.color },
          size === "sm" && styles.textSm,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.xs,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: theme.spacing.xs + 2,
    paddingVertical: 2,
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 9,
  },
});
