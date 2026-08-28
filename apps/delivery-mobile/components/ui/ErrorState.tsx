// Floria Delivery Mobile — ErrorState Primitive (Calm, actionable)
import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ErrorState({
  title = "Connection Issue",
  message = "Could not sync delivery assignments with Floria Operations.",
  onRetry,
  style,
}: ErrorStateProps) {
  return (
    <View style={[styles.container, style]} accessibilityRole="alert">
      <View style={styles.iconCircle}>
        <MaterialIcons
          name="info-outline"
          size={28}
          color={theme.colors.terracotta}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          label="RETRY SYNC"
          onPress={onRetry}
          variant="secondary"
          size="sm"
          style={styles.retryBtn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    margin: theme.spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F8DFDC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.title,
    fontSize: 16,
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  message: {
    ...theme.typography.subtitle,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
    color: theme.colors.muted,
  },
  retryBtn: {
    minWidth: 120,
  },
});
