import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { useCustomerAuth } from "../../lib/contexts/CustomerAuthContext";
import { Button } from "../../components/ui/Button";

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useCustomerAuth();
  const [policyModal, setPolicyModal] = useState<{ title: string; content: string } | null>(null);

  const POLICIES = {
    guarantee: {
      title: "7-Day Plant Health Guarantee",
      content:
        "Every botanical specimen from our verified partner nurseries is hand-inspected, hydrated, and securely packaged in insulated biodegradable carriers. If your plant arrives damaged or unhealthy, we provide an immediate free replacement or full refund within 7 days of delivery.",
    },
    terms: {
      title: "Terms & Conditions",
      content:
        "Floria acts as a curated botanical marketplace connecting patrons with certified artisanal nurseries and local growers. All orders are subject to stock availability and seasonal growing conditions. Prices are inclusive of applicable GST.",
    },
    privacy: {
      title: "Privacy & Data Protection",
      content:
        "Your delivery coordinates, phone number, and purchase records are encrypted and strictly utilized for courier fulfillment and order updates. Floria never sells or shares your personal information with third-party advertisers.",
    },
    returns: {
      title: "Return & Cancellation Policy",
      content:
        "Orders can be cancelled before nursery dispatch with a full refund. As living plants require specialized care, returns after transit are accepted in cases of transit stress, leaf damage, or incorrect specimen delivery.",
    },
  };

  const handleContactSupport = () => {
    Alert.alert(
      "Floria Customer Care",
      "Connect with our botanical support team for order inquiries, plant care advice, or nursery assistance.",
      [
        {
          text: "Email Support",
          onPress: () => Linking.openURL("mailto:support@floria.in?subject=Floria%20Customer%20Inquiry"),
        },
        {
          text: "Helpline",
          onPress: () => Linking.openURL("tel:+918000000000"),
        },
        { text: "Close", style: "cancel" },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of Floria?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Header Profile Banner */}
      {isAuthenticated ? (
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.fullName || user?.email || "P").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.fullName || "Botanical Patron"}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email}
            </Text>
            {user?.phone && (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={11} color={Colors.inkMuted} />
                <Text style={styles.userPhone}>{user.phone}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push("/addresses" as any)}
            style={styles.editProfileBtn}
          >
            <Ionicons name="pencil-outline" size={16} color={Colors.forest} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.guestCard}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="person-outline" size={24} color={Colors.forest} />
          </View>
          <View style={styles.guestTextCol}>
            <Text style={styles.guestTitle}>Welcome to Floria</Text>
            <Text style={styles.guestSub}>Sign in to track orders, saved addresses & wishlist</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/login" as any)}
            style={styles.guestLoginBtn}
          >
            <Text style={styles.guestLoginText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Flipkart-Style 2x2 Quick Action Cards */}
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => (isAuthenticated ? router.push("/orders" as any) : router.push("/(auth)/login" as any))}
          style={styles.quickActionCard}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="cube-outline" size={20} color={Colors.forest} />
          </View>
          <Text style={styles.quickActionLabel}>Orders</Text>
          <Text style={styles.quickActionSub}>Track & history</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/(tabs)/wishlist" as any)}
          style={styles.quickActionCard}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="heart-outline" size={20} color={Colors.terracotta} />
          </View>
          <Text style={styles.quickActionLabel}>Wishlist</Text>
          <Text style={styles.quickActionSub}>Saved plants</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => (isAuthenticated ? router.push("/addresses" as any) : router.push("/(auth)/login" as any))}
          style={styles.quickActionCard}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="location-outline" size={20} color={Colors.forest} />
          </View>
          <Text style={styles.quickActionLabel}>Addresses</Text>
          <Text style={styles.quickActionSub}>Manage delivery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleContactSupport}
          style={styles.quickActionCard}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="help-buoy-outline" size={20} color={Colors.forest} />
          </View>
          <Text style={styles.quickActionLabel}>Help & Support</Text>
          <Text style={styles.quickActionSub}>Care & service</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Account Settings Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>Account Settings</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => (isAuthenticated ? router.push("/addresses" as any) : router.push("/(auth)/login" as any))}
          style={styles.menuRow}
        >
          <Ionicons name="map-outline" size={18} color={Colors.forest} style={styles.menuRowIcon} />
          <View style={styles.menuRowTextCol}>
            <Text style={styles.menuRowTitle}>Saved Delivery Addresses</Text>
            <Text style={styles.menuRowSub}>Raipur & registered destinations</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/explore" as any)}
          style={styles.menuRow}
        >
          <Ionicons name="leaf-outline" size={18} color={Colors.forest} style={styles.menuRowIcon} />
          <View style={styles.menuRowTextCol}>
            <Text style={styles.menuRowTitle}>Explore Partner Nurseries</Text>
            <Text style={styles.menuRowSub}>Certified local grower network</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} />
        </TouchableOpacity>
      </View>

      {/* 4. Floria Policies & Trust Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>Floria Policies & Trust</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPolicyModal(POLICIES.guarantee)}
          style={styles.menuRow}
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.forest} style={styles.menuRowIcon} />
          <View style={styles.menuRowTextCol}>
            <Text style={styles.menuRowTitle}>7-Day Plant Health Guarantee</Text>
            <Text style={styles.menuRowSub}>Transit protection & healthy root promise</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPolicyModal(POLICIES.terms)}
          style={styles.menuRow}
        >
          <Ionicons name="document-text-outline" size={18} color={Colors.forest} style={styles.menuRowIcon} />
          <View style={styles.menuRowTextCol}>
            <Text style={styles.menuRowTitle}>Terms & Conditions (T&C)</Text>
            <Text style={styles.menuRowSub}>Marketplace rules and guidelines</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPolicyModal(POLICIES.privacy)}
          style={styles.menuRow}
        >
          <Ionicons name="lock-closed-outline" size={18} color={Colors.forest} style={styles.menuRowIcon} />
          <View style={styles.menuRowTextCol}>
            <Text style={styles.menuRowTitle}>Privacy Policy</Text>
            <Text style={styles.menuRowSub}>Data protection & privacy commitment</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPolicyModal(POLICIES.returns)}
          style={styles.menuRow}
        >
          <Ionicons name="swap-horizontal-outline" size={18} color={Colors.forest} style={styles.menuRowIcon} />
          <View style={styles.menuRowTextCol}>
            <Text style={styles.menuRowTitle}>Cancellation & Return Policy</Text>
            <Text style={styles.menuRowSub}>Hassle-free cancellation before dispatch</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleContactSupport}
          style={[styles.menuRow, { borderBottomWidth: 0 }]}
        >
          <Ionicons name="chatbubbles-outline" size={18} color={Colors.forest} style={styles.menuRowIcon} />
          <View style={styles.menuRowTextCol}>
            <Text style={styles.menuRowTitle}>Contact Floria Support</Text>
            <Text style={styles.menuRowSub}>Dedicated email helpline & resolution</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} />
        </TouchableOpacity>
      </View>

      {/* 5. Sign Out Button & Version */}
      {isAuthenticated && (
        <Button
          label="Sign Out"
          variant="outline"
          onPress={handleSignOut}
          style={styles.signOutBtn}
        />
      )}

      <View style={styles.footerInfo}>
        <Text style={styles.versionText}>Floria Plant Marketplace • Version 0.1.0</Text>
        <Text style={styles.copyrightText}>Hand-grown with care for mindful sanctuaries</Text>
      </View>

      {/* Policy Reader Modal */}
      <Modal
        visible={policyModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPolicyModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{policyModal?.title}</Text>
              <TouchableOpacity
                onPress={() => setPolicyModal(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={Colors.inkLight} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBody}>{policyModal?.content}</Text>
            <Button
              label="Understand & Close"
              size="sm"
              onPress={() => setPolicyModal(null)}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </View>
      </Modal>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.white,
    fontWeight: "bold",
    fontSize: Typography.fontSizes.lg,
    fontFamily: "Georgia",
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.ink,
  },
  userEmail: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  userPhone: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
  },
  editProfileBtn: {
    padding: Spacing.xs,
  },
  guestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  guestIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.botanical,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  guestTextCol: {
    flex: 1,
  },
  guestTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  guestSub: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  guestLoginBtn: {
    backgroundColor: Colors.forest,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  guestLoginText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickActionCard: {
    width: "48.5%",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.page,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  quickActionLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  quickActionSub: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: Colors.inkLight,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuRowIcon: {
    marginRight: Spacing.sm,
  },
  menuRowTextCol: {
    flex: 1,
  },
  menuRowTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600",
    color: Colors.ink,
  },
  menuRowSub: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  signOutBtn: {
    marginBottom: Spacing.md,
  },
  footerInfo: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  versionText: {
    fontSize: 11,
    color: Colors.inkMuted,
    fontWeight: "600",
  },
  copyrightText: {
    fontSize: 10,
    color: Colors.inkSubtle,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    backgroundColor: Colors.page,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkLight,
    lineHeight: 20,
  },
});
