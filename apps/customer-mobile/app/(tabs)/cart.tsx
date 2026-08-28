import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { useCart } from "../../lib/contexts/CartContext";
import { useCustomerAuth } from "../../lib/contexts/CustomerAuthContext";
import { CartItemRow } from "../../components/customer/CartItemRow";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";

export default function CustomerCartScreen() {
  const router = useRouter();
  const {
    items,
    subtotalPaise,
    deliveryFeePaise,
    totalPaise,
    updateQuantity,
    removeItem,
  } = useCart();
  const { isAuthenticated } = useCustomerAuth();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your Botanical Bag is Empty"
        message="Discover lush indoor foliage, rare aroids, and hand-crafted planters."
        actionLabel="Start Shopping"
        onAction={() => router.push("/(tabs)/explore" as any)}
      />
    );
  }

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      router.push("/(auth)/login" as any);
      return;
    }
    router.push("/checkout" as any);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onUpdateQuantity={(qty) => updateQuantity(item.productId, qty)}
            onRemove={() => removeItem(item.productId)}
          />
        )}
        ListFooterComponent={
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatINR(subtotalPaise)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Hyperlocal Courier Delivery
              </Text>
              <Text style={styles.summaryValue}>
                {formatINR(deliveryFeePaise)}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.totalValue}>{formatINR(totalPaise)}</Text>
            </View>

            <View style={styles.deliveryBadge}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={Colors.forestDark}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.deliveryBadgeText}>
                Hand-delivered with plant care transit protection
              </Text>
            </View>
          </View>
        }
      />

      <View style={styles.checkoutFooter}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Total Amount</Text>
          <Text style={styles.footerPrice}>{formatINR(totalPaise)}</Text>
        </View>
        <Button
          label="Proceed to Checkout →"
          onPress={handleProceedToCheckout}
          style={styles.checkoutButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  summaryContainer: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
  },
  summaryValue: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.ink,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.ink,
  },
  totalValue: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.forest,
  },
  deliveryBadge: {
    marginTop: Spacing.md,
    backgroundColor: Colors.botanical,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryBadgeText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.forestDark,
    fontWeight: "600",
  },
  checkoutFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.linen,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerInfo: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 10,
    color: Colors.inkMuted,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  footerPrice: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    color: Colors.forest,
  },
  checkoutButton: {
    flex: 1.2,
  },
});
