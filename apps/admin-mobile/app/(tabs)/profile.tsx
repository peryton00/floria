import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { useAdminAuth } from "../../lib/contexts/AdminAuthContext";
import { Button } from "../../components/ui/Button";

export default function AdminProfileScreen() {
  const router = useRouter();
  const { admin, signOut } = useAdminAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Admin Identity Card */}
      <View style={styles.storeCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(admin?.fullName || "A").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.storeName}>
          {admin?.fullName || "Platform Administrator"}
        </Text>
        <Text style={styles.storeEmail}>{admin?.email}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              RBAC: {admin?.role?.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.badge, styles.hyperlocalBadge]}>
            <Text style={[styles.badgeText, styles.hyperlocalText]}>
              ROOT AUTHORITY
            </Text>
          </View>
        </View>
      </View>

      {/* Audit Trail & Settings Links */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>System Governance</Text>
        <TouchableOpacity
          onPress={() => router.push("/audit-logs" as any)}
          style={styles.actionLink}
        >
          <View>
            <Text style={styles.linkText}>📜 Immutable Audit Logs</Text>
            <Text style={styles.linkSub}>
              Inspect administrative actions and mutation history
            </Text>
          </View>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/approvals" as any)}
          style={styles.actionLink}
        >
          <View>
            <Text style={styles.linkText}>🏪 Partner Nursery Compliance</Text>
            <Text style={styles.linkSub}>
              Verify KYC, trade licenses, and nursery locations
            </Text>
          </View>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/moderation" as any)}
          style={styles.actionLink}
        >
          <View>
            <Text style={styles.linkText}>🌿 Plant Catalog Standards</Text>
            <Text style={styles.linkSub}>
              Botanical nomenclature, price limits, and imagery
            </Text>
          </View>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <Button
        label="Sign Out from Governance"
        variant="outline"
        onPress={signOut}
        style={styles.signOutBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  storeCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.forestDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xxl,
    fontWeight: "bold",
    fontFamily: "Georgia",
  },
  storeName: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    textAlign: "center",
  },
  storeEmail: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.botanical,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  hyperlocalBadge: {
    backgroundColor: Colors.terracottaLight + "20",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: Colors.forestDark,
  },
  hyperlocalText: {
    color: Colors.terracottaDark,
  },
  sectionCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: Spacing.xs,
  },
  actionLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  linkText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.ink,
  },
  linkSub: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  linkArrow: {
    fontSize: 14,
    color: Colors.inkMuted,
  },
  signOutBtn: {
    borderColor: Colors.error,
    marginTop: Spacing.sm,
  },
});
