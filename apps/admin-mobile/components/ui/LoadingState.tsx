import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "../../lib/theme";

export function LoadingState({
  message = "Connecting to governance gateway...",
}: {
  message?: string;
}) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.forest} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.page,
  },
  text: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
