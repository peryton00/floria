import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, BorderRadius } from "../../lib/theme";

export function StatusBadge({ status }: { status: string }) {
  const getColors = () => {
    const s = status?.toLowerCase() || "";
    if (s.includes("deliver") || s.includes("approved") || s.includes("active") || s.includes("picked")) {
      return { bg: Colors.successBg, text: Colors.success };
    }
    if (s.includes("ready") || s.includes("pickup") || s.includes("dispatch")) {
      return { bg: "#EDE9FE", text: "#6D28D9" };
    }
    if (s.includes("preparing") || s.includes("processing")) {
      return { bg: Colors.warningBg, text: Colors.warning };
    }
    if (s.includes("confirmed")) {
      return { bg: "#E0F2FE", text: "#0369A1" };
    }
    if (s.includes("placed") || s.includes("new") || s.includes("pending")) {
      return { bg: "#EFF6FF", text: "#1D4ED8" };
    }
    if (s.includes("reject") || s.includes("cancel") || s.includes("suspend") || s.includes("issue")) {
      return { bg: Colors.errorBg, text: Colors.error };
    }
    return { bg: Colors.sand, text: Colors.inkMuted };
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
