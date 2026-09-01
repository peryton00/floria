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
import { FloriaIcon } from "../../components/ui/FloriaIcon";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR, formatDate } from "../../lib/format";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { SellerPendingVerificationShield } from "../../components/seller";

const TIMELINE_STEPS = [
  { key: "Order Placed", label: "Order Placed" },
  { key: "Nursery Confirmed", label: "Nursery Confirmed" },
  { key: "Preparing", label: "Preparing" },
  { key: "Ready for Pickup", label: "Ready for Pickup" },
  { key: "Picked Up", label: "Picked Up" },
  { key: "Delivered", label: "Delivered" },
];

function getNextSellerStatus(currentStatus: string): string | null {
  const s = (currentStatus || "").trim().toLowerCase();
  if (s === "order placed" || s === "placed" || s === "new") return "Nursery Confirmed";
  if (s === "nursery confirmed" || s === "confirmed") return "Preparing";
  if (s === "preparing" || s === "processing") return "Ready for Pickup";
  if (s === "ready for pickup" || s === "ready" || s === "ready_for_pickup") return "Picked Up";
  return null;
}

function getSellerActionLabel(currentStatus: string): string | null {
  const s = (currentStatus || "").trim().toLowerCase();
  if (s === "order placed" || s === "placed" || s === "new") return "Confirm Order";
  if (s === "nursery confirmed" || s === "confirmed") return "Start Preparing";
  if (s === "preparing" || s === "processing") return "Mark Ready for Pickup";
  if (s === "ready for pickup" || s === "ready" || s === "ready_for_pickup") return "Mark Picked Up";
  return null;
}

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
      <View style={styles.screen}>
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
    const targetOrderId = order?.masterOrderId || order?.id || id;
    if (!targetOrderId) return;
    try {
      setTransitioning(true);
      const res = await api.updateFulfillmentStatus(targetOrderId, nextStatus);
      if (res.success) {
        showSuccess(`Order updated to ${nextStatus}`);
        await fetchOrder();
      } else {
        showError(res.error?.message || `Failed to update fulfillment status to ${nextStatus}`);
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
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={Colors.forest} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerScreen}>
        <FloriaIcon name="warning" size={48} color={Colors.inkMuted} />
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
    const s = (order?.status || "").toLowerCase();
    if (s.includes("placed") || s.includes("new")) return 0;
    if (s.includes("confirmed")) return 1;
    if (s.includes("preparing") || s.includes("processing")) return 2;
    if (s.includes("ready")) return 3;
    if (s.includes("picked")) return 4;
    if (s.includes("deliver") || s.includes("complet")) return 5;
    return 0;
  };
  const activeStepIdx = getTimelineIndex();
  const nextStatus = getNextSellerStatus(order?.status);
  const actionLabel = getSellerActionLabel(order?.status);

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
            <StatusBadge status={order.status || "Order Placed"} />
          </View>
        </View>

        {/* ── Customer & Delivery Info ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Delivery Information</Text>
          <View style={styles.infoRow}>
            <FloriaIcon name="user" size={16} color={Colors.forest} />
            <Text style={styles.infoText}>{customer.name || "Floria Customer"}</Text>
          </View>
          {customer.phone ? (
            <View style={styles.infoRow}>
              <FloriaIcon name="phone" size={16} color={Colors.forest} />
              <Text style={styles.infoText}>{customer.phone}</Text>
            </View>
          ) : null}
          {customer.address ? (
            <View style={styles.infoRow}>
              <FloriaIcon name="nursery" size={16} color={Colors.forest} />
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
                  <FloriaIcon name="leaf" size={14} color={Colors.forest} />
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
                        <FloriaIcon name="check" size={10} color={Colors.white} />
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
        {nextStatus && actionLabel ? (
          <View style={styles.actionButtonsRow}>
            <Button
              label="Report Issue"
              variant="outline"
              size="md"
              onPress={() => setIssueModalVisible(true)}
              style={{ flex: 1 }}
            />
            <Button
              label={actionLabel}
              variant="primary"
              size="md"
              loading={transitioning}
              onPress={() => handleUpdateStatus(nextStatus)}
              style={{ flex: 2 }}
            />
          </View>
        ) : currentStatus.includes("picked") ? (
          <View style={styles.statusInfoBox}>
            <FloriaIcon name="package" size={20} color={Colors.info} />
            <Text style={styles.statusInfoText}>
              Package picked up by courier and in transit.
            </Text>
          </View>
        ) : currentStatus.includes("deliver") || currentStatus.includes("complet") ? (
          <View style={[styles.statusInfoBox, { backgroundColor: Colors.successBg }]}>
            <FloriaIcon name="check_circle" size={20} color={Colors.success} />
            <Text style={[styles.statusInfoText, { color: Colors.success }]}>
              Order completed and delivered to customer.
            </Text>
          </View>
        ) : (
          <View style={[styles.statusInfoBox, { backgroundColor: Colors.errorBg }]}>
            <FloriaIcon name="warning" size={20} color={Colors.error} />
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
