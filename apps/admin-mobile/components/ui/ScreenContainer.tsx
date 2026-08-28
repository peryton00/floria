import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors, Spacing } from "../../lib/theme";

export function ScreenContainer({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
    padding: Spacing.md,
  },
});
