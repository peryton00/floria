// Floria Customer Mobile — Notification Center Screen
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { useNotifications } from "../../lib/contexts/NotificationContext";
import { NotificationItemRow } from "../../components/notifications/NotificationItemRow";
import { NotificationSkeleton } from "../../components/notifications/NotificationSkeleton";
import { NotificationPermissionPrompt } from "../../components/notifications/NotificationPermissionPrompt";
import { PressableScale } from "../../components/ui/PressableScale";
import { Button } from "../../components/ui/Button";
import { MotionTokens } from "../../lib/motion";
import { haptics } from "../../lib/haptics";
import type { NotificationCategory } from "../../lib/notifications/types";

type FilterTab = "ALL" | "ORDERS" | "WISHLIST" | "UPDATES";

export default function NotificationCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    error,
    hasMore,
    markAllAsRead,
    refreshNotifications,
    loadMoreNotifications,
    openNotification,
    deleteNotification,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "ALL") return notifications;
    if (activeFilter === "ORDERS") {
      return notifications.filter(
        (n) => n.category === "ORDER" || n.category === "DELIVERY" || n.category === "PAYMENT",
      );
    }
    if (activeFilter === "WISHLIST") {
      return notifications.filter((n) => n.category === "WISHLIST");
    }
    if (activeFilter === "UPDATES") {
      return notifications.filter(
        (n) => n.category === "PRODUCT" || n.category === "PROMOTION" || n.category === "ACCOUNT" || n.category === "SYSTEM",
      );
    }
    return notifications;
  }, [notifications, activeFilter]);

  const handleFilterChange = (filter: FilterTab) => {
    haptics.selection();
    setActiveFilter(filter);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 1. Header Bar */}
      <View style={styles.header}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          targetScale={MotionTokens.scale.pressedCompact}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.ink} />
        </PressableScale>

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
            accessibilityHint="Marks all current unread notifications as read"
            onPress={markAllAsRead}
            targetScale={MotionTokens.scale.pressedCompact}
            style={styles.markAllReadBtn}
          >
            <Ionicons name="checkmark-done" size={20} color={Colors.forest} />
          </PressableScale>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      {/* 2. Category Filter Pills */}
      <View style={styles.filtersWrapper}>
        {(["ALL", "ORDERS", "WISHLIST", "UPDATES"] as FilterTab[]).map((tab) => {
          const isSelected = activeFilter === tab;
          const label =
            tab === "ALL"
              ? "All"
              : tab === "ORDERS"
              ? "Orders & Delivery"
              : tab === "WISHLIST"
              ? "Wishlist"
              : "Updates";

          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.7}
              onPress={() => handleFilterChange(tab)}
              style={[
                styles.filterChip,
                isSelected && styles.filterChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Contextual Permission Prompt */}
      <NotificationPermissionPrompt />

      {/* 4. Notifications List / Loading / Error / Empty States */}
      {loading && !refreshing && notifications.length === 0 ? (
        <NotificationSkeleton count={6} />
      ) : error && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={42} color={Colors.terracotta} />
          <Text style={styles.errorTitle}>Couldn't load notifications</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <Button
            label="Try again"
            variant="outline"
            size="sm"
            onPress={refreshNotifications}
            style={styles.retryBtn}
          />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="leaf-outline" size={32} color={Colors.forest} />
          </View>
          <Text style={styles.emptyTitle}>You're all caught up</Text>
          <Text style={styles.emptySub}>
            New updates will appear here when there's something to share.
          </Text>
          <Button
            label="Continue Exploring"
            variant="outline"
            size="sm"
            onPress={() => router.push("/(tabs)/explore" as any)}
            style={styles.exploreBtn}
          />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItemRow
              item={item}
              onPress={openNotification}
              onDelete={deleteNotification}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.lg },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshNotifications}
              tintColor={Colors.forest}
              colors={[Colors.forest]}
            />
          }
          onEndReached={loadMoreNotifications}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerLoader}>
                <NotificationSkeleton count={2} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.page,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerTitle: {
    fontFamily: "Georgia",
    fontSize: 17,
    fontWeight: "bold",
    color: Colors.ink,
  },
  unreadCountBadge: {
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.full,
  },
  unreadCountText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  markAllReadBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerPlaceholder: {
    width: 36,
  },
  filtersWrapper: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 4,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.sand,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipSelected: {
    backgroundColor: "#E6EFE9",
    borderColor: Colors.forest,
  },
  filterChipText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "500",
    color: Colors.inkLight,
  },
  filterChipTextSelected: {
    color: Colors.forest,
    fontWeight: "700",
  },
  listContent: {
    paddingTop: Spacing.xs,
  },
  footerLoader: {
    paddingVertical: Spacing.xs,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EBF3EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontFamily: "Georgia",
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: Spacing.xs,
  },
  emptySub: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkLight,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  exploreBtn: {
    minWidth: 160,
  },
  errorTitle: {
    fontFamily: "Georgia",
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    color: Colors.ink,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  errorSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  retryBtn: {
    minWidth: 120,
  },
});
