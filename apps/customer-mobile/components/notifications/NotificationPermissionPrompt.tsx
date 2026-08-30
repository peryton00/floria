// Floria Customer Mobile — Contextual Notification Permission Prompt
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { useNotifications } from "../../lib/contexts/NotificationContext";
import { NotificationService } from "../../lib/notifications/service";
import { Button } from "../ui/Button";

interface NotificationPermissionPromptProps {
  onDismiss?: () => void;
}

export function NotificationPermissionPrompt({
  onDismiss,
}: NotificationPermissionPromptProps) {
  const { permissionStatus, requestPermissionContextually } = useNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if permission is undetermined / not granted and hasn't been prompted in this context
    if (permissionStatus === "undetermined" || permissionStatus === null) {
      NotificationService.hasBeenPrompted().then((prompted) => {
        if (!prompted) {
          setVisible(true);
        }
      });
    }
  }, [permissionStatus]);

  if (!visible) {
    return null;
  }

  const handleAllow = async () => {
    await requestPermissionContextually();
    setVisible(false);
    onDismiss?.();
  };

  const handleNotNow = async () => {
    await NotificationService.savePreferences({
      ...((await NotificationService.getPreferences()) || {}),
    });
    setVisible(false);
    onDismiss?.();
  };

  return (
    <View style={styles.banner}>
      <View style={styles.iconContainer}>
        <Ionicons name="notifications-outline" size={20} color={Colors.forest} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Stay updated on your plants</Text>
        <Text style={styles.message}>
          Get real-time delivery tracking, order status, and restock alerts.
        </Text>

        <View style={styles.actions}>
          <Button
            label="Allow notifications"
            size="sm"
            onPress={handleAllow}
            style={styles.allowBtn}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleNotNow}
            style={styles.notNowBtn}
          >
            <Text style={styles.notNowText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    backgroundColor: "#F0F5F1",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#D1E3D7",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCEAE0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm + 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: "Georgia",
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 2,
  },
  message: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  allowBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  notNowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  notNowText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
});
