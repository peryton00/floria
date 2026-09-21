import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Fonts, Spacing, BorderRadius } from "../../lib/theme";

/**
 * Internal Floria Typography Verification Component
 * Used for automated & visual verification of registered native font families, weights, and glyphs.
 */
export function FloriaTypographyVerification() {
  return (
    <View style={styles.container} testID="floria-typography-verification">
      <Text style={styles.displayRegular}>
        Aa Ag 0123456789 ₹499 — Discover. Choose. Grow. (Cormorant Garamond Regular)
      </Text>
      <Text style={styles.displayMedium}>
        Aa Ag 0123456789 ₹499 — Discover plants near you (Cormorant Garamond Medium)
      </Text>
      <Text style={styles.displaySemiBold}>
        Aa Ag 0123456789 ₹499 — Monstera Deliciosa (Cormorant Garamond SemiBold)
      </Text>

      <Text style={styles.sansRegular}>
        Aa Ag 0123456789 ₹499 — Available from your local nursery (Inter Regular)
      </Text>
      <Text style={styles.sansMedium}>
        Aa Ag 0123456789 ₹499 — Manage your products (Inter Medium)
      </Text>
      <Text style={styles.sansSemiBold}>
        Aa Ag 0123456789 ₹499 — Your orders (Inter SemiBold)
      </Text>
      <Text style={styles.sansBold}>
        Aa Ag 0123456789 ₹499 — Add to cart (Inter Bold)
      </Text>
      <Text style={styles.scriptAccent}>
        Aa Ag 0123456789 ₹499 — grown locally (Floria Script Accent)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  displayRegular: {
    fontFamily: Fonts.display.regular,
    fontSize: 16,
    color: Colors.ink,
  },
  displayMedium: {
    fontFamily: Fonts.display.medium,
    fontSize: 16,
    color: Colors.ink,
  },
  displaySemiBold: {
    fontFamily: Fonts.display.semiBold,
    fontSize: 16,
    color: Colors.forest,
  },
  sansRegular: {
    fontFamily: Fonts.sans.regular,
    fontSize: 14,
    color: Colors.inkLight,
  },
  sansMedium: {
    fontFamily: Fonts.sans.medium,
    fontSize: 14,
    color: Colors.ink,
  },
  sansSemiBold: {
    fontFamily: Fonts.sans.semiBold,
    fontSize: 14,
    color: Colors.ink,
  },
  sansBold: {
    fontFamily: Fonts.sans.bold,
    fontSize: 14,
    color: Colors.forest,
  },
  scriptAccent: {
    fontFamily: Fonts.script.regular,
    fontSize: 16,
    color: Colors.terracotta,
  },
});
