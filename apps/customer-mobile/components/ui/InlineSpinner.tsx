import React from "react";
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, Typography, Spacing } from "../../lib/theme";

export interface InlineSpinnerProps {
  message?: string;
  size?: "small" | "large";
  color?: string;
  style?: ViewStyle;
}

export function InlineSpinner({
  message,
  size = "small",
  color = Colors.forest,
  style,
}: InlineSpinnerProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  text: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    fontWeight: "500",
  },
});
