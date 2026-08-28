import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";

export function HealthStatusChip({
  serviceName,
  status = "healthy",
}: {
  serviceName: string;
  status?: "healthy" | "degraded" | "down";
}) {
  const getStatusColor = () => {
    switch (status) {
      case "healthy":
        return Colors.success;
      case "degraded":
        return Colors.warning;
      case "down":
        return Colors.error;
      default:
        return Colors.inkMuted;
    }
  };

  return (
    <View style={styles.chip}>
      <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
      <Text style={styles.service}>{serviceName}</Text>
      <Text style={[styles.status, { color: getStatusColor() }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.page,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
    marginRight: 6,
  },
  service: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.ink,
    marginRight: 6,
  },
  status: {
    fontSize: 9,
    fontWeight: "bold",
  },
});
