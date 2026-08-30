import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Linking,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { useCustomerAuth } from "../../lib/contexts/CustomerAuthContext";
import { useNotifications } from "../../lib/contexts/NotificationContext";
import { useFeedback } from "../../lib/contexts/FloriaFeedbackContext";
import { haptics } from "../../lib/haptics";
import { Button } from "../../components/ui/Button";
import { useActionLock } from "../../lib/hooks/useActionLock";

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, signOut, refreshProfile } = useCustomerAuth();
  const { preferences, updatePreference } = useNotifications();
  const { showSuccess, showError, showConfirmSheet } = useFeedback();
  const { isLocked, runExclusive } = useActionLock();
  const [policyModal, setPolicyModal] = useState<{ title: string; content: string } | null>(null);

  // Edit Profile Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

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

  const handleOpenEditProfile = () => {
    setEditFullName(user?.fullName || "");
    setEditPhone(user?.phone || "");
    setEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    if (!editFullName.trim()) {
      showError("Please enter your full name.");
      return;
    }
    runExclusive(async () => {
      try {
        setUpdatingProfile(true);
        const res = await api.updateProfile({
          full_name: editFullName.trim(),
          phone: editPhone.trim(),
        });
        if (res.success) {
          await refreshProfile();
          setEditModalVisible(false);
          haptics.success();
          showSuccess("Profile details saved");
        } else {
          haptics.error();
          showError(res.error?.message || "Failed to update profile.");
        }
      } catch (err: any) {
        haptics.error();
        showError(err.message || "Failed to update profile.");
      } finally {
        setUpdatingProfile(false);
      }
    });
  };

  const handleContactSupport = () => {
    showConfirmSheet({
      title: "Floria Customer Support",
      message: "Connect with our botanical support team for order inquiries, plant care advice, or nursery assistance.",
      icon: "chatbubble-ellipses-outline",
      confirmLabel: "Email Support",
      cancelLabel: "Close",
      onConfirm: () => {
        Linking.openURL("mailto:support@floria.in?subject=Floria%20Customer%20Inquiry");
      },
    });
  };

  const handleSignOut = () => {
    showConfirmSheet({
      title: "Sign Out",
      message: "Are you sure you want to sign out of your Floria botanical account?",
      icon: "log-out-outline",
      confirmLabel: "Sign Out",
      cancelLabel: "Stay Signed In",
      isDestructive: true,
      onConfirm: async () => {
        await signOut();
        haptics.light();
        showSuccess("Signed out successfully");
      },
    });
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
          {/* Pencil Icon opens Profile Edit */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenEditProfile}
            style={styles.editProfileBtn}
          >
            <Ionicons name="pencil" size={15} color={Colors.forest} />
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

      {/* 2. Quick Action Cards */}
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

        {isAuthenticated && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenEditProfile}
            style={styles.menuRow}
          >
            <Ionicons name="person-outline" size={18} color={Colors.forest} style={styles.menuRowIcon} />
            <View style={styles.menuRowTextCol}>
              <Text style={styles.menuRowTitle}>Personal Information</Text>
              <Text style={styles.menuRowSub}>Update full name & phone number</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => (isAuthenticated ? router.push("/addresses" as any) : router.push("/(auth)/login" as any))}
          style={styles.menuRow}
        >
          <Ionicons name="map-outline" size={18} color={Colors.forest} style={styles.menuRowIcon} />
          <View style={styles.menuRowTextCol}>
            <Text style={styles.menuRowTitle}>Saved Delivery Addresses</Text>
            <Text style={styles.menuRowSub}>Manage residential & sanctuary destinations</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setNotificationModalVisible(true)}
          style={styles.menuRow}
        >
          <Ionicons name="notifications-outline" size={18} color={Colors.forest} style={styles.menuRowIcon} />
          <View style={styles.menuRowTextCol}>
            <Text style={styles.menuRowTitle}>Notification Preferences</Text>
            <Text style={styles.menuRowSub}>Order alerts, restock updates & discovery</Text>
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
            <Text style={styles.menuRowTitle}>Terms of Botanical Service</Text>
            <Text style={styles.menuRowSub}>Marketplace rules & quality standards</Text>
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
            <Text style={styles.menuRowTitle}>Privacy & Data Protection</Text>
            <Text style={styles.menuRowSub}>Encrypted courier routing & records</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPolicyModal(POLICIES.returns)}
          style={styles.menuRow}
        >
          <Ionicons name="refresh-outline" size={18} color={Colors.forest} style={styles.menuRowIcon} />
          <View style={styles.menuRowTextCol}>
            <Text style={styles.menuRowTitle}>Return & Cancellation Policy</Text>
            <Text style={styles.menuRowSub}>Transit stress policy & replacements</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleContactSupport}
          style={styles.menuRow}
        >
          <Ionicons name="chatbox-ellipses-outline" size={18} color={Colors.forest} style={styles.menuRowIcon} />
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

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Information</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={Colors.inkLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.editField}>
              <Text style={styles.editLabel}>Full Name</Text>
              <TextInput
                style={styles.editInput}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Your full name"
                placeholderTextColor={Colors.inkSubtle}
              />
            </View>

            <View style={styles.editField}>
              <Text style={styles.editLabel}>Contact Phone Number</Text>
              <TextInput
                style={styles.editInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={Colors.inkSubtle}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.editField}>
              <Text style={styles.editLabel}>Account Email (Linked)</Text>
              <View style={styles.disabledEmailBox}>
                <Ionicons name="mail-outline" size={15} color={Colors.inkMuted} />
                <Text style={styles.disabledEmailText}>{user?.email}</Text>
              </View>
            </View>

            <View style={styles.editModalActions}>
              <Button
                label="Cancel"
                variant="outline"
                size="sm"
                onPress={() => setEditModalVisible(false)}
                style={{ flex: 1, marginRight: Spacing.sm }}
              />
              <Button
                label="Save Changes"
                size="sm"
                loading={updatingProfile}
                onPress={handleSaveProfile}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Preferences Modal */}
      <Modal
        visible={notificationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Notification Settings</Text>
                <Text style={styles.modalSub}>Manage your Floria botanical alerts</Text>
              </View>
              <TouchableOpacity
                onPress={() => setNotificationModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={Colors.inkLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.preferenceList}>
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceTextCol}>
                  <Text style={styles.preferenceTitle}>Orders & Delivery</Text>
                  <Text style={styles.preferenceSub}>
                    Live dispatch updates, courier tracking, and delivery confirmations
                  </Text>
                </View>
                <Switch
                  value={preferences.ordersAndDelivery}
                  onValueChange={(val) => updatePreference("ordersAndDelivery", val)}
                  trackColor={{ false: Colors.sand, true: Colors.forest }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.preferenceRow}>
                <View style={styles.preferenceTextCol}>
                  <Text style={styles.preferenceTitle}>Wishlist & Restock</Text>
                  <Text style={styles.preferenceSub}>
                    Alerts when saved botanical specimens return to stock
                  </Text>
                </View>
                <Switch
                  value={preferences.wishlistAndRestock}
                  onValueChange={(val) => updatePreference("wishlistAndRestock", val)}
                  trackColor={{ false: Colors.sand, true: Colors.forest }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.preferenceRow}>
                <View style={styles.preferenceTextCol}>
                  <Text style={styles.preferenceTitle}>Plant Discovery</Text>
                  <Text style={styles.preferenceSub}>
                    Curated rare arrivals and seasonal gardening care advice
                  </Text>
                </View>
                <Switch
                  value={preferences.productDiscovery}
                  onValueChange={(val) => updatePreference("productDiscovery", val)}
                  trackColor={{ false: Colors.sand, true: Colors.forest }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.preferenceRow}>
                <View style={styles.preferenceTextCol}>
                  <Text style={styles.preferenceTitle}>Seasonal Promotions</Text>
                  <Text style={styles.preferenceSub}>
                    Occasional nursery discounts and festival plant specials
                  </Text>
                </View>
                <Switch
                  value={preferences.promotionsAndOffers}
                  onValueChange={(val) => updatePreference("promotionsAndOffers", val)}
                  trackColor={{ false: Colors.sand, true: Colors.forest }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={[styles.preferenceRow, { borderBottomWidth: 0 }]}>
                <View style={styles.preferenceTextCol}>
                  <Text style={styles.preferenceTitle}>Account & Security</Text>
                  <Text style={styles.preferenceSub}>
                    Essential login alerts, payment receipts, and security notices (Always on)
                  </Text>
                </View>
                <Switch
                  value={true}
                  disabled
                  trackColor={{ false: Colors.sand, true: Colors.forest }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>

            <Button
              label="Save & Close"
              size="sm"
              onPress={() => setNotificationModalVisible(false)}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </View>
      </Modal>

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
    marginRight: Spacing.sm,
  },
  avatarText: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    color: Colors.white,
    fontFamily: "Georgia",
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  userEmail: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  userPhone: {
    fontSize: 11,
    color: Colors.inkLight,
    fontWeight: "500",
  },
  editProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.page,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: Colors.sand,
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
    fontFamily: "Georgia",
  },
  guestSub: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  guestLoginBtn: {
    backgroundColor: Colors.forest,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  guestLoginText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickActionCard: {
    width: "48%",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionIcon: {
    marginBottom: Spacing.xs,
  },
  quickActionLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
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
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.inkLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    fontSize: 10.5,
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
  // Modals
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
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
  // Edit Profile Styles
  editField: {
    marginBottom: Spacing.md,
  },
  editLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.inkLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  editInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  disabledEmailBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  disabledEmailText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
  },
  editModalActions: {
    flexDirection: "row",
    marginTop: Spacing.sm,
  },
  modalSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
    marginTop: 2,
  },
  preferenceList: {
    marginTop: Spacing.xs,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  preferenceTextCol: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: "700",
    color: Colors.ink,
    fontFamily: "Georgia",
  },
  preferenceSub: {
    fontSize: 10.5,
    color: Colors.inkLight,
    marginTop: 2,
    lineHeight: 15,
  },
});
