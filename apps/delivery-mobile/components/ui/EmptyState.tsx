// Floria Delivery Mobile — EmptyState Primitive with Phosphor Icons
import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { theme } from "../../lib/theme";
import { FloriaIcon, FloriaIconName } from "./FloriaIcon";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  subtitle: string;
  iconName?: FloriaIconName | string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  subtitle,
  iconName = "package",
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <FloriaIcon
          name={iconName}
          size={32}
          color={theme.colors.forest}
          weight="bold"
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.actionBtn}
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
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.botanicalGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.forest,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: theme.spacing.lg,
  },
  actionBtn: {
    minWidth: 140,
  },
});
