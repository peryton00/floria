import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";

export function CategoryChip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.sand,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forestDark,
  },
  text: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.ink,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textSelected: {
    color: Colors.white,
  },
});
