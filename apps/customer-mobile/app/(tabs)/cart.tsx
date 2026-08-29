import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { useCart, CartItem } from "../../lib/contexts/CartContext";
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
        message="Discover lush indoor foliage, rare aroids, and hand-crafted planters from our partner nurseries."
        actionLabel="Explore Plants"
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

  // Group items by nursery ID (matching web logic)
  const nurseryGroupsMap = new Map<string, { nurseryId: string; nurseryName: string; items: CartItem[] }>();
  items.forEach((item) => {
    const id = item.nurseryId || "nursery-1";
    if (!nurseryGroupsMap.has(id)) {
      nurseryGroupsMap.set(id, {
        nurseryId: id,
        nurseryName: item.nurseryName || "Floria Partner Nursery",
        items: [],
      });
    }
    nurseryGroupsMap.get(id)!.items.push(item);
  });
  const nurseryGroups = Array.from(nurseryGroupsMap.values());

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Nursery-Grouped Items */}
        {nurseryGroups.map((group) => (
          <View key={group.nurseryId} style={styles.nurseryGroupCard}>
            <View style={styles.nurseryHeader}>
              <Ionicons name="storefront-outline" size={14} color={Colors.forest} />
              <Text style={styles.nurseryName}>{group.nurseryName}</Text>
              <Text style={styles.nurseryItemCount}>
                {group.items.reduce((sum, i) => sum + i.quantity, 0)} {group.items.reduce((sum, i) => sum + i.quantity, 0) === 1 ? "specimen" : "specimens"}
              </Text>
            </View>

            <View style={styles.itemsList}>
              {group.items.map((item) => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onUpdateQuantity={(qty) => updateQuantity(item.productId, qty)}
                  onRemove={() => removeItem(item.productId)}
                />
              ))}
            </View>
          </View>
        ))}

        {/* 7-Day Guarantee Assurance Card */}
        <View style={styles.guaranteeCard}>
          <Ionicons name="shield-checkmark" size={18} color={Colors.forest} style={{ marginRight: Spacing.sm }} />
          <View style={styles.guaranteeTextCol}>
            <Text style={styles.guaranteeTitle}>7-Day Plant Health Guarantee</Text>
            <Text style={styles.guaranteeSub}>
              Insulated transit packaging + hydrated root ball delivery guarantee on every plant.
            </Text>
          </View>
        </View>

        {/* Order Summary & Price Breakdown */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Price Details</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Price ({items.reduce((sum, i) => sum + i.quantity, 0)} items)
            </Text>
            <Text style={styles.summaryValue}>{formatINR(subtotalPaise)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Courier Dispatch & Packaging</Text>
            <Text style={styles.summaryValue}>
              {deliveryFeePaise === 0 ? "FREE" : formatINR(deliveryFeePaise)}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatINR(totalPaise)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Checkout Footer */}
      <View style={styles.checkoutFooter}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Total Payable</Text>
          <Text style={styles.footerPrice}>{formatINR(totalPaise)}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleProceedToCheckout}
          style={styles.checkoutBtn}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 110,
  },
  nurseryGroupCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  nurseryHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.softSand,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  nurseryName: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nurseryItemCount: {
    marginLeft: "auto",
    fontSize: 11,
    color: Colors.inkMuted,
  },
  itemsList: {
    padding: Spacing.sm,
  },
  guaranteeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.botanical,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guaranteeTextCol: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
  },
  guaranteeSub: {
    fontSize: 11,
    color: Colors.inkLight,
    marginTop: 2,
    lineHeight: 15,
  },
  summaryCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkLight,
  },
  summaryValue: {
    fontSize: Typography.fontSizes.sm,
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
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    color: Colors.forest,
  },
  checkoutFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.linen,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 6,
  },
  footerInfo: {
    justifyContent: "center",
  },
  footerLabel: {
    fontSize: 10,
    color: Colors.inkMuted,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  footerPrice: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    color: Colors.forest,
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  checkoutBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
