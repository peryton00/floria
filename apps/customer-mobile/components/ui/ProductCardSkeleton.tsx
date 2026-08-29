import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors, BorderRadius, Spacing } from "../../lib/theme";
import { FloriaSkeleton } from "./FloriaSkeleton";

export function ProductCardSkeleton() {
  return (
    <View style={styles.container}>
      {/* 1. Image Skeleton Area with fixed AspectRatio and absoluteFill skeleton */}
      <View style={styles.imageContainer}>
        <FloriaSkeleton
          width="100%"
          height="100%"
          borderRadius={0}
          style={StyleSheet.absoluteFill}
        />
        {/* Wishlist floating button placeholder */}
        <View style={styles.wishlistPlaceholder}>
          <FloriaSkeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>

      {/* 2. Content Skeleton Area */}
      <View style={styles.content}>
        {/* 2-line title skeleton */}
        <FloriaSkeleton width="85%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <FloriaSkeleton width="55%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />

        {/* Metadata tag skeleton */}
        <FloriaSkeleton width="40%" height={10} borderRadius={3} style={{ marginBottom: 12 }} />

        {/* Footer price & round add action */}
        <View style={styles.footer}>
          <FloriaSkeleton width={64} height={18} borderRadius={4} />
          <FloriaSkeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>
    </View>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={styles.gridItem}>
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.xs,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1.05,
    backgroundColor: "#F2EBE1",
    position: "relative",
    overflow: "hidden",
  },
  wishlistPlaceholder: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
  },
  content: {
    padding: Spacing.sm,
    backgroundColor: Colors.white,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -Spacing.xs,
  },
  gridItem: {
    width: "50%",
  },
});
