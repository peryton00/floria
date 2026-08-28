import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, BorderRadius } from "../../lib/theme";

export function StatusBadge({ status }: { status: string }) {
  const getColors = () => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "delivered":
      case "active":
      case "published":
      case "healthy":
        return { bg: Colors.successBg, text: Colors.success };
      case "pending":
      case "unverified":
      case "under_review":
      case "preparing":
      case "draft":
        return { bg: Colors.warningBg, text: Colors.warning };
      case "rejected":
      case "suspended":
      case "cancelled":
      case "flagged":
      case "degraded":
        return { bg: Colors.errorBg, text: Colors.error };
      default:
        return { bg: Colors.sand, text: Colors.inkMuted };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>
        {status?.replace(/_/g, " ")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
