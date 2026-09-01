// Floria Customer Mobile — Notification Bell Header Action
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Bell } from "phosphor-react-native";
import { Colors, Typography, BorderRadius } from "../../lib/theme";
import { useNotifications } from "../../lib/contexts/NotificationContext";
import { PressableScale } from "../ui/PressableScale";
import { MotionTokens } from "../../lib/motion";

interface NotificationBellProps {
  size?: number;
  color?: string;
}

export function NotificationBell({
  size = 22,
  color = Colors.forest,
}: NotificationBellProps) {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const badgeText = unreadCount > 9 ? "9+" : String(unreadCount);
  const accessibilityLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Notifications";

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens notification center with your latest plant updates"
      onPress={() => router.push("/notifications" as any)}
      targetScale={MotionTokens.scale.pressedCompact}
      style={styles.bellButton}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Bell size={size} color={color} weight="regular" />
      {unreadCount > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeContainer: {
    position: "absolute",
    top: 4,
    right: 3,
    backgroundColor: Colors.terracotta,
    minWidth: 16,
    height: 16,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.page,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 11,
  },
});
