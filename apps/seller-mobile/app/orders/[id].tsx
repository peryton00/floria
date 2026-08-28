import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { formatINR, formatDate } from "../../lib/format";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

export default function SellerOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrderDetail = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await api.getSellerOrderById(id);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setError(res.error?.message || "Could not retrieve order details.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to order fulfillment system.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetail();
  };

  const handleUpdateStatus = async (nextStatus: string) => {
    if (!id) return;
    try {
      setUpdating(true);
      const res = await api.updateFulfillmentStatus(id, nextStatus);
      if (res.success) {
        Alert.alert(
          "Status Updated",
          `Order transitioned to ${nextStatus.replace(/_/g, " ").toUpperCase()}`,
        );
        await fetchOrderDetail();
      } else {
        Alert.alert(
          "Transition Error",
          res.error?.message || "Failed to update order status.",
        );
      }
    } catch (e: any) {
      Alert.alert(
        "Transition Error",
        e.message || "Could not update order status.",
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !refreshing) {
    return <LoadingState message="Retrieving order fulfillment records..." />;
  }

  if (error || !order) {
    return (
      <ErrorState
        message={error || "Order unavailable."}
        onRetry={fetchOrderDetail}
      />
    );
  }

  const currentStatus = order.status?.toLowerCase() || "pending";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.forest]}
        />
      }
    >
      {/* Order Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.orderNumber}>
              Order #{order.order_number || order.id?.substring(0, 8)}
            </Text>
            <Text style={styles.orderDate}>
              Received {formatDate(order.created_at)}
            </Text>
          </View>
          <StatusBadge status={order.status || "pending"} />
        </View>
        <View style={styles.deliveryBadge}>
          <Text style={styles.deliveryText}>
            ⚡ Hyperlocal 4-Hour Dispatch Required
          </Text>
        </View>
      </View>

      {/* Fulfillment Actions Card */}
      <View style={styles.actionCard}>
        <Text style={styles.sectionTitle}>Fulfillment Controls</Text>
        <Text style={styles.actionPrompt}>
          Advance order through nursery inspection and preparation:
        </Text>

        <View style={styles.actionButtons}>
          {currentStatus === "pending" && (
            <Button
              label="1. Accept & Inspect Plant Specimen"
              variant="primary"
              loading={updating}
              onPress={() => handleUpdateStatus("preparing")}
              style={styles.btn}
            />
          )}

          {currentStatus === "preparing" && (
            <Button
              label="2. Mark Ready for Courier Pickup"
              variant="success"
              loading={updating}
              onPress={() => handleUpdateStatus("ready_for_pickup")}
              style={styles.btn}
            />
          )}

          {currentStatus === "ready_for_pickup" && (
            <Button
              label="3. Courier Handoff (Dispatched)"
              variant="terracotta"
              loading={updating}
              onPress={() => handleUpdateStatus("out_for_delivery")}
              style={styles.btn}
            />
          )}

          {currentStatus === "out_for_delivery" && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                🚀 Courier is currently in transit to deliver specimen to
                customer.
              </Text>
            </View>
          )}

          {currentStatus === "delivered" && (
            <View style={[styles.infoBanner, styles.deliveredBanner]}>
              <Text style={styles.deliveredBannerText}>
                ✓ Specimen successfully hand-delivered and confirmed with POD.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Ordered Plants & Foliage</Text>
        {(order.items || []).map((item: any, idx: number) => (
          <View key={item.id || idx} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>
                {item.product_name || item.name || "Botanical Specimen"}
              </Text>
              <Text style={styles.itemQty}>Quantity: {item.quantity || 1}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {formatINR(
                (item.unit_price_paise || item.price_paise || 129900) *
                  (item.quantity || 1),
              )}
            </Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Gross Order Value</Text>
          <Text style={styles.totalPrice}>
            {formatINR(order.total_amount_paise || order.total_paise || 129900)}
          </Text>
        </View>
      </View>

      {/* Destination */}
      {order.shipping_address && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Delivery Destination</Text>
          <Text style={styles.addressName}>
            {order.shipping_address.name || "Customer Residence"}
          </Text>
          <Text style={styles.addressText}>
            {order.shipping_address.street ||
              order.shipping_address.address_line1}
          </Text>
          <Text style={styles.addressCity}>
            {order.shipping_address.city}, {order.shipping_address.pincode}
          </Text>
        </View>
      )}
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
  headerCard: {
    backgroundColor: Colors.forest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNumber: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.white,
  },
  orderDate: {
    fontSize: 10,
    color: Colors.botanical,
    marginTop: 2,
  },
  deliveryBadge: {
    marginTop: Spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  deliveryText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
    textTransform: "uppercase",
  },
  actionCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: Spacing.xs,
  },
  actionPrompt: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginBottom: Spacing.sm,
  },
  actionButtons: {
    gap: Spacing.xs,
  },
  btn: {
    width: "100%",
  },
  infoBanner: {
    backgroundColor: Colors.botanical,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  infoBannerText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.forestDark,
    fontWeight: "600",
    textAlign: "center",
  },
  deliveredBanner: {
    backgroundColor: Colors.successBg,
  },
  deliveredBannerText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.success,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  itemName: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.ink,
  },
  itemQty: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.forest,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  totalLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  totalPrice: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.forest,
  },
  addressName: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.ink,
  },
  addressText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
    marginTop: 2,
  },
  addressCity: {
    fontSize: 10,
    color: Colors.inkMuted,
  },
});
