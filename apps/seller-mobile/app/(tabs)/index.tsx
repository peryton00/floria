import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloriaIcon } from "@floria/icons";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerNotifications } from "../../lib/contexts/SellerNotificationContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { HomeSkeleton } from "../../components/ui/Skeletons";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SellerPendingVerificationShield } from "../../components/seller";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING,";
  if (hour < 17) return "GOOD AFTERNOON,";
  return "GOOD EVENING,";
}

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
        api.getSellerOrders({ limit: 9 }),
        api.getSellerInventory(),
      ]);

      if (
        dashRes.status === "fulfilled" &&
        dashRes.value.success &&
        dashRes.value.data
      ) {
        setDashboardData(dashRes.value.data);
      }

      let ordersList: any[] = [];
      if (
        ordersRes.status === "fulfilled" &&
        ordersRes.value.success &&
        Array.isArray(ordersRes.value.data)
      ) {
        ordersList = ordersRes.value.data;
        setRecentOrders(ordersList);
        const prep = ordersList.filter((o) => {
          const st = String(o.status || "").toLowerCase();
          return (
            st === "preparing" ||
            st === "placed" ||
            st === "new" ||
            st === "order placed" ||
            st === "nursery confirmed" ||
            st === "seller_pending"
          );
        }).length;
        setToPrepareCount(prep);
      }

      if (
        inventoryRes.status === "fulfilled" &&
        inventoryRes.value.success &&
        Array.isArray(inventoryRes.value.data)
      ) {
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

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboard(),
      refreshProfile(),
      refreshNotifications(),
    ]);
  };

  const isApproved =
    seller?.status === "approved" || seller?.status === "active";

  if (authLoading || (loading && !dashboardData && recentOrders.length === 0)) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <Image
              source={require("../../assets/images/floria_mark.png")}
              style={styles.logoMark}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>Floria</Text>
          </View>
        </View>
        <HomeSkeleton />
      </View>
    );
  }

  // Today metrics
  const todayOrders =
    dashboardData?.todayOrders ??
    recentOrders.filter((o) => {
      const created = new Date(o.createdAtTimestamp || o.created_at || Date.now());
      const now = new Date();
      return (
        created.getDate() === now.getDate() &&
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length;

  const todaySalesPaise =
    dashboardData?.todaySalesPaise ??
    dashboardData?.revenuePaise ??
    recentOrders.reduce((sum, o) => {
      const created = new Date(o.createdAtTimestamp || o.created_at || Date.now());
      const now = new Date();
      if (
        created.getDate() === now.getDate() &&
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      ) {
        return (
          sum +
          (o.seller_payout_paise ?? o.totalPaise ?? o.subtotalPaise ?? 0)
        );
      }
      return sum;
    }, 0);

  const sellerDisplayName =
    seller?.businessName || seller?.username || "Nursery Partner";

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── 1. Compact Header: [Floria Logo] Floria       [Notification] ── */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <Image
            source={require("../../assets/images/floria_mark.png")}
            style={styles.logoMark}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>Floria</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/notifications" as any)}
          style={styles.notificationButton}
          accessibilityLabel="Notifications"
        >
          <FloriaIcon name="bell" size={20} color={Colors.forest} />
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.forest}
            colors={[Colors.forest]}
          />
        }
      >
        {/* ── 2. Greeting Section ── */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingPre}>{getTimeGreeting()}</Text>
          <Text style={styles.greetingName} numberOfLines={1}>
            {sellerDisplayName}
          </Text>
        </View>

        {/* Verification Shield if unapproved */}
        {!isApproved && (
          <View style={{ marginBottom: Spacing.md }}>
            <SellerPendingVerificationShield seller={seller} inline={true} />
          </View>
        )}

        {/* ── 3. TODAY Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderLabel}>TODAY</Text>
          <View style={styles.todayCardsRow}>
            {/* Orders Card */}
            <View style={styles.todayCard}>
              <View style={styles.todayCardHeader}>
                <Text style={styles.todayCardTitle}>ORDERS</Text>
                <FloriaIcon name="orders" size={16} color={Colors.sage} />
              </View>
              <Text style={styles.todayCardValue}>{todayOrders}</Text>
              <Text style={styles.todayCardSublabel}>Today's orders</Text>
            </View>

            {/* Sales Card */}
            <View style={styles.todayCard}>
              <View style={styles.todayCardHeader}>
                <Text style={styles.todayCardTitle}>SALES</Text>
                <FloriaIcon name="receipt" size={16} color={Colors.sage} />
              </View>
              <Text style={styles.todayCardValue} numberOfLines={1}>
                {formatINR(todaySalesPaise)}
              </Text>
              <Text style={styles.todayCardSublabel}>Today's sales</Text>
            </View>
          </View>
        </View>

        {/* ── 4. NEED YOUR ATTENTION Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderLabel}>NEED YOUR ATTENTION</Text>

          {toPrepareCount === 0 && lowStockCount === 0 ? (
            <View style={styles.attentionCleanCard}>
              <View style={styles.cleanCheckCircle}>
                <FloriaIcon name="check" size={16} color={Colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cleanTitle}>You're all caught up</Text>
                <Text style={styles.cleanSubtitle}>
                  No orders or inventory issues need your attention.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.attentionContainer}>
              {toPrepareCount > 0 && (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => router.push("/(tabs)/orders" as any)}
                  style={styles.attentionRow}
                >
                  <View style={styles.attentionCountBadge}>
                    <Text style={styles.attentionCountNumber}>
                      {toPrepareCount}
                    </Text>
                  </View>
                  <Text style={styles.attentionLabel} numberOfLines={1}>
                    Orders awaiting dispatch
                  </Text>
                  <FloriaIcon
                    name="chevron_right"
                    size={16}
                    color={Colors.inkMuted}
                  />
                </TouchableOpacity>
              )}

              {lowStockCount > 0 && (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => router.push("/inventory" as any)}
                  style={[
                    styles.attentionRow,
                    toPrepareCount > 0 && styles.attentionRowDivider,
                  ]}
                >
                  <View
                    style={[
                      styles.attentionCountBadge,
                      { backgroundColor: Colors.warningBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.attentionCountNumber,
                        { color: Colors.warning },
                      ]}
                    >
                      {lowStockCount}
                    </Text>
                  </View>
                  <Text style={styles.attentionLabel} numberOfLines={1}>
                    Products low in stock
                  </Text>
                  <FloriaIcon
                    name="chevron_right"
                    size={16}
                    color={Colors.inkMuted}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── 5. QUICK ACTIONS Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderLabel}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsRow}>
            {/* List Product Action */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/products/new" as any)}
              style={[styles.quickActionTile, styles.quickActionPrimary]}
            >
              <View style={styles.quickActionIconWrapPrimary}>
                <FloriaIcon name="leaf" size={20} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.quickActionTitlePrimary}>List Product</Text>
                <Text style={styles.quickActionSubtitlePrimary}>
                  From canonical catalog
                </Text>
              </View>
            </TouchableOpacity>

            {/* Inventory Action */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/inventory" as any)}
              style={styles.quickActionTile}
            >
              <View style={styles.quickActionIconWrap}>
                <FloriaIcon name="package" size={20} color={Colors.forest} />
              </View>
              <View>
                <Text style={styles.quickActionTitle}>Inventory</Text>
                <Text style={styles.quickActionSubtitle}>
                  Stock & alert limits
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 6. RECENT ORDERS Section (Max 9) ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderLabel}>RECENT ORDERS</Text>
            {recentOrders.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/(tabs)/orders" as any)}
              >
                <Text style={styles.viewMoreHeaderLink}>View all</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyOrdersCard}>
              <FloriaIcon name="orders" size={28} color={Colors.sageLight} />
              <Text style={styles.emptyOrdersTitle}>No orders yet</Text>
              <Text style={styles.emptyOrdersSubtitle}>
                Customer orders placed for your listed botanical specimens will
                appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.ordersListContainer}>
              {recentOrders.slice(0, 9).map((order, idx) => {
                const orderId = order.masterOrderId || order.id || "";
                const shortId = orderId.substring(0, 8).toUpperCase();
                const itemCount = order.items?.length || 1;
                const totalAmount =
                  order.seller_payout_paise ??
                  order.totalPaise ??
                  order.subtotalPaise ??
                  0;
                const statusStr = order.status || "Order Placed";

                return (
                  <TouchableOpacity
                    key={orderId || idx}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/orders/${orderId}` as any)}
                    style={styles.orderCard}
                  >
                    {/* Top Row: #FL-ID and Status Badge */}
                    <View style={styles.orderCardTopRow}>
                      <Text style={styles.orderCardCode}>#FL-{shortId}</Text>
                      <StatusBadge status={statusStr} />
                    </View>

                    {/* Middle Row: Items and Total */}
                    <View style={styles.orderCardMiddleRow}>
                      <Text style={styles.orderCardItemsText}>
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </Text>
                      <Text style={styles.orderCardAmountText}>
                        {formatINR(totalAmount)}
                      </Text>
                    </View>

                    {/* Bottom Row: Status Text and Chevron */}
                    <View style={styles.orderCardBottomRow}>
                      <Text style={styles.orderCardStatusDesc}>
                        {statusStr}
                      </Text>
                      <FloriaIcon
                        name="chevron_right"
                        size={14}
                        color={Colors.inkMuted}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* View More Orders Action at Bottom */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push("/(tabs)/orders" as any)}
                style={styles.viewMoreButton}
              >
                <Text style={styles.viewMoreButtonText}>
                  VIEW MORE ORDERS →
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.page,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoMark: {
    width: 22,
    height: 28,
  },
  brandTitle: {
    fontFamily: "Georgia",
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    color: Colors.forest,
    letterSpacing: -0.3,
  },
  notificationButton: {
    width: 36,
    height: 36,
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
    top: 2,
    right: 2,
    backgroundColor: Colors.terracotta,
    borderRadius: BorderRadius.full,
    minWidth: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  unreadBadgeText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  greetingSection: {
    marginBottom: Spacing.md,
  },
  greetingPre: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  greetingName: {
    fontFamily: "Georgia",
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    color: Colors.forest,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  sectionHeaderLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  viewMoreHeaderLink: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  todayCardsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  todayCard: {
    flex: 1,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  todayCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  todayCardTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  todayCardValue: {
    fontFamily: "Georgia",
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.forest,
    marginVertical: 2,
  },
  todayCardSublabel: {
    fontSize: 10,
    color: Colors.inkLight,
    fontWeight: "500",
  },
  attentionCleanCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  cleanCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.successBg,
    alignItems: "center",
    justifyContent: "center",
  },
  cleanTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  cleanSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
    marginTop: 2,
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
    gap: Spacing.sm,
  },
  attentionRowDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attentionCountBadge: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.terracottaLight + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  attentionCountNumber: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.terracotta,
  },
  attentionLabel: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600",
    color: Colors.ink,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  quickActionTile: {
    flex: 1,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  quickActionPrimary: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forestDark,
  },
  quickActionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.page,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionIconWrapPrimary: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.forestLight,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  quickActionTitlePrimary: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.white,
  },
  quickActionSubtitle: {
    fontSize: 10,
    color: Colors.inkLight,
    marginTop: 2,
  },
  quickActionSubtitlePrimary: {
    fontSize: 10,
    color: Colors.botanical,
    marginTop: 2,
  },
  ordersListContainer: {
    gap: Spacing.sm,
  },
  orderCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  orderCardCode: {
    fontFamily: "Georgia",
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  orderCardMiddleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  orderCardItemsText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
  },
  orderCardAmountText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  orderCardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border + "80",
  },
  orderCardStatusDesc: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
  viewMoreButton: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  viewMoreButtonText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "800",
    color: Colors.forest,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  emptyOrdersCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  emptyOrdersTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  emptyOrdersSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
    textAlign: "center",
    maxWidth: 240,
  },
});
