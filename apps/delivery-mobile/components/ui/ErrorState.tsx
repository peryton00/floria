// Floria Delivery Mobile — ErrorState Primitive with Phosphor Icons
import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { theme } from "../../lib/theme";
import { FloriaIcon } from "./FloriaIcon";
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
        <FloriaIcon
          name="warning"
          size={26}
          color={theme.colors.terracotta}
          weight="bold"
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
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.terracotta,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: theme.spacing.lg,
  },
  retryBtn: {
    minWidth: 140,
  },
});
