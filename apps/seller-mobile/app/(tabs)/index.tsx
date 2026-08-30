import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerNotifications } from "../../lib/contexts/SellerNotificationContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { HomeSkeleton } from "../../components/ui/Skeletons";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";

export default function SellerHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller, isLoading: authLoading, refreshProfile } = useSellerAuth();
  const { unreadCount, refreshNotifications } = useSellerNotifications();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [toPrepareCount, setToPrepareCount] = useState<number>(0);

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashRes, ordersRes, inventoryRes] = await Promise.allSettled([
        api.getSellerDashboard(),
        api.getSellerOrders({ limit: 5 }),
        api.getSellerInventory(),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.success && dashRes.value.data) {
        setDashboardData(dashRes.value.data);
      }

      let ordersList: any[] = [];
      if (ordersRes.status === "fulfilled" && ordersRes.value.success && Array.isArray(ordersRes.value.data)) {
        ordersList = ordersRes.value.data;
        setRecentOrders(ordersList);
        const prep = ordersList.filter(
          (o) =>
            o.status?.toLowerCase() === "preparing" ||
            o.status?.toLowerCase() === "placed" ||
            o.status?.toLowerCase() === "new" ||
            o.status?.toLowerCase() === "order placed",
        ).length;
        setToPrepareCount(prep);
      }

      if (inventoryRes.status === "fulfilled" && inventoryRes.value.success && Array.isArray(inventoryRes.value.data)) {
        const low = inventoryRes.value.data.filter((item: any) => {
          const qty = item.stock_quantity ?? item.quantity ?? 0;
          const thresh = item.low_stock_threshold ?? 5;
          return qty > 0 && qty <= thresh;
        }).length;
        setLowStockCount(low);
      }
    } catch (err) {
      console.warn("[SellerHome] Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, seller?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboard(), refreshProfile(), refreshNotifications()]);
  };

  if (authLoading || (loading && !dashboardData && recentOrders.length === 0)) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.nurseryGreeting}>Good day,</Text>
            <Text style={styles.nurseryName}>
              {seller?.businessName || "Your Nursery"}
            </Text>
          </View>
        </View>
        <HomeSkeleton />
      </View>
    );
  }

  // Determine State
  const onboardingStatus = seller?.onboardingStatus || "incomplete";
  const isApproved = seller?.status === "approved";
  const productCount = seller?.productCount ?? (dashboardData?.totalProducts || 0);

  // Today's Stats
  const todayOrders = dashboardData?.todayOrders ?? recentOrders.length;
  const todaySalesPaise = dashboardData?.todaySalesPaise ?? dashboardData?.revenuePaise ?? 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Compact Header ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.nurseryGreeting}>Good morning,</Text>
          <Text style={styles.nurseryName} numberOfLines={1}>
            {seller?.businessName || "Your Nursery"}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/notifications" as any)}
          style={styles.bellButton}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color={Colors.forest} />
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.forest}
            colors={[Colors.forest]}
          />
        }
      >
        {/* ── Account Lifecycle Banners ── */}
        {onboardingStatus === "incomplete" && (
          <View style={styles.stateBannerWarning}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="alert-circle" size={20} color={Colors.warning} />
              <Text style={styles.stateBannerTitle}>Complete your seller setup</Text>
            </View>
            <Text style={styles.stateBannerText}>
              Finish registering your nursery location and settlement account to begin receiving orders.
            </Text>
            <Button
              label="Complete Setup"
              variant="terracotta"
              size="sm"
              onPress={() => router.push("/onboarding" as any)}
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        )}

        {onboardingStatus === "under_review" && (
          <View style={styles.stateBannerInfo}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="hourglass-outline" size={20} color={Colors.info} />
              <Text style={styles.stateBannerTitle}>Your application is under review</Text>
            </View>
            <Text style={styles.stateBannerText}>
              Our botanical partner team is verifying your nursery details. You will receive an alert once approved.
            </Text>
          </View>
        )}

        {onboardingStatus === "needs_correction" && (
          <View style={styles.stateBannerError}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="alert-circle" size={20} color={Colors.error} />
              <Text style={styles.stateBannerTitle}>Action required</Text>
            </View>
            <Text style={styles.stateBannerText}>
              {seller?.correctionReason ||
                "We need additional information to verify your nursery. Please update your details."}
            </Text>
            <Button
              label="Fix issue"
              variant="terracotta"
              size="sm"
              onPress={() => router.push("/onboarding" as any)}
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        )}

        {isApproved && productCount === 0 && (
          <View style={styles.stateBannerSuccess}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.stateBannerTitle}>You're ready to sell</Text>
            </View>
            <Text style={styles.stateBannerText}>
              Your nursery is approved. Add your first botanical listing from the Floria canonical catalog.
            </Text>
            <Button
              label="+ Add your first plant"
              variant="primary"
              size="sm"
              onPress={() => router.push("/products/new" as any)}
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        )}

        {/* ── Today's Overview (2x2 Grid) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Today's overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Orders</Text>
              <Text style={styles.overviewValue}>{todayOrders}</Text>
              <Text style={styles.overviewTrend}>↑ Today's volume</Text>
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Sales</Text>
              <Text style={styles.overviewValue}>{formatINR(todaySalesPaise)}</Text>
              <Text style={styles.overviewTrend}>↑ Gross payout</Text>
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>To prepare</Text>
              <Text
                style={[
                  styles.overviewValue,
                  toPrepareCount > 0 && { color: Colors.terracotta },
                ]}
              >
                {toPrepareCount}
              </Text>
              <Text style={styles.overviewTrend}>Awaiting dispatch</Text>
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Low stock</Text>
              <Text
                style={[
                  styles.overviewValue,
                  lowStockCount > 0 && { color: Colors.warning },
                ]}
              >
                {lowStockCount}
              </Text>
              <Text style={styles.overviewTrend}>Needs restock</Text>
            </View>
          </View>
        </View>

        {/* ── Needs Your Attention ── */}
        {(toPrepareCount > 0 || lowStockCount > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Needs your attention</Text>
            <View style={styles.attentionContainer}>
              {toPrepareCount > 0 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push("/(tabs)/orders" as any)}
                  style={styles.attentionRow}
                >
                  <View style={styles.attentionIconWrap}>
                    <Ionicons name="cube-outline" size={18} color={Colors.terracotta} />
                  </View>
                  <Text style={styles.attentionText}>
                    {toPrepareCount} {toPrepareCount === 1 ? "order needs" : "orders need"} preparation
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
                </TouchableOpacity>
              )}

              {lowStockCount > 0 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push("/inventory" as any)}
                  style={styles.attentionRow}
                >
                  <View style={styles.attentionIconWrap}>
                    <Ionicons name="alert-circle-outline" size={18} color={Colors.warning} />
                  </View>
                  <Text style={styles.attentionText}>
                    {lowStockCount} {lowStockCount === 1 ? "plant is" : "plants are"} running low
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── Recent Orders ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Recent orders</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/orders" as any)}>
              <Text style={styles.seeAllLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={32} color={Colors.sageLight} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>
                New customer orders for your botanical specimens will appear here.
              </Text>
            </View>
          ) : (
            recentOrders.slice(0, 3).map((order) => {
              const orderId = order.masterOrderId || order.id || "";
              const shortId = orderId.substring(0, 8).toUpperCase();
              const itemCount = order.items?.length || 1;
              const subtotal = order.seller_payout_paise ?? order.totalPaise ?? order.subtotalPaise ?? 0;

              return (
                <TouchableOpacity
                  key={orderId}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/orders/${orderId}` as any)}
                  style={styles.orderRow}
                >
                  <View style={styles.orderRowTop}>
                    <Text style={styles.orderCode}>#FL-{shortId}</Text>
                    <StatusBadge status={order.status || "PLACED"} />
                  </View>

                  <View style={styles.orderRowDetails}>
                    <Text style={styles.orderItems}>
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </Text>
                    <Text style={styles.orderAmount}>{formatINR(subtotal)}</Text>
                  </View>

                  <View style={styles.orderRowFooter}>
                    <Text style={styles.orderStatusText}>
                      {order.status || "Preparing"}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.inkMuted} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Quick actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/products/new" as any)}
              style={[styles.quickActionButton, styles.primaryQuickAction]}
            >
              <Ionicons name="add" size={18} color={Colors.white} />
              <Text style={styles.primaryQuickActionText}>Add Plant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/inventory" as any)}
              style={styles.quickActionButton}
            >
              <Ionicons name="file-tray-stacked-outline" size={18} color={Colors.forest} />
              <Text style={styles.quickActionText}>Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/orders" as any)}
              style={styles.quickActionButton}
            >
              <Ionicons name="receipt-outline" size={18} color={Colors.forest} />
              <Text style={styles.quickActionText}>Orders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.page,
  },
  nurseryGreeting: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  nurseryName: {
    fontSize: Typography.fontSizes.lg,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.forest,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.linen,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.terracotta,
    borderRadius: BorderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  stateBannerWarning: {
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  stateBannerInfo: {
    backgroundColor: Colors.infoBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  stateBannerError: {
    backgroundColor: Colors.errorBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  stateBannerSuccess: {
    backgroundColor: Colors.successBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  stateBannerTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  stateBannerText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
    lineHeight: 18,
    marginTop: 4,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  seeAllLink: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  overviewCard: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overviewLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
  },
  overviewValue: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.forest,
    marginVertical: 4,
  },
  overviewTrend: {
    fontSize: 10,
    color: Colors.inkLight,
  },
  attentionContainer: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  attentionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  attentionIconWrap: {
    marginRight: Spacing.sm,
  },
  attentionText: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600",
    color: Colors.ink,
  },
  orderRow: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  orderRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  orderCode: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  orderRowDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  orderItems: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
  },
  orderAmount: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  orderRowFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  orderStatusText: {
    fontSize: 11,
    color: Colors.inkMuted,
    fontWeight: "500",
  },
  emptyCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginTop: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    textAlign: "center",
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primaryQuickAction: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forestDark,
  },
  primaryQuickActionText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.white,
  },
  quickActionText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600",
    color: Colors.forest,
  },
});
