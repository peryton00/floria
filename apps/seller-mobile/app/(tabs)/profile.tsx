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
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { Button } from "../../components/ui/Button";

export default function SellerProfileScreen() {
  const router = useRouter();
  const { seller, signOut } = useSellerAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Store Identity Card */}
      <View style={styles.storeCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(seller?.businessName || "N").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.storeName}>
          {seller?.businessName || "My Botanical Nursery"}
        </Text>
        <Text style={styles.storeEmail}>{seller?.email}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>VERIFIED NURSERY</Text>
          </View>
          <View style={[styles.badge, styles.hyperlocalBadge]}>
            <Text style={[styles.badgeText, styles.hyperlocalText]}>
              HYPERLOCAL DISPATCH
            </Text>
          </View>
        </View>
      </View>

      {/* Operational Policy & Guidelines */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🌿 Operational Guidelines</Text>
        <View style={styles.guidelineItem}>
          <Text style={styles.itemTitle}>1. Rapid Specimen Preparation</Text>
          <Text style={styles.itemDesc}>
            Prepare, inspect, and hydrate plants within 60 minutes of receiving
            orders to ensure fast courier pickup.
          </Text>
        </View>
        <View style={styles.guidelineItem}>
          <Text style={styles.itemTitle}>2. Transit Packaging Standard</Text>
          <Text style={styles.itemDesc}>
            Secure root balls and foliage using biodegradable insulated plant
            wraps before handoff to couriers.
          </Text>
        </View>
        <View style={styles.guidelineItem}>
          <Text style={styles.itemTitle}>3. Stock Reconciliation</Text>
          <Text style={styles.itemDesc}>
            Maintain accurate live counts in Rapid Stock to prevent customer
            overselling.
          </Text>
        </View>
      </View>

      {/* Links & Actions */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Nursery Settings</Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/products" as any)}
          style={styles.actionLink}
        >
          <Text style={styles.linkText}>Manage Botanical Catalog</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/inventory" as any)}
          style={styles.actionLink}
        >
          <Text style={styles.linkText}>Live Inventory Levels</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <Button
        label="Sign Out from Nursery Portal"
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
    backgroundColor: Colors.forest,
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
  guidelineItem: {
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
  },
  itemTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.ink,
  },
  itemDesc: {
    fontSize: 11,
    color: Colors.inkLight,
    lineHeight: 16,
    marginTop: 2,
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
    fontWeight: "600",
    color: Colors.ink,
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
