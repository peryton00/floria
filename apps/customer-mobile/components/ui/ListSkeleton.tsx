import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors, BorderRadius, Spacing } from "../../lib/theme";
import { FloriaSkeleton } from "./FloriaSkeleton";

export function ListItemSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <FloriaSkeleton width={48} height={48} borderRadius={BorderRadius.md} />
        <View style={styles.content}>
          <FloriaSkeleton width="70%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
          <FloriaSkeleton width="45%" height={12} borderRadius={3} />
        </View>
        <FloriaSkeleton width={60} height={20} borderRadius={4} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, idx) => (
        <ListItemSkeleton key={idx} />
      ))}
    </View>
  );
}

export function OrderDetailSkeleton() {
  return (
    <View style={styles.list}>
      {/* Order Info Card Skeleton */}
      <View style={styles.card}>
        <FloriaSkeleton width="50%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
        <FloriaSkeleton width="30%" height={12} borderRadius={3} style={{ marginBottom: 16 }} />
        <FloriaSkeleton width="100%" height={60} borderRadius={BorderRadius.md} />
      </View>

      {/* Items Card Skeleton */}
      <View style={styles.card}>
        <FloriaSkeleton width="40%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
        <ListItemSkeleton />
        <ListItemSkeleton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  content: {
    flex: 1,
  },
});
