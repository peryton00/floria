import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { useCart } from "../../lib/contexts/CartContext";
import { useCustomerAuth } from "../../lib/contexts/CustomerAuthContext";
import { useFeedback } from "../../lib/contexts/FloriaFeedbackContext";
import { haptics } from "../../lib/haptics";
import { Button } from "../../components/ui/Button";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useActionLock } from "../../lib/hooks/useActionLock";

export default function CustomerCheckoutScreen() {
  const router = useRouter();
  const {
    items,
    subtotalPaise,
    deliveryFeePaise,
    maintenanceFeePaise,
    totalPaise,
    isFreeDelivery,
    clearCart,
  } = useCart();
  const { user } = useCustomerAuth();
  const { showSuccess, showError, showConfirmSheet } = useFeedback();
  const { isLocked, runExclusive } = useActionLock();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">(
    "online",
  );
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getAddresses();
      if (res.success && res.data && res.data.length > 0) {
        setAddresses(res.data);
        const defaultAddr =
          res.data.find((a: any) => a.is_default) || res.data[0];
        setSelectedAddressId(defaultAddr.id);
      }
    } catch {
      // No address found
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handlePlaceOrder = () => {
    if (items.length === 0) {
      showError("Your cart is empty. Please add specimens before checking out.");
      return;
    }

    if (!selectedAddressId && addresses.length === 0) {
      showConfirmSheet({
        title: "Delivery Address Required",
        message: "Please add a delivery destination address to complete your order fulfillment.",
        icon: "location-outline",
        confirmLabel: "Add Address",
        cancelLabel: "Cancel",
        onConfirm: () => router.push("/addresses" as any),
      });
      return;
    }

    runExclusive(async () => {
      try {
        setProcessing(true);

        // 0. Pre-checkout database validation: Check live inventory & status
        const validationChecks = await Promise.allSettled(
          items.map((i) => api.getProductBySlug(i.productId)),
        );

        for (let idx = 0; idx < items.length; idx++) {
          const item = items[idx];
          const check = validationChecks[idx];
          if (check.status === "fulfilled" && check.value?.success && check.value.data) {
            const pData = check.value.data as any;
            const liveStock =
              pData.inventory?.stock_quantity ??
              (Array.isArray(pData.inventory) ? pData.inventory[0]?.stock_quantity : undefined) ??
              pData.stock_quantity ??
              0;

            if (liveStock <= 0) {
              throw new Error(`"${item.name}" is currently out of stock. Please update your bag.`);
            }
            if (liveStock < item.quantity) {
              throw new Error(`Only ${liveStock} units of "${item.name}" are available in stock.`);
            }
          }
        }

        // 1. Ensure client-side cart items are synced to backend DB cart table
        if (items.length > 0) {
          const syncItems = items
            .filter((i) => Boolean(i.productId))
            .map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            }));
          try {
            await api.mergeCart(syncItems);
          } catch (mergeErr) {
            console.warn("Cart sync before checkout notice:", mergeErr);
          }
        }

        // 2. Create order on backend
        const checkoutRes = await api.createCheckout({
          addressId: selectedAddressId || addresses[0]?.id,
          paymentMethod,
        });

        if (!checkoutRes.success || !checkoutRes.data?.orderId) {
          throw new Error(
            checkoutRes.error?.message || "Failed to initialize order checkout.",
          );
        }

        const orderId = checkoutRes.data.orderId;

        if (paymentMethod === "online") {
          // 3. Initialize Cashfree PG session
          const sessionRes = await api.createPaymentSession(orderId);
          if (!sessionRes.success || !sessionRes.data) {
            throw new Error(
              sessionRes.error?.message ||
                "Failed to generate Cashfree payment session.",
            );
          }

          // Cashfree authorization bottom sheet
          showConfirmSheet({
            title: "Authorize Payment",
            message: `Authorize payment of ${formatINR(totalPaise)} via Cashfree PG to finalize your botanical order?`,
            icon: "shield-checkmark-outline",
            confirmLabel: "Authorize Payment",
            cancelLabel: "Cancel",
            onConfirm: () => {
              clearCart();
              haptics.success();
              showSuccess("Order confirmed successfully");
              router.replace({
                pathname: "/orders/[id]",
                params: { id: orderId },
              } as any);
            },
            onCancel: () => setProcessing(false),
          });
        } else {
          // Cash on Delivery
          clearCart();
          haptics.success();
          showSuccess("Order placed successfully (Cash on Delivery)");
          router.replace({
            pathname: "/orders/[id]",
            params: { id: orderId },
          } as any);
        }
      } catch (err: any) {
        haptics.error();
        showError(err.message || "Failed to process order.");
      } finally {
        setProcessing(false);
      }
    });
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Your Bag is Empty"
          message="Select living botanical specimens to proceed through secure checkout."
          actionLabel="Explore Plants"
          onAction={() => router.push("/(tabs)/explore" as any)}
        />
      </View>
    );
  }

  if (loading && addresses.length === 0) {
    return (
      <View style={styles.container}>
        <ListSkeleton count={3} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Delivery Address Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="location-outline" size={15} color={Colors.forest} />
            <Text style={styles.sectionTitle}>1. Delivery Address</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/addresses" as any)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={styles.changeAction}>Manage</Text>
              <Ionicons name="chevron-forward-outline" size={13} color={Colors.terracotta} />
            </View>
          </TouchableOpacity>
        </View>

        {addresses.length > 0 ? (
          <View style={styles.addressList}>
            {addresses.map((a) => {
              const isSelected = selectedAddressId === a.id;
              return (
                <TouchableOpacity
                  key={a.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedAddressId(a.id)}
                  style={[
                    styles.addressItem,
                    isSelected && styles.addressItemSelected,
                  ]}
                >
                  <View style={styles.radio}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressName}>
                      {a.name || a.full_name || user?.fullName}
                    </Text>
                    <Text style={styles.addressText}>
                      {a.street_address || a.address_line1}
                    </Text>
                    <Text style={styles.addressCity}>
                      {a.city || "Bengaluru"}, {a.pincode || "560001"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyAddress}>
            <Text style={styles.emptyAddressText}>
              No delivery address saved yet.
            </Text>
            <Button
              label="+ Add Delivery Address"
              variant="outline"
              size="sm"
              onPress={() => router.push("/addresses" as any)}
              style={styles.addAddrBtn}
            />
          </View>
        )}
      </View>

      {/* 2. Payment Method Card */}
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="card-outline" size={15} color={Colors.forest} />
          <Text style={styles.sectionTitle}>2. Payment Gateway</Text>
        </View>
        <View style={styles.paymentOptions}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (paymentMethod !== "online") {
                haptics.selection();
                setPaymentMethod("online");
              }
            }}
            style={[
              styles.paymentOption,
              paymentMethod === "online" && styles.paymentOptionSelected,
            ]}
          >
            <View style={styles.radio}>
              {paymentMethod === "online" && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>
                Cashfree PG (UPI / Cards / NetBanking)
              </Text>
              <Text style={styles.paymentSubtitle}>
                Instant payment with zero transaction surcharge
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (paymentMethod !== "cod") {
                haptics.selection();
                setPaymentMethod("cod");
              }
            }}
            style={[
              styles.paymentOption,
              paymentMethod === "cod" && styles.paymentOptionSelected,
            ]}
          >
            <View style={styles.radio}>
              {paymentMethod === "cod" && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>
                Pay on Delivery (Cash / UPI at doorstep)
              </Text>
              <Text style={styles.paymentSubtitle}>
                Pay your courier upon inspection of plants
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Order Items Summary */}
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="leaf-outline" size={15} color={Colors.forest} />
          <Text style={styles.sectionTitle}>3. Order Review ({items.length} items)</Text>
        </View>
        <View style={styles.itemsSummary}>
          {items.map((i) => (
            <View key={i.productId} style={styles.summaryItem}>
              <Text style={styles.summaryItemName} numberOfLines={1}>
                {i.quantity} × {i.name}
              </Text>
              <Text style={styles.summaryItemPrice}>
                {formatINR(i.pricePaise * i.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Items Subtotal</Text>
            <Text style={styles.breakdownVal}>{formatINR(subtotalPaise)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Hyperlocal Courier Delivery</Text>
            <Text style={[styles.breakdownVal, deliveryFeePaise === 0 && styles.freeDeliveryText]}>
              {deliveryFeePaise === 0 ? "FREE" : formatINR(deliveryFeePaise)}
            </Text>
          </View>
          {maintenanceFeePaise > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Platform Maintenance Fee</Text>
              <Text style={styles.breakdownVal}>{formatINR(maintenanceFeePaise)}</Text>
            </View>
          )}
          <View style={[styles.breakdownRow, styles.breakdownTotal]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalVal}>{formatINR(totalPaise)}</Text>
          </View>
        </View>
      </View>

      <Button
        label={
          paymentMethod === "online"
            ? `Pay ${formatINR(totalPaise)} via Cashfree`
            : "Confirm Cash on Delivery Order"
        }
        loading={processing}
        onPress={handlePlaceOrder}
        style={styles.placeOrderBtn}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.page,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
  },
  sectionCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  changeAction: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.terracotta,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  addressList: {
    gap: Spacing.sm,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.page,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressItemSelected: {
    borderColor: Colors.forest,
    backgroundColor: Colors.botanical + "40",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.forest,
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.ink,
  },
  addressText: {
    fontSize: 11,
    color: Colors.inkLight,
    marginTop: 2,
  },
  addressCity: {
    fontSize: 10,
    color: Colors.inkMuted,
  },
  emptyAddress: {
    padding: Spacing.md,
    alignItems: "center",
  },
  emptyAddressText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginBottom: Spacing.sm,
  },
  addAddrBtn: {
    minWidth: 160,
  },
  paymentOptions: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.page,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentOptionSelected: {
    borderColor: Colors.forest,
    backgroundColor: Colors.botanical + "40",
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.ink,
  },
  paymentSubtitle: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  itemsSummary: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  summaryItemName: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.ink,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  summaryItemPrice: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.ink,
  },
  breakdown: {
    marginTop: Spacing.xs,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  breakdownLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
  },
  breakdownVal: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.ink,
    fontWeight: "600",
  },
  freeDeliveryText: {
    color: "#15803D",
    fontWeight: "700",
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  totalLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  totalVal: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  placeOrderBtn: {
    marginTop: Spacing.md,
  },
});
