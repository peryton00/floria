import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Platform } from "react-native";
import { Colors, BorderRadius, Spacing } from "../../lib/theme";

export function SkeletonBox({
  width = "100%",
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: {
  width?: any;
  height?: number;
  borderRadius?: number;
  style?: any;
}) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

export function HomeSkeleton() {
  return (
    <View style={styles.container}>
      {/* Overview Cards 2x2 */}
      <View style={styles.section}>
        <SkeletonBox width={140} height={16} style={{ marginBottom: Spacing.sm }} />
        <View style={styles.row}>
          <SkeletonBox width="48%" height={85} borderRadius={BorderRadius.lg} />
          <SkeletonBox width="48%" height={85} borderRadius={BorderRadius.lg} />
        </View>
        <View style={[styles.row, { marginTop: Spacing.xs }]}>
          <SkeletonBox width="48%" height={85} borderRadius={BorderRadius.lg} />
          <SkeletonBox width="48%" height={85} borderRadius={BorderRadius.lg} />
        </View>
      </View>

      {/* Needs Attention Skeleton */}
      <View style={styles.section}>
        <SkeletonBox width={160} height={16} style={{ marginBottom: Spacing.sm }} />
        <SkeletonBox width="100%" height={56} borderRadius={BorderRadius.md} style={{ marginBottom: Spacing.xs }} />
        <SkeletonBox width="100%" height={56} borderRadius={BorderRadius.md} />
      </View>

      {/* Recent Orders Skeleton */}
      <View style={styles.section}>
        <SkeletonBox width={130} height={16} style={{ marginBottom: Spacing.sm }} />
        <SkeletonBox width="100%" height={110} borderRadius={BorderRadius.xl} style={{ marginBottom: Spacing.xs }} />
        <SkeletonBox width="100%" height={110} borderRadius={BorderRadius.xl} />
      </View>
    </View>
  );
}

export function OrderListSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map((key) => (
        <View key={key} style={styles.cardSkeleton}>
          <View style={styles.rowBetween}>
            <SkeletonBox width={100} height={18} />
            <SkeletonBox width={70} height={22} borderRadius={BorderRadius.full} />
          </View>
          <SkeletonBox width="70%" height={14} style={{ marginVertical: Spacing.xs }} />
          <SkeletonBox width="45%" height={14} style={{ marginBottom: Spacing.sm }} />
          <View style={styles.rowBetween}>
            <SkeletonBox width={80} height={20} />
            <SkeletonBox width={120} height={36} borderRadius={BorderRadius.md} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ProductListSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((key) => (
        <View key={key} style={styles.productRowSkeleton}>
          <SkeletonBox width={64} height={64} borderRadius={BorderRadius.md} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <SkeletonBox width="70%" height={18} style={{ marginBottom: 6 }} />
            <SkeletonBox width="40%" height={16} style={{ marginBottom: 6 }} />
            <SkeletonBox width="30%" height={12} />
          </View>
          <SkeletonBox width={20} height={20} />
        </View>
      ))}
    </View>
  );
}

export function AnalyticsSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <SkeletonBox width="48%" height={90} borderRadius={BorderRadius.lg} />
        <SkeletonBox width="48%" height={90} borderRadius={BorderRadius.lg} />
      </View>
      <View style={[styles.row, { marginTop: Spacing.xs }]}>
        <SkeletonBox width="48%" height={90} borderRadius={BorderRadius.lg} />
        <SkeletonBox width="48%" height={90} borderRadius={BorderRadius.lg} />
      </View>
      <SkeletonBox width="100%" height={180} borderRadius={BorderRadius.xl} style={{ marginVertical: Spacing.md }} />
      <SkeletonBox width={150} height={18} style={{ marginBottom: Spacing.sm }} />
      <SkeletonBox width="100%" height={60} borderRadius={BorderRadius.md} style={{ marginBottom: Spacing.xs }} />
      <SkeletonBox width="100%" height={60} borderRadius={BorderRadius.md} />
    </View>
  );
}

export function InventorySkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((key) => (
        <View key={key} style={styles.inventoryRowSkeleton}>
          <SkeletonBox width={52} height={52} borderRadius={BorderRadius.md} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <SkeletonBox width="60%" height={16} style={{ marginBottom: 6 }} />
            <SkeletonBox width="35%" height={14} />
          </View>
          <SkeletonBox width={110} height={36} borderRadius={BorderRadius.md} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.border,
  },
  container: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardSkeleton: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productRowSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inventoryRowSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
