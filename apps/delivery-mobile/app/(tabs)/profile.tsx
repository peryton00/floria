// Floria Delivery Mobile — Courier Profile Screen Shell (Step 5B.2)
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useDeliveryAuth } from "../../lib/contexts/DeliveryAuthContext";
import { theme } from "../../lib/theme";
import { Card, Button } from "../../components/ui";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, role, signOut } = useDeliveryAuth();
  const [onDuty, setOnDuty] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out of Dispatch",
      "Are you sure you want to sign out? You will stop receiving operational route notifications until you log in again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              setSigningOut(true);
              await signOut();
              router.replace("/(auth)/login");
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to sign out.");
            } finally {
              setSigningOut(false);
            }
          },
        },
      ],
    );
  };

  const initial = (user?.email?.[0] || "C").toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Driver Identity Card */}
      <Card style={styles.profileCard} variant="elevated">
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <Text style={styles.userName}>
          {user?.email || "courier@floria.in"}
        </Text>

        <View style={styles.roleBadge}>
          <MaterialIcons
            name="verified-user"
            size={12}
            color={theme.colors.forest}
          />
          <Text style={styles.roleText}>
            {(role || "OPERATIONS").toUpperCase()} COURIER
          </Text>
        </View>
      </Card>

      {/* Dispatch Settings Card */}
      <Text style={styles.sectionTitle}>OPERATIONAL STATUS</Text>
      <Card style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Dispatch Duty</Text>
            <Text style={styles.settingSubtitle}>
              {onDuty
                ? "Active — Available for new nursery pickups"
                : "Off Duty — Route paused"}
            </Text>
          </View>
          <Switch
            value={onDuty}
            onValueChange={setOnDuty}
            trackColor={{
              false: theme.colors.divider,
              true: theme.colors.forest,
            }}
            thumbColor={theme.colors.white}
            accessibilityLabel="Toggle dispatch duty status"
          />
        </View>
      </Card>

      {/* System Information Card */}
      <Text style={styles.sectionTitle}>APPLICATION INFORMATION</Text>
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platform</Text>
          <Text style={styles.infoValue}>Floria Operations Mobile v0.1.0</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Architecture</Text>
          <Text style={styles.infoValue}>
            Express REST + Supabase PostgreSQL
          </Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Regional Hub</Text>
          <Text style={styles.infoValue}>Bengaluru South Nursery Cluster</Text>
        </View>
      </Card>

      {/* Sign Out Button */}
      <Button
        label="SIGN OUT OF DISPATCH"
        onPress={handleSignOut}
        variant="danger"
        size="md"
        loading={signingOut}
        disabled={signingOut}
        style={styles.signOutButton}
        icon={
          <MaterialIcons
            name="logout"
            size={16}
            color={theme.colors.terracotta}
          />
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  profileCard: {
    alignItems: "center",
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.white,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.xs,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.botanicalGreen,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.xs,
    gap: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.forest,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    ...theme.typography.sectionLabel,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  settingsCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingTextGroup: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.charcoal,
  },
  settingSubtitle: {
    ...theme.typography.caption,
    marginTop: 2,
  },
  infoCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
  },
  infoLabel: {
    ...theme.typography.caption,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.charcoal,
  },
  infoDivider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.sm,
  },
  signOutButton: {
    marginTop: theme.spacing.sm,
  },
});
