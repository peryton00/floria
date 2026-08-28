import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { Button } from "./Button";

export function ErrorState({
  title = "Connection Issue",
  message = "Failed to load marketplace content.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons
          name="alert-circle-outline"
          size={32}
          color={Colors.terracotta}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          label="Retry Connection"
          onPress={onRetry}
          variant="terracotta"
          style={styles.button}
        />
      )}
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
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.errorBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    color: Colors.ink,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
    textAlign: "center",
    lineHeight: Typography.lineHeights.sm,
    maxWidth: 280,
  },
  button: {
    marginTop: Spacing.lg,
    minWidth: 160,
  },
});
