import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { formatINR, formatDate } from "../../lib/format";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Button } from "../../components/ui/Button";

const STAGES = [
  {
    key: "confirmed",
    label: "Order Placed & Confirmed",
    desc: "Nursery received botanical order and verified live stock.",
  },
  {
    key: "preparing",
    label: "Specimen Inspection & Care",
    desc: "Living plant foliage inspected, pruned, and hydrated for transit.",
  },
  {
    key: "picked_up",
    label: "Dispatched from Nursery",
    desc: "Handed over to courier in insulated botanical transit packaging.",
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    desc: "Courier en route to your sanctuary address.",
  },
  {
    key: "delivered",
    label: "Delivered & Transferred",
    desc: "Specimen safely hand-delivered with 7-day health guarantee.",
  },
];

export default function OrderDetailTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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

  const handleSupportContact = () => {
    Alert.alert(
      "Floria Order Support",
      `Need assistance with Order #${order?.id?.substring(0, 8)}?`,
      [
        {
          text: "Email Support",
          onPress: () =>
            Linking.openURL(
              `mailto:support@floria.in?subject=Help%20with%20Order%20%23${order?.id?.substring(0, 8)}`,
            ),
        },
        {
          text: "Call Helpline",
          onPress: () => Linking.openURL("tel:+918000000000"),
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
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
      {/* 1. Header Order Info */}
      <View style={styles.headerCard}>
        <View style={styles.orderLabelRow}>
          <Ionicons name="cube-outline" size={12} color={Colors.botanical} />
          <Text style={styles.orderLabel}>Live Botanical Order</Text>
        </View>
        <Text style={styles.orderId}>Order #{order.id?.substring(0, 8)}</Text>
        <Text style={styles.orderPlaced}>
          Placed on {formatDate(order.created_at)}
        </Text>
      </View>

      {/* 2. Flipkart-Style Fulfillment Timeline Stepper */}
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

      {/* 3. Ordered Botanical Items */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Ordered Plant Specimens</Text>
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

      {/* 4. Delivery Destination Address */}
      {order.shipping_address && (
        <View style={styles.detailsCard}>
          <View style={styles.addressHeader}>
            <Ionicons name="location-outline" size={16} color={Colors.forest} />
            <Text style={styles.sectionTitle}>Delivery Destination</Text>
          </View>
          <Text style={styles.addressText}>
            {order.shipping_address.street ||
              order.shipping_address.address_line1}
          </Text>
          <Text style={styles.addressCity}>
            {order.shipping_address.city || "Raipur"}, {order.shipping_address.pincode || "492001"}
          </Text>
        </View>
      )}

      {/* 5. Floria Support Action Card */}
      <View style={styles.supportCard}>
        <View style={styles.supportInfo}>
          <Ionicons name="headset-outline" size={22} color={Colors.forest} />
          <View style={styles.supportTextCol}>
            <Text style={styles.supportTitle}>Need Help with this Order?</Text>
            <Text style={styles.supportSub}>Connect with Floria Customer Support for any issues</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSupportContact}
          style={styles.supportBtn}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.forest} />
          <Text style={styles.supportBtnText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
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
  orderLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    width: 24,
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    color: Colors.inkLight,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  timelineLineDone: {
    backgroundColor: Colors.forest,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  timelineTitleCurrent: {
    color: Colors.terracotta,
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
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.xs,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600",
    color: Colors.ink,
  },
  itemQty: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  totalPrice: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    color: Colors.forest,
  },
  addressText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
    lineHeight: 18,
  },
  addressCity: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  supportCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  supportInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  supportTextCol: {
    flex: 1,
  },
  supportTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  supportSub: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  supportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.botanical,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  supportBtnText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
