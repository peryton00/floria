// Floria Delivery Mobile — EmptyState Primitive (Botanical aesthetic)
import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  subtitle: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  subtitle,
  iconName = "eco",
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <MaterialIcons name={iconName} size={32} color={theme.colors.forest} />
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
    ...theme.typography.title,
    fontSize: 16,
    color: theme.colors.forest,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    ...theme.typography.subtitle,
    textAlign: "center",
    color: theme.colors.muted,
  },
  actionBtn: {
    marginTop: theme.spacing.lg,
  },
});
