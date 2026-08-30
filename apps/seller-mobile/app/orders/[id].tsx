import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR, formatDate } from "../../lib/format";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { SellerPendingVerificationShield } from "../../components/seller";

const TIMELINE_STEPS = [
  { key: "placed", label: "Order Placed" },
  { key: "confirmed", label: "Order Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready_for_pickup", label: "Ready for Dispatch" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

export default function SellerOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller } = useSellerAuth();
  const { showSuccess, showError } = useSellerFeedback();

  const isApproved = seller?.status === "approved" || seller?.status === "active";

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [transitioning, setTransitioning] = useState<boolean>(false);

  if (!isApproved) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Colors.forest} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Order Fulfillment</Text>
        </View>
        <SellerPendingVerificationShield
          seller={seller}
          featureName="Order Fulfillment"
        />
      </View>
    );
  }

  // Fulfillment Issue Modal
  const [issueModalVisible, setIssueModalVisible] = useState<boolean>(false);
  const [issueReason, setIssueReason] = useState<string>("");
  const [submittingIssue, setSubmittingIssue] = useState<boolean>(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getSellerOrderById(id);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setOrder(null);
      }
    } catch (err) {
      console.warn("[SellerOrderDetail] Load error:", err);
      setOrder(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder, seller?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  const handleUpdateStatus = async (nextStatus: string) => {
    if (!id) return;
    try {
      setTransitioning(true);
      const res = await api.updateFulfillmentStatus(id, nextStatus);
      if (res.success) {
        showSuccess(`Order updated to ${nextStatus.replace(/_/g, " ")}`);
        await fetchOrder();
      } else {
        showError(res.error?.message || "Failed to update fulfillment status");
      }
    } catch (err: any) {
      showError(err.message || "Failed to update fulfillment status");
    } finally {
      setTransitioning(false);
    }
  };

  const handleReportIssue = async () => {
    if (!issueReason.trim()) {
      showError("Please specify the fulfillment issue reason.");
      return;
    }
    try {
      setSubmittingIssue(true);
      const res = await api.updateFulfillmentStatus(id, "fulfillment_issue");
      if (res.success) {
        showSuccess("Fulfillment issue reported to Floria operations team.");
        setIssueModalVisible(false);
        setIssueReason("");
        await fetchOrder();
      } else {
        showError(res.error?.message || "Failed to report fulfillment issue");
      }
    } catch (err: any) {
      showError(err.message || "Failed to report fulfillment issue");
    } finally {
      setSubmittingIssue(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.centerScreen, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.forest} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.centerScreen, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.inkMuted} />
        <Text style={styles.notFoundText}>Order not found</Text>
        <Button
          label="Back to Orders"
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: Spacing.md }}
        />
      </View>
    );
  }

  const orderId = order.masterOrderId || order.id || id;
  const shortId = orderId.substring(0, 8).toUpperCase();
  const currentStatus = (order.status || "PLACED").toLowerCase();
  const items = order.items || [];
  const customer = order.customer || {};
  const sellerPayout = order.seller_payout_paise ?? order.totalPaise ?? order.subtotalPaise ?? 0;
  const paymentStatus = order.paymentStatus || order.payment_status || "Paid";
  const paymentMethod = order.paymentMethod || order.payment_method || "Online Payment";

  // Calculate timeline progress index
  const getTimelineIndex = () => {
    switch (currentStatus) {
      case "placed":
      case "new":
      case "order placed":
        return 0;
      case "confirmed":
        return 1;
      case "preparing":
      case "processing":
        return 2;
      case "ready_for_pickup":
      case "ready":
      case "ready_for_dispatch":
        return 3;
      case "out_for_delivery":
        return 4;
      case "delivered":
      case "completed":
        return 5;
      default:
        return 0;
    }
  };
  const activeStepIdx = getTimelineIndex();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.forest}
            colors={[Colors.forest]}
          />
        }
      >
        {/* ── Order Header ── */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.orderTitle}>Order #FL-{shortId}</Text>
              <Text style={styles.orderTimestamp}>{formatDate(order.createdAt)}</Text>
            </View>
            <StatusBadge status={order.status || "PLACED"} />
          </View>
        </View>

        {/* ── Customer & Delivery Info ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Delivery Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={Colors.forest} />
            <Text style={styles.infoText}>{customer.name || "Floria Customer"}</Text>
          </View>
          {customer.phone ? (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={Colors.forest} />
              <Text style={styles.infoText}>{customer.phone}</Text>
            </View>
          ) : null}
          {customer.address ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={Colors.forest} />
              <Text style={styles.infoText}>
                {typeof customer.address === "string"
                  ? customer.address
                  : `${customer.address.address_line1 || ""}, ${customer.address.city || ""}, ${customer.address.state || ""} ${customer.address.postal_code || ""}`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Seller Line Items ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Your Nursery Items</Text>
          {items.map((it: any, idx: number) => {
            const prodName = it.product?.name || it.product_name || "Botanical Specimen";
            const price = it.pricePaise || it.unit_price_paise_snapshot || 0;
            return (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemBullet}>
                  <Ionicons name="leaf" size={14} color={Colors.forest} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{prodName}</Text>
                  <Text style={styles.itemQty}>Qty {it.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>{formatINR(price * it.quantity)}</Text>
              </View>
            );
          })}

          <View style={styles.divider} />

          {/* Financials Breakdown */}
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Seller Order Total / Payout</Text>
            <Text style={styles.financialValue}>{formatINR(sellerPayout)}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.financialSubLabel}>Payment Method</Text>
            <Text style={styles.financialSubValue}>{paymentMethod}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.financialSubLabel}>Payment Status</Text>
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>{paymentStatus}</Text>
            </View>
          </View>
        </View>

        {/* ── Order Timeline ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Order Timeline</Text>
          <View style={styles.timeline}>
            {TIMELINE_STEPS.map((step, idx) => {
              const isPast = idx <= activeStepIdx;
              const isCurrent = idx === activeStepIdx;
              return (
                <View key={step.key} style={styles.timelineStep}>
                  <View style={styles.timelineIndicatorCol}>
                    <View
                      style={[
                        styles.timelineDot,
                        isPast && styles.timelineDotActive,
                        isCurrent && styles.timelineDotCurrent,
                      ]}
                    >
                      {isPast && (
                        <Ionicons name="checkmark" size={10} color={Colors.white} />
                      )}
                    </View>
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          isPast && idx < activeStepIdx && styles.timelineLineActive,
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.timelineStepLabel,
                      isPast && styles.timelineStepLabelActive,
                      isCurrent && { fontWeight: "bold" },
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Action Bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {currentStatus === "placed" || currentStatus === "new" || currentStatus === "order placed" ? (
          <View style={styles.actionButtonsRow}>
            <Button
              label="Report Issue"
              variant="outline"
              size="md"
              onPress={() => setIssueModalVisible(true)}
              style={{ flex: 1 }}
            />
            <Button
              label="Accept & Prepare"
              variant="primary"
              size="md"
              loading={transitioning}
              onPress={() => handleUpdateStatus("preparing")}
              style={{ flex: 1.5 }}
            />
          </View>
        ) : currentStatus === "confirmed" ? (
          <Button
            label="Start Preparing Plant"
            variant="primary"
            size="md"
            loading={transitioning}
            onPress={() => handleUpdateStatus("preparing")}
          />
        ) : currentStatus === "preparing" || currentStatus === "processing" ? (
          <View style={styles.actionButtonsRow}>
            <Button
              label="Report Issue"
              variant="outline"
              size="md"
              onPress={() => setIssueModalVisible(true)}
              style={{ flex: 1 }}
            />
            <Button
              label="Mark Ready for Dispatch"
              variant="success"
              size="md"
              loading={transitioning}
              onPress={() => handleUpdateStatus("ready_for_pickup")}
              style={{ flex: 2 }}
            />
          </View>
        ) : currentStatus === "ready_for_pickup" || currentStatus === "ready" ? (
          <View style={styles.statusInfoBox}>
            <Ionicons name="time-outline" size={20} color={Colors.sage} />
            <Text style={styles.statusInfoText}>
              Plant is ready. Waiting for Floria courier pickup & dispatch.
            </Text>
          </View>
        ) : currentStatus === "out_for_delivery" ? (
          <View style={styles.statusInfoBox}>
            <Ionicons name="bicycle-outline" size={20} color={Colors.info} />
            <Text style={styles.statusInfoText}>
              Specimen is currently out for delivery with the courier.
            </Text>
          </View>
        ) : currentStatus === "delivered" || currentStatus === "completed" ? (
          <View style={[styles.statusInfoBox, { backgroundColor: Colors.successBg }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />
            <Text style={[styles.statusInfoText, { color: Colors.success }]}>
              Order completed and delivered to customer.
            </Text>
          </View>
        ) : (
          <View style={[styles.statusInfoBox, { backgroundColor: Colors.errorBg }]}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
            <Text style={[styles.statusInfoText, { color: Colors.error }]}>
              Order status: {order.status || "Cancelled"}
            </Text>
          </View>
        )}
      </View>

      {/* ── Report Issue Modal ── */}
      <Modal
        visible={issueModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIssueModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Text style={styles.modalTitle}>Report Fulfillment Issue</Text>
            <Text style={styles.modalSubtitle}>
              Please detail why this order cannot be fulfilled (e.g. specimen damaged, out of stock, weather delay).
            </Text>

            <TextInput
              value={issueReason}
              onChangeText={setIssueReason}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={Colors.inkSubtle}
              multiline
              numberOfLines={4}
              style={styles.issueInput}
            />

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="outline"
                size="md"
                onPress={() => setIssueModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                label="Submit Issue"
                variant="terracotta"
                size="md"
                loading={submittingIssue}
                onPress={handleReportIssue}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  centerScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.page,
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
    marginTop: Spacing.sm,
  },
  notFoundText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.ink,
    marginTop: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  orderTimestamp: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  cardHeader: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginVertical: 4,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  itemBullet: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.botanical,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  itemName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "Georgia",
  },
  itemQty: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  itemPrice: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 3,
  },
  financialLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  financialValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    color: Colors.forest,
  },
  financialSubLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
  },
  financialSubValue: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.ink,
  },
  paidBadge: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.success,
  },
  timeline: {
    marginTop: Spacing.xs,
  },
  timelineStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 36,
  },
  timelineIndicatorCol: {
    alignItems: "center",
    width: 24,
    marginRight: Spacing.sm,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.sand,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotActive: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forest,
  },
  timelineDotCurrent: {
    borderColor: Colors.terracotta,
    backgroundColor: Colors.terracotta,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  timelineLineActive: {
    backgroundColor: Colors.forest,
  },
  timelineStepLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  timelineStepLabelActive: {
    color: Colors.ink,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.linen,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statusInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.sand,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statusInfoText: {
    flex: 1,
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.forestDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.page,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.md,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.ink,
  },
  modalSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginVertical: Spacing.xs,
    lineHeight: 18,
  },
  issueInput: {
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
    textAlignVertical: "top",
    marginVertical: Spacing.md,
    minHeight: 90,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.page,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  pageTitle: {
    fontSize: Typography.fontSizes.lg,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.forest,
  },
});
