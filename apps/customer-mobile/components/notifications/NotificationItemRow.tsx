// Floria Customer Mobile — Notification Item Row Component
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import type { FloriaNotificationItem, NotificationCategory } from "../../lib/notifications/types";
import { PressableScale } from "../ui/PressableScale";
import { MotionTokens } from "../../lib/motion";

interface NotificationItemRowProps {
  item: FloriaNotificationItem;
  onPress: (item: FloriaNotificationItem) => void;
  onDelete?: (id: string) => void;
}

function getCategoryIcon(category: NotificationCategory): {
  name: any;
  color: string;
  bgColor: string;
} {
  switch (category) {
    case "ORDER":
      return { name: "bag-check-outline", color: Colors.forest, bgColor: "#E6EFE9" };
    case "DELIVERY":
      return { name: "bicycle-outline", color: "#15803D", bgColor: "#EAF5EE" };
    case "PAYMENT":
      return { name: "card-outline", color: Colors.terracotta, bgColor: "#FDF0EC" };
    case "WISHLIST":
      return { name: "heart-outline", color: Colors.terracotta, bgColor: "#FDF0EC" };
    case "PRODUCT":
      return { name: "leaf-outline", color: Colors.forest, bgColor: "#E6EFE9" };
    case "ACCOUNT":
      return { name: "shield-checkmark-outline", color: "#1E3A8A", bgColor: "#EFF6FF" };
    case "PROMOTION":
      return { name: "sparkles-outline", color: "#B45309", bgColor: "#FEF3C7" };
    case "SYSTEM":
    default:
      return { name: "information-circle-outline", color: Colors.inkLight, bgColor: Colors.sand };
  }
}

export function NotificationItemRow({ item, onPress }: NotificationItemRowProps) {
  const iconConfig = getCategoryIcon(item.category);
  const isUnread = !item.isRead;

  const accessibleLabel = `${isUnread ? "Unread notification" : "Read notification"}: ${item.title}. ${item.message}. Received ${item.timeAgo}.`;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibleLabel}
      onPress={() => onPress(item)}
      targetScale={MotionTokens.scale.pressed}
      style={[
        styles.container,
        isUnread ? styles.containerUnread : styles.containerRead,
      ]}
    >
      {/* Category Icon Badge */}
      <View style={[styles.iconContainer, { backgroundColor: iconConfig.bgColor }]}>
        <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
      </View>

      {/* Notification Text Area */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text
            style={[styles.title, isUnread ? styles.titleUnread : styles.titleRead]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.timeAgo}>{item.timeAgo}</Text>
        </View>

        <Text
          style={[styles.message, isUnread ? styles.messageUnread : styles.messageRead]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
      </View>

      {/* Unread Accent Indicator Dot */}
      {isUnread && (
        <View style={styles.unreadDotContainer}>
          <View style={styles.unreadDot} />
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.xs + 2,
    borderWidth: 1,
  },
  containerUnread: {
    backgroundColor: Colors.linen,
    borderColor: Colors.border,
  },
  containerRead: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    opacity: 0.85,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm + 2,
    marginTop: 2,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  title: {
    fontFamily: "Georgia",
    fontSize: Typography.fontSizes.sm,
    flex: 1,
    paddingRight: Spacing.xs,
  },
  titleUnread: {
    fontWeight: "bold",
    color: Colors.ink,
  },
  titleRead: {
    fontWeight: "600",
    color: Colors.inkLight,
  },
  timeAgo: {
    fontSize: 10,
    color: Colors.inkMuted,
    fontWeight: "500",
  },
  message: {
    fontSize: Typography.fontSizes.xs,
    lineHeight: 17,
  },
  messageUnread: {
    color: Colors.ink,
  },
  messageRead: {
    color: Colors.inkMuted,
  },
  unreadDotContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.xs,
    paddingTop: 4,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.terracotta,
  },
});
