import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSellerNotifications } from "../../lib/contexts/SellerNotificationContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatDate } from "../../lib/format";
import { EmptyState } from "../../components/ui/EmptyState";
import { SellerNotificationItem } from "../../lib/notifications/types";

export default function SellerNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    handleNotificationNavigation,
  } = useSellerNotifications();

  const [filterUnread, setFilterUnread] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const filteredNotifications = filterUnread
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ORDER":
        return { name: "receipt-outline" as const, color: Colors.forest, bg: Colors.botanical };
      case "INVENTORY":
        return { name: "alert-circle-outline" as const, color: Colors.warning, bg: Colors.warningBg };
      case "SETTLEMENT":
        return { name: "wallet-outline" as const, color: Colors.success, bg: Colors.successBg };
      case "ACCOUNT":
        return { name: "business-outline" as const, color: Colors.forestDark, bg: Colors.sand };
      default:
        return { name: "notifications-outline" as const, color: Colors.ink, bg: Colors.linen };
    }
  };

  const renderNotificationItem = ({ item }: { item: SellerNotificationItem }) => {
    const iconConfig = getCategoryIcon(item.category);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleNotificationNavigation(item)}
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconConfig.bg }]}>
          <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, !item.isRead && styles.unreadTitle]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>

          <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {/* ── Subheader Controls ── */}
      <View style={styles.controlBar}>
        <View style={styles.filterToggle}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilterUnread(false)}
            style={[styles.toggleBtn, !filterUnread && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, !filterUnread && styles.toggleTextActive]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilterUnread(true)}
            style={[styles.toggleBtn, filterUnread && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, filterUnread && styles.toggleTextActive]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Notification List ── */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.forest}
            colors={[Colors.forest]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title={filterUnread ? "No unread notifications" : "All caught up"}
            description={
              filterUnread
                ? "You have read all actionable alerts."
                : "Operational alerts for orders, inventory, and settlements will appear here."
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  controlBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.page,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterToggle: {
    flexDirection: "row",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  toggleBtnActive: {
    backgroundColor: Colors.forest,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
  toggleTextActive: {
    color: Colors.white,
    fontWeight: "700",
  },
  markAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
  },
  listContent: {
    padding: Spacing.md,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  unreadCard: {
    borderColor: Colors.forest,
    backgroundColor: "#F4F7F4",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  contentWrap: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600",
    color: Colors.ink,
  },
  unreadTitle: {
    fontWeight: "bold",
    color: Colors.forestDark,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.terracotta,
    marginLeft: 6,
  },
  message: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
    lineHeight: 18,
    marginTop: 2,
  },
  timeText: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 4,
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
});
