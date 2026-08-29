import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors, BorderRadius, Spacing } from "../../lib/theme";
import { FloriaSkeleton } from "./FloriaSkeleton";

export function CategoryCardSkeleton() {
  return (
    <View style={styles.card}>
      <FloriaSkeleton
        width="100%"
        height="100%"
        borderRadius={0}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardOverlay}>
        <View style={styles.titleRow}>
          <FloriaSkeleton width="65%" height={16} borderRadius={4} />
          <FloriaSkeleton width={20} height={20} borderRadius={10} />
        </View>
        <FloriaSkeleton width="85%" height={10} borderRadius={3} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function CategoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, idx) => (
        <CategoryCardSkeleton key={idx} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  card: {
    width: "47.5%",
    height: 160,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: "#F2EBE1",
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(18, 43, 37, 0.4)",
    padding: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
