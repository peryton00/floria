import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { useCart } from "../../lib/contexts/CartContext";
import { useCustomerAuth } from "../../lib/contexts/CustomerAuthContext";
import { Button } from "../../components/ui/Button";

export default function CustomerCheckoutScreen() {
  const router = useRouter();
  const { items, subtotalPaise, deliveryFeePaise, totalPaise, clearCart } =
    useCart();
  const { user } = useCustomerAuth();

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

  const handlePlaceOrder = async () => {
    if (!selectedAddressId && addresses.length === 0) {
      Alert.alert(
        "Delivery Address Required",
        "Please add a delivery address to complete your order.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add Address",
            onPress: () => router.push("/addresses" as any),
          },
        ],
      );
      return;
    }

    try {
      setProcessing(true);
      // 1. Create order on backend
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
        // 2. Initialize Cashfree PG session
        const sessionRes = await api.createPaymentSession(orderId);
        if (!sessionRes.success || !sessionRes.data) {
          throw new Error(
            sessionRes.error?.message ||
              "Failed to generate Cashfree payment session.",
          );
        }

        // For mobile sandbox verification, simulate payment completion callback
        Alert.alert(
          "Cashfree Payment Gateway",
          `Payment Session #${sessionRes.data.cfOrderId} initialized for ${formatINR(totalPaise)}. Proceed to finalize?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setProcessing(false),
            },
            {
              text: "Authorize Payment",
              onPress: () => {
                clearCart();
                router.replace({
                  pathname: "/orders/[id]",
                  params: { id: orderId },
                } as any);
              },
            },
          ],
        );
      } else {
        // Cash on Delivery
        clearCart();
        Alert.alert(
          "Order Confirmed",
          "Your botanical order has been placed successfully.",
        );
        router.replace({
          pathname: "/orders/[id]",
          params: { id: orderId },
        } as any);
      }
    } catch (err: any) {
      Alert.alert("Checkout Error", err.message || "Failed to process order.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.forest} />
        <Text style={styles.loadingText}>Preparing checkout...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Delivery Address Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📍 1. Delivery Address</Text>
          <TouchableOpacity onPress={() => router.push("/addresses" as any)}>
            <Text style={styles.changeAction}>Manage →</Text>
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
        <Text style={styles.sectionTitle}>💳 2. Payment Gateway</Text>
        <View style={styles.paymentOptions}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPaymentMethod("online")}
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
            onPress={() => setPaymentMethod("cod")}
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
        <Text style={styles.sectionTitle}>
          🌿 3. Order Review ({items.length} items)
        </Text>
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
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownVal}>{formatINR(subtotalPaise)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Hyperlocal Courier</Text>
            <Text style={styles.breakdownVal}>
              {formatINR(deliveryFeePaise)}
            </Text>
          </View>
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
