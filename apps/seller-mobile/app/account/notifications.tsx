import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../lib/api";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { Button } from "../../components/ui/Button";

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useSellerFeedback();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [orderAlerts, setOrderAlerts] = useState<boolean>(true);
  const [inventoryAlerts, setInventoryAlerts] = useState<boolean>(true);
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [securityAlerts] = useState<boolean>(true); // Essential, locked

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSellerNotificationSettings();
      if (res.success && res.data) {
        setOrderAlerts(res.data.new_order_notifications ?? true);
        setInventoryAlerts(res.data.low_stock_notifications ?? true);
        setEmailAlerts(res.data.email_notifications ?? true);
      }
    } catch (err) {
      console.warn("[NotificationSettings] Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.updateSellerNotificationSettings({
        new_order_notifications: orderAlerts,
        low_stock_notifications: inventoryAlerts,
        email_notifications: emailAlerts,
      });
      if (res.success) {
        showSuccess("Notification preferences updated.");
      } else {
        showError(res.error?.message || "Failed to update preferences.");
      }
    } catch (err: any) {
      showError(err.message || "Failed to update preferences.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={Colors.forest} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
      >
        <Text style={styles.headerSub}>
          Control which operational events trigger sound notifications and push alerts on your mobile device.
        </Text>

        <View style={styles.card}>
          {/* Orders */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Customer Orders</Text>
              <Text style={styles.settingDesc}>
                Instant notifications when new orders are placed and ready for dispatch.
              </Text>
            </View>
            <Switch
              value={orderAlerts}
              onValueChange={setOrderAlerts}
              trackColor={{ false: Colors.sand, true: Colors.forest }}
              thumbColor={Colors.white}
            />
          </View>

          {/* Inventory */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Low Stock & Inventory</Text>
              <Text style={styles.settingDesc}>
                Alerts when plant stock reaches low thresholds or runs out.
              </Text>
            </View>
            <Switch
              value={inventoryAlerts}
              onValueChange={setInventoryAlerts}
              trackColor={{ false: Colors.sand, true: Colors.forest }}
              thumbColor={Colors.white}
            />
          </View>

          {/* Email Digest */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Email Summary & Settlement Alerts</Text>
              <Text style={styles.settingDesc}>
                Daily order summaries and payout deposit confirmations via email.
              </Text>
            </View>
            <Switch
              value={emailAlerts}
              onValueChange={setEmailAlerts}
              trackColor={{ false: Colors.sand, true: Colors.forest }}
              thumbColor={Colors.white}
            />
          </View>

          {/* Account Security (Locked) */}
          <View style={[styles.settingRow, styles.lastRow]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Account & Security Alerts</Text>
              <Text style={styles.settingDesc}>
                Critical partner policy, verification updates, and security events (always enabled).
              </Text>
            </View>
            <Switch
              value={securityAlerts}
              disabled
              trackColor={{ false: Colors.sand, true: Colors.forest }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label="Save Preferences"
          variant="primary"
          size="lg"
          loading={saving}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.page,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  headerSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  settingTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  settingDesc: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.linen,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
});
