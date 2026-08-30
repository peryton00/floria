// Floria Customer Mobile — Notification Skeleton Loader
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Colors, Spacing, BorderRadius } from "../../lib/theme";

export function NotificationSkeleton({ count = 5 }: { count?: number }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.row}>
          <Animated.View style={[styles.avatarSkeleton, { opacity: pulseAnim }]} />
          <View style={styles.content}>
            <View style={styles.topRow}>
              <Animated.View
                style={[
                  styles.titleSkeleton,
                  { width: index % 2 === 0 ? "55%" : "70%", opacity: pulseAnim },
                ]}
              />
              <Animated.View style={[styles.timeSkeleton, { opacity: pulseAnim }]} />
            </View>
            <Animated.View style={[styles.bodySkeleton, { opacity: pulseAnim }]} />
            <Animated.View
              style={[
                styles.bodySkeletonShort,
                { width: index % 2 === 0 ? "40%" : "60%", opacity: pulseAnim },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.xs + 2,
  },
  avatarSkeleton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.sand,
    marginRight: Spacing.sm + 2,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  titleSkeleton: {
    height: 14,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.sand,
  },
  timeSkeleton: {
    width: 40,
    height: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.sand,
  },
  bodySkeleton: {
    height: 11,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.sand,
    width: "90%",
    marginBottom: 5,
  },
  bodySkeletonShort: {
    height: 11,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.sand,
  },
});
