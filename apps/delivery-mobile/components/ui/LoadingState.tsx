// Floria Delivery Mobile — LoadingState Primitive
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from "react-native";
import { theme } from "../../lib/theme";

interface LoadingStateProps {
  message?: string;
  style?: StyleProp<ViewStyle>;
}

export function LoadingState({
  message = "Loading assignments...",
  style,
}: LoadingStateProps) {
  return (
    <View style={[styles.container, style]} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={theme.colors.forest} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    ...theme.typography.caption,
    marginTop: theme.spacing.md,
    color: theme.colors.muted,
  },
});
