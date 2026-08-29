import React from "react";
import { Text, StyleSheet } from "react-native";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { PressableScale } from "../ui/PressableScale";
import { MotionTokens } from "../../lib/motion";

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
    <PressableScale
      onPress={onPress}
      targetScale={MotionTokens.scale.pressedCompact}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </PressableScale>
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
