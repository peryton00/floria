import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Colors, Spacing, BorderRadius } from "../../lib/theme";
import { FloriaSkeleton } from "./FloriaSkeleton";

export function ProductDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* 1. Header placeholder */}
      <View style={styles.header}>
        <FloriaSkeleton width={32} height={32} borderRadius={16} />
        <FloriaSkeleton width={160} height={18} borderRadius={4} />
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 2. Large Image Skeleton */}
        <View style={styles.imageContainer}>
          <FloriaSkeleton
            width="100%"
            height="100%"
            borderRadius={0}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.wishlistPlaceholder}>
            <FloriaSkeleton width={38} height={38} borderRadius={19} />
          </View>
        </View>

        {/* 3. Details Container */}
        <View style={styles.detailsContainer}>
          {/* Title & Botanical Name */}
          <FloriaSkeleton width="75%" height={24} borderRadius={4} style={{ marginBottom: 8 }} />
          <FloriaSkeleton width="45%" height={14} borderRadius={4} style={{ marginBottom: 16 }} />

          {/* Price & Stock Badge Row */}
          <View style={styles.priceRow}>
            <FloriaSkeleton width={100} height={28} borderRadius={4} />
            <FloriaSkeleton width={70} height={22} borderRadius={11} />
          </View>

          {/* 3 Care Cards */}
          <View style={styles.specsGrid}>
            <View style={styles.specCard}>
              <FloriaSkeleton width={20} height={20} borderRadius={10} style={{ marginBottom: 6 }} />
              <FloriaSkeleton width="70%" height={10} borderRadius={3} style={{ marginBottom: 4 }} />
              <FloriaSkeleton width="85%" height={12} borderRadius={3} />
            </View>
            <View style={styles.specCard}>
              <FloriaSkeleton width={20} height={20} borderRadius={10} style={{ marginBottom: 6 }} />
              <FloriaSkeleton width="70%" height={10} borderRadius={3} style={{ marginBottom: 4 }} />
              <FloriaSkeleton width="85%" height={12} borderRadius={3} />
            </View>
            <View style={styles.specCard}>
              <FloriaSkeleton width={20} height={20} borderRadius={10} style={{ marginBottom: 6 }} />
              <FloriaSkeleton width="70%" height={10} borderRadius={3} style={{ marginBottom: 4 }} />
              <FloriaSkeleton width="85%" height={12} borderRadius={3} />
            </View>
          </View>

          {/* Overview Skeleton */}
          <View style={styles.section}>
            <FloriaSkeleton width="40%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            <FloriaSkeleton width="100%" height={12} borderRadius={3} style={{ marginBottom: 4 }} />
            <FloriaSkeleton width="95%" height={12} borderRadius={3} style={{ marginBottom: 4 }} />
            <FloriaSkeleton width="80%" height={12} borderRadius={3} />
          </View>

          {/* Guarantee Banner Skeleton */}
          <View style={styles.guaranteeBanner}>
            <FloriaSkeleton width={24} height={24} borderRadius={12} />
            <View style={{ flex: 1, gap: 4 }}>
              <FloriaSkeleton width="60%" height={14} borderRadius={3} />
              <FloriaSkeleton width="90%" height={10} borderRadius={3} />
            </View>
          </View>

          {/* Quantity Skeleton */}
          <View style={styles.quantitySection}>
            <FloriaSkeleton width={80} height={16} borderRadius={4} />
            <FloriaSkeleton width={110} height={36} borderRadius={BorderRadius.md} />
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar Skeleton */}
      <View style={styles.footer}>
        <FloriaSkeleton width="48%" height={44} borderRadius={BorderRadius.md} />
        <FloriaSkeleton width="48%" height={44} borderRadius={BorderRadius.md} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  header: {
    height: 44,
    backgroundColor: Colors.page,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  content: {
    paddingBottom: 90,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1.08,
    backgroundColor: Colors.linen,
    position: "relative",
  },
  wishlistPlaceholder: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
  },
  detailsContainer: {
    padding: Spacing.md,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  specsGrid: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  specCard: {
    flex: 1,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    alignItems: "center",
  },
  section: {
    marginBottom: Spacing.md,
  },
  guaranteeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm + 2,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quantitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.linen,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
