import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { useCustomerAuth } from "../../lib/contexts/CustomerAuthContext";
import { Button } from "../../components/ui/Button";

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useCustomerAuth();

  if (!isAuthenticated) {
    return (
      <View style={styles.unauthContainer}>
        <View style={styles.avatar}>
          <Ionicons
            name="person-circle-outline"
            size={44}
            color={Colors.white}
          />
        </View>
        <Text style={styles.title}>Your Floria Account</Text>
        <Text style={styles.subtitle}>
          Sign in to track orders, save delivery addresses, and manage your
          plant wishlist.
        </Text>
        <Button
          label="Sign In / Create Account"
          onPress={() => router.push("/(auth)/login" as any)}
          style={styles.signInButton}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.fullName || user?.email || "C").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>
            {user?.fullName || "Floria Patron"}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Botanical Patron</Text>
          </View>
        </View>
      </View>

      {/* Account Navigation Menu */}
      <View style={styles.menuCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/orders" as any)}
          style={styles.menuItem}
        >
          <Ionicons
            name="receipt-outline"
            size={22}
            color={Colors.forest}
            style={{ marginRight: Spacing.md }}
          />
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Order History & Tracking</Text>
            <Text style={styles.menuSubtitle}>
              View past orders, delivery status, and invoice receipts
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/addresses" as any)}
          style={styles.menuItem}
        >
          <Ionicons
            name="location-outline"
            size={22}
            color={Colors.forest}
            style={{ marginRight: Spacing.md }}
          />
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Saved Delivery Addresses</Text>
            <Text style={styles.menuSubtitle}>
              Manage primary home & workplace botanical delivery locations
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/(tabs)/wishlist" as any)}
          style={styles.menuItem}
        >
          <Ionicons
            name="heart-outline"
            size={22}
            color={Colors.forest}
            style={{ marginRight: Spacing.md }}
          />
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Saved Wishlist</Text>
            <Text style={styles.menuSubtitle}>
              Curated plant specimens saved for later
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
        </TouchableOpacity>
      </View>

      {/* Plant Care Guarantee Notice */}
      <View style={styles.guaranteeCard}>
        <View style={styles.guaranteeTitleRow}>
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={Colors.forestDark}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.guaranteeTitle}>
            7-Day Botanical Transit Guarantee
          </Text>
        </View>
        <Text style={styles.guaranteeText}>
          Every plant from our verified nurseries is hand-delivered with
          insulated botanical packaging and guaranteed to arrive healthy.
        </Text>
      </View>

      <Button
        label="Sign Out"
        variant="outline"
        onPress={signOut}
        style={styles.signOutButton}
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
  unauthContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.page,
  },
  title: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
    textAlign: "center",
    lineHeight: Typography.lineHeights.sm,
    maxWidth: 280,
    marginBottom: Spacing.xl,
  },
  signInButton: {
    width: "100%",
    maxWidth: 260,
  },
  profileHeader: {
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
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.white,
    fontWeight: "bold",
    fontSize: Typography.fontSizes.xl,
    fontFamily: "Georgia",
  },
  avatarEmoji: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    color: Colors.ink,
  },
  userEmail: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: Colors.botanical,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.forestDark,
    textTransform: "uppercase",
  },
  menuCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  menuInfo: {
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
  menuArrow: {
    fontSize: 16,
    color: Colors.inkMuted,
  },
  guaranteeCard: {
    backgroundColor: Colors.sand,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  guaranteeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  guaranteeTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.forestDark,
    textTransform: "uppercase",
  },
  guaranteeText: {
    fontSize: 11,
    color: Colors.inkLight,
    lineHeight: 16,
  },
  signOutButton: {
    borderColor: Colors.error,
  },
});
