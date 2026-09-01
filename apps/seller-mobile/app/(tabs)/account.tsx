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
import {
  Storefront,
  Clock,
  CreditCard,
  Wallet,
  Bell,
  PhoneCall,
  ShieldCheck,
  SignOut,
  CaretRight,
} from "phosphor-react-native";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import {
  SellerPendingVerificationShield,
  ContactFloriaModal,
} from "../../components/seller";

export default function SellerAccountScreen() {
  const router = useRouter();
  const { seller, signOut } = useSellerAuth();
  const { confirmAction } = useSellerFeedback();
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const isVerified = seller?.status === "approved" || seller?.status === "active";
  const logoUrl = seller?.logoUrl || null;

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
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Verification Status Shield (if not active) */}
        {!isVerified && (
          <SellerPendingVerificationShield seller={seller} inline={true} />
        )}

        {/* ── Nursery Partner Profile Header ── */}
        <View style={styles.profileCard}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.nurseryLogo} />
          ) : (
            <View style={styles.placeholderLogo}>
              <Text style={styles.placeholderText}>
                {(seller?.businessName || seller?.username || "N")
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.profileDetails}>
            <Text style={styles.nurseryName}>
              {seller?.businessName || "Botanical Partner"}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isVerified
                      ? Colors.success
                      : Colors.warning,
                  },
                ]}
              />
              <Text style={styles.statusLabel}>
                {isVerified ? "Verified Partner" : "Under Review"}
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
              onPress={() => router.push("/account/details" as any)}
              style={styles.menuRow}
            >
              <View style={styles.iconWrap}>
                <Storefront size={20} color={Colors.forest} weight="regular" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Nursery Details</Text>
                <Text style={styles.menuSubtitle}>Location, contact & business info</Text>
              </View>
              <CaretRight size={16} color={Colors.inkMuted} weight="bold" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/account/hours" as any)}
              style={[styles.menuRow, styles.lastRow]}
            >
              <View style={styles.iconWrap}>
                <Clock size={20} color={Colors.forest} weight="regular" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Operating Hours</Text>
                <Text style={styles.menuSubtitle}>Set daily open & closing times</Text>
              </View>
              <CaretRight size={16} color={Colors.inkMuted} weight="bold" />
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
                <CreditCard size={20} color={Colors.forest} weight="regular" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Settlement Account</Text>
                <Text style={styles.menuSubtitle}>Cashfree linked account & KYC status</Text>
              </View>
              <CaretRight size={16} color={Colors.inkMuted} weight="bold" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/account/transactions" as any)}
              style={[styles.menuRow, styles.lastRow]}
            >
              <View style={styles.iconWrap}>
                <Wallet size={20} color={Colors.forest} weight="regular" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Transaction History</Text>
                <Text style={styles.menuSubtitle}>Payouts, deductions & transfers</Text>
              </View>
              <CaretRight size={16} color={Colors.inkMuted} weight="bold" />
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
                <Bell size={20} color={Colors.forest} weight="regular" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Notification Preferences</Text>
                <Text style={styles.menuSubtitle}>Orders, stock alerts & payout chimes</Text>
              </View>
              <CaretRight size={16} color={Colors.inkMuted} weight="bold" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section 4: Support & Policies ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Support & Policies</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setContactModalVisible(true)}
              style={styles.menuRow}
            >
              <View style={styles.iconWrap}>
                <PhoneCall size={20} color={Colors.forest} weight="regular" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Contact Floria Care</Text>
                <Text style={styles.menuSubtitle}>Call, WhatsApp, or email partner desk</Text>
              </View>
              <CaretRight size={16} color={Colors.inkMuted} weight="bold" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setContactModalVisible(true)}
              style={[styles.menuRow, styles.lastRow]}
            >
              <View style={styles.iconWrap}>
                <ShieldCheck size={20} color={Colors.forest} weight="regular" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Partner Verification Desk</Text>
                <Text style={styles.menuSubtitle}>Floria partner agreement & verification support</Text>
              </View>
              <CaretRight size={16} color={Colors.inkMuted} weight="bold" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Logout Button ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <SignOut size={20} color={Colors.error} weight="bold" />
          <Text style={styles.logoutText}>Sign Out of Nursery</Text>
        </TouchableOpacity>
      </ScrollView>

      <ContactFloriaModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        sellerName={seller?.businessName}
        sellerId={seller?.publicSellerId || seller?.id}
      />
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
  placeholderLogo: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.botanical,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 24,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.forest,
  },
  profileDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nurseryName: {
    fontSize: Typography.fontSizes.base,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.ink,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginVertical: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.inkMuted,
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
