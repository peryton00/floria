import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { Button } from "./Button";

export function EmptyState({
  icon = "leaf-outline",
  title,
  message,
  description,
  actionLabel,
  onAction,
}: {
  icon?: any;
  title: string;
  message?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const displayText = description || message || "";

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={28} color={Colors.forest} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {displayText ? <Text style={styles.message}>{displayText}</Text> : null}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.page,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.botanical,
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
