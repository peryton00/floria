import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { FloriaIcon } from "../ui/FloriaIcon";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { ContactFloriaModal } from "./ContactFloriaModal";
import type { SellerProfileData } from "../../lib/contexts/SellerAuthContext";

interface SellerPendingVerificationShieldProps {
  seller?: SellerProfileData | null;
  inline?: boolean;
  featureName?: string;
}

export function SellerPendingVerificationShield({
  seller,
  inline = false,
  featureName,
}: SellerPendingVerificationShieldProps) {
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const status = seller?.status || "under_review";
  const isCorrection = status === "needs_correction";
  const isSuspended = status === "suspended" || status === "deactivated";

  let badgeColor = "#B45309";
  let badgeBg = "#FEF3C7";
  let title = "Verification Pending";
  let primaryMessage =
    "Floria Care will contact you soon. Your nursery application is being processed and verified by our botanical quality team.";

  if (isCorrection) {
    badgeColor = "#C2410C";
    badgeBg = "#FFEDD5";
    title = "Action Required: Details Correction";
    primaryMessage =
      seller?.correctionReason ||
      "Floria Care requires updated verification details or trade documents for your nursery.";
  } else if (isSuspended) {
    badgeColor = "#B91C1C";
    badgeBg = "#FEE2E2";
    title = "Account Suspended";
    primaryMessage =
      "Your seller account is temporarily suspended. Please contact Floria Care.";
  }

  if (inline) {
    return (
      <>
        <View style={styles.inlineBanner}>
          <View style={styles.inlineHeaderRow}>
            <View style={styles.inlineBadgeRow}>
              <View style={[styles.inlineDot, { backgroundColor: badgeColor }]} />
              <Text style={[styles.inlineBadgeText, { color: badgeColor }]}>
                {title.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.inlineContactButton}
              onPress={() => setContactModalVisible(true)}
            >
              <FloriaIcon name="phone" size={14} color={Colors.white} />
              <Text style={styles.inlineContactButtonText}>Contact Floria</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inlineMessage}>
            {primaryMessage}
          </Text>
        </View>

        <ContactFloriaModal
          visible={contactModalVisible}
          onClose={() => setContactModalVisible(false)}
          sellerName={seller?.businessName}
          sellerId={seller?.publicSellerId || seller?.id}
        />
      </>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <View style={styles.card}>
        {/* Status Icon */}
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: badgeBg, borderColor: badgeColor + "33" },
          ]}
        >
          <FloriaIcon
            name={isCorrection ? "warning" : isSuspended ? "shield" : "clock"}
            size={32}
            color={badgeColor}
          />
        </View>

        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>
            {title.toUpperCase()}
          </Text>
        </View>

        {/* Headline */}
        <Text style={styles.cardTitle}>
          {featureName ? `${featureName} Locked` : "Account Under Verification"}
        </Text>

        {/* Reassuring Message */}
        <Text style={styles.cardMessage}>
          {primaryMessage}
        </Text>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nursery Name</Text>
            <Text style={styles.infoValue}>{seller?.businessName || "Pending Application"}</Text>
          </View>
          {seller?.publicSellerId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Partner ID</Text>
              <Text style={styles.infoValueMono}>{seller.publicSellerId}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estimated Review</Text>
            <Text style={styles.infoValue}>Within 24-48 hours</Text>
          </View>
        </View>

        {/* Primary Contact Floria Action */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.contactButton}
          onPress={() => setContactModalVisible(true)}
        >
          <FloriaIcon name="phone" size={18} color={Colors.white} />
          <Text style={styles.contactButtonText}>Contact Floria Care</Text>
        </TouchableOpacity>

        <Text style={styles.contactFooterNote}>
          Need urgent onboarding assistance? Floria Care is ready to help.
        </Text>
      </View>

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
  fullContainer: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF8F5",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  cardTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    color: "#0F172A",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    textAlign: "center",
    marginBottom: 6,
  },
  cardMessage: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  infoBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  infoValueMono: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  contactButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2D5A3C",
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    shadowColor: "#2D5A3C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  contactFooterNote: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 10,
  },

  // Inline Banner Styles
  inlineBanner: {
    backgroundColor: "#FEF8EC",
    borderWidth: 1,
    borderColor: "#FBD38D",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  inlineHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  inlineBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inlineBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  inlineContactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2D5A3C",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  inlineContactButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  inlineMessage: {
    fontSize: 12,
    color: "#78350F",
    lineHeight: 18,
  },
});
