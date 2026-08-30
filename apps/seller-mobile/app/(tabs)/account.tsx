import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";

export default function SellerAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller, signOut } = useSellerAuth();
  const { confirmAction } = useSellerFeedback();

  const isVerified = seller?.status === "approved";
  const logoUrl = seller?.logoUrl || "/floria-logo.png";

  const handleLogout = () => {
    confirmAction({
      title: "Sign Out",
      message: "Are you sure you want to sign out of your nursery account?",
      confirmText: "Sign Out",
      isDestructive: true,
      onConfirm: async () => {
        await signOut();
        router.replace("/(auth)/login" as any);
      },
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Nursery Profile Card ── */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri: logoUrl.startsWith("http")
                ? logoUrl
                : "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=200",
            }}
            style={styles.nurseryLogo}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.nurseryName} numberOfLines={1}>
              {seller?.businessName || "Green Leaf Nursery"}
            </Text>
            <View style={styles.verificationBadge}>
              <Ionicons
                name={isVerified ? "checkmark-circle" : "time-outline"}
                size={14}
                color={isVerified ? Colors.success : Colors.warning}
              />
              <Text
                style={[
                  styles.verificationText,
                  { color: isVerified ? Colors.success : Colors.warning },
                ]}
              >
                {isVerified ? "Verified Partner ✓" : "Pending Verification"}
              </Text>
            </View>
            <Text style={styles.nurseryEmail}>{seller?.email}</Text>
          </View>
        </View>

        {/* ── Section 1: Business Profile ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Business Profile</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/onboarding" as any)}
              style={styles.menuRow}
            >
              <View style={styles.iconWrap}>
                <Ionicons name="business-outline" size={20} color={Colors.forest} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Nursery Details</Text>
                <Text style={styles.menuSubtitle}>Location, contact & business info</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/account/hours" as any)}
              style={[styles.menuRow, styles.lastRow]}
            >
              <View style={styles.iconWrap}>
                <Ionicons name="time-outline" size={20} color={Colors.forest} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Operating Hours</Text>
                <Text style={styles.menuSubtitle}>Set daily open & closing times</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section 2: Payments & Settlements ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Payments & Settlements</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/account/settlements" as any)}
              style={styles.menuRow}
            >
              <View style={styles.iconWrap}>
                <Ionicons name="card-outline" size={20} color={Colors.forest} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Settlement Account</Text>
                <Text style={styles.menuSubtitle}>Cashfree linked account & KYC status</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/account/settlements" as any)}
              style={[styles.menuRow, styles.lastRow]}
            >
              <View style={styles.iconWrap}>
                <Ionicons name="wallet-outline" size={20} color={Colors.forest} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Transaction History</Text>
                <Text style={styles.menuSubtitle}>Payouts, deductions & transfers</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section 3: Notifications ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Notifications</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/account/notifications" as any)}
              style={[styles.menuRow, styles.lastRow]}
            >
              <View style={styles.iconWrap}>
                <Ionicons name="notifications-outline" size={20} color={Colors.forest} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Notification Preferences</Text>
                <Text style={styles.menuSubtitle}>Orders, stock alerts & payout chimes</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section 4: Support & Policies ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Support & Policies</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {}}
              style={styles.menuRow}
            >
              <View style={styles.iconWrap}>
                <Ionicons name="help-buoy-outline" size={20} color={Colors.forest} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Help Center</Text>
                <Text style={styles.menuSubtitle}>Seller documentation & support contact</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {}}
              style={[styles.menuRow, styles.lastRow]}
            >
              <View style={styles.iconWrap}>
                <Ionicons name="document-text-outline" size={20} color={Colors.forest} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Terms & Policies</Text>
                <Text style={styles.menuSubtitle}>Floria partner agreement & quality guidelines</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Logout Button ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out of Nursery</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  topBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.page,
  },
  pageTitle: {
    fontSize: Typography.fontSizes.lg,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.forest,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  nurseryLogo: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.sand,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nurseryName: {
    fontSize: Typography.fontSizes.base,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.ink,
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginVertical: 3,
  },
  verificationText: {
    fontSize: 11,
    fontWeight: "700",
  },
  nurseryEmail: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  menuGroup: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.botanical,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  menuSubtitle: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.errorBg,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: 8,
    marginTop: Spacing.sm,
  },
  logoutText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.error,
  },
});
