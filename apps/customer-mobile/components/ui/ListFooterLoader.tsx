import React from "react";
import { View, StyleSheet } from "react-native";
import { Spacing } from "../../lib/theme";
import { InlineSpinner } from "./InlineSpinner";

export function ListFooterLoader({ message = "Loading more specimens..." }: { message?: string }) {
  return (
    <View style={styles.container}>
      <InlineSpinner message={message} size="small" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
