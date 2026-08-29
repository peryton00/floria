import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { formatINR, formatDate } from "../../lib/format";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const STAGES = [
  {
    key: "confirmed",
    label: "Order Confirmed",
    desc: "Nursery received order",
  },
  {
    key: "preparing",
    label: "Specimen Inspection",
    desc: "Pruned and watered for transit",
  },
  {
    key: "picked_up",
    label: "Hyperlocal Dispatch",
    desc: "Courier on route with plant carrier",
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    desc: "Arriving at your sanctuary",
  },
  {
    key: "delivered",
    label: "Hand Delivered",
    desc: "Care guidelines transferred",
  },
];

export default function OrderDetailTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetail = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await api.getOrderById(id);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setError(res.error?.message || "Could not locate order.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order tracking.");
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

  if (loading && !refreshing) {
    return <LoadingState message="Connecting to live dispatch..." />;
  }

  if (error || !order) {
    return (
      <ErrorState
        message={error || "Order tracking unavailable."}
        onRetry={fetchOrderDetail}
      />
    );
  }

  const currentStatus = order.status?.toLowerCase() || "confirmed";
  const stageIndex = STAGES.findIndex((s) => s.key === currentStatus);
  const activeIndex = stageIndex >= 0 ? stageIndex : 1;

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
      {/* Header Info */}
      <View style={styles.headerCard}>
        <Text style={styles.orderLabel}>Live Botanical Dispatch</Text>
        <Text style={styles.orderId}>Order #{order.id?.substring(0, 8)}</Text>
        <Text style={styles.orderPlaced}>
          Placed on {formatDate(order.created_at)}
        </Text>
        <View style={[styles.deliveryEstimate, { flexDirection: "row", alignItems: "center", gap: 5 }]}>
          <Ionicons name="flash-outline" size={13} color={Colors.forest} />
          <Text style={styles.estimateText}>
            Estimated Delivery: Within 4 Hours
          </Text>
        </View>
      </View>

      {/* Progress Stepper */}
      <View style={styles.trackerCard}>
        <Text style={styles.sectionTitle}>Fulfillment Timeline</Text>
        <View style={styles.timeline}>
          {STAGES.map((s, idx) => {
            const isDone = idx <= activeIndex;
            const isCurrent = idx === activeIndex;
            return (
              <View key={s.key} style={styles.timelineItem}>
                <View style={styles.timelineIconCol}>
                  <View
                    style={[
                      styles.timelineCircle,
                      isDone && styles.timelineCircleDone,
                      isCurrent && styles.timelineCircleCurrent,
                    ]}
                  >
                    {isDone ? (
                      <Ionicons name="checkmark" size={12} color={Colors.white} />
                    ) : (
                      <Text style={styles.circleText}>{idx + 1}</Text>
                    )}
                  </View>
                  {idx < STAGES.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        isDone && idx < activeIndex && styles.timelineLineDone,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineTitle,
                      isCurrent && styles.timelineTitleCurrent,
                    ]}
                  >
                    {s.label}
                  </Text>
                  <Text style={styles.timelineDesc}>{s.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Ordered Botanical Items</Text>
        {(order.items || []).map((item: any, idx: number) => (
          <View key={item.id || idx} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>
                {item.product_name || item.name || "Botanical Plant"}
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
          <Text style={styles.totalLabel}>Total Paid</Text>
          <Text style={styles.totalPrice}>
            {formatINR(order.total_amount_paise || order.total_paise || 129900)}
          </Text>
        </View>
      </View>

      {/* Delivery Address */}
      {order.shipping_address && (
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Delivery Destination</Text>
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
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  orderLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.botanical,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  orderId: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.white,
    marginTop: 2,
  },
  orderPlaced: {
    fontSize: 11,
    color: Colors.botanical,
    marginTop: 4,
  },
  deliveryEstimate: {
    marginTop: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  estimateText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
  },
  trackerCard: {
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
    marginBottom: Spacing.md,
  },
  timeline: {
    paddingLeft: Spacing.xs,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  timelineIconCol: {
    alignItems: "center",
    marginRight: Spacing.md,
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineCircleDone: {
    backgroundColor: Colors.forest,
  },
  timelineCircleCurrent: {
    backgroundColor: Colors.terracotta,
  },
  circleText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.white,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    minHeight: 24,
  },
  timelineLineDone: {
    backgroundColor: Colors.forest,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.inkLight,
  },
  timelineTitleCurrent: {
    color: Colors.terracotta,
    fontSize: Typography.fontSizes.sm,
  },
  timelineDesc: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  detailsCard: {
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
  addressText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.ink,
  },
  addressCity: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
});
