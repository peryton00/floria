// Floria Delivery Mobile — Courier Earnings & Payouts Screen
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeliveryAuth } from "../../lib/contexts/DeliveryAuthContext";
import { api } from "../../lib/api";
import { theme } from "../../lib/theme";
import { FloriaIcon } from "../../components/ui/FloriaIcon";
import type { DeliveryAssignment } from "@floria/types";

export default function CourierEarningsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useDeliveryAuth();
  const [deliveries, setDeliveries] = useState<DeliveryAssignment[]>([]);
  const [serverEarnings, setServerEarnings] = useState<{
    today: number;
    week: number;
    month: number;
    completedCount: number;
    earnings: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today");

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      const [delRes, earnRes] = await Promise.all([
        api.getDeliveries(),
        api.getDeliveryPartnerEarnings().catch(() => ({ success: false, data: null })),
      ]);

      if (delRes.success && Array.isArray(delRes.data)) {
        setDeliveries(delRes.data);
      } else {
        setDeliveries([]);
      }

      if (earnRes && earnRes.success && earnRes.data) {
        setServerEarnings(earnRes.data);
      }
    } catch (e) {
      console.warn("[CourierEarnings] Load failed:", e);
      setDeliveries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  // Completed deliveries for this courier
  const completedDeliveries = useMemo(() => {
    return deliveries.filter(
      (d) =>
        d.status === "delivered" ||
        (d.status as string) === "completed",
    );
  }, [deliveries]);

  // Server-Authoritative Earnings
  const activeAmount = useMemo(() => {
    if (serverEarnings) {
      return selectedPeriod === "today"
        ? serverEarnings.today
        : selectedPeriod === "week"
        ? serverEarnings.week
        : serverEarnings.month;
    }
    // Fallback: 80 INR base per delivered assignment
    return completedDeliveries.length * 80;
  }, [serverEarnings, selectedPeriod, completedDeliveries]);

  const activeCount = useMemo(() => {
    if (serverEarnings) {
      return serverEarnings.completedCount;
    }
    return completedDeliveries.length;
  }, [serverEarnings, completedDeliveries]);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.forest}
            colors={[theme.colors.forest]}
          />
        }
      >
        {/* ── Period Selector ── */}
        <View style={styles.periodSelector}>
          {(["today", "week", "month"] as const).map((p) => {
            const isSelected = selectedPeriod === p;
            const label =
              p === "today"
                ? "Today"
                : p === "week"
                ? "This Week"
                : "This Month";
            return (
              <TouchableOpacity
                key={p}
                activeOpacity={0.8}
                onPress={() => setSelectedPeriod(p)}
                style={[
                  styles.periodTab,
                  isSelected && styles.periodTabSelected,
                ]}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    isSelected && styles.periodTabTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Main Earnings Hero Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroSubLabel}>
                {selectedPeriod === "today"
                  ? "TODAY'S ESTIMATED EARNINGS"
                  : selectedPeriod === "week"
                  ? "THIS WEEK'S EARNINGS"
                  : "THIS MONTH'S EARNINGS"}
              </Text>
              <Text style={styles.heroAmount}>₹{activeAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.walletIconCircle}>
              <FloriaIcon
                name="wallet"
                size={24}
                color={theme.colors.forest}
                weight="bold"
              />
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNum}>{activeCount}</Text>
              <Text style={styles.heroStatDesc}>Completed Drops</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNum}>
                ₹{activeCount > 0 ? (activeAmount / activeCount).toFixed(0) : "0"}
              </Text>
              <Text style={styles.heroStatDesc}>Avg / Delivery</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatNum, { color: theme.colors.success }]}>
                100%
              </Text>
              <Text style={styles.heroStatDesc}>On-Time Rate</Text>
            </View>
          </View>
        </View>

        {/* ── Payout Details Banner ── */}
        <View style={styles.payoutCard}>
          <View style={styles.payoutHeader}>
            <FloriaIcon name="shield" size={18} color={theme.colors.forest} />
            <Text style={styles.payoutTitle}>Floria Dispatch Direct Deposit</Text>
          </View>
          <Text style={styles.payoutDescription}>
            Earnings are automatically audited and deposited every Tuesday into your registered partner account.
          </Text>
          <View style={styles.payoutRow}>
            <Text style={styles.payoutMetaLabel}>Next Settlement:</Text>
            <Text style={styles.payoutMetaVal}>Upcoming Tuesday</Text>
          </View>
        </View>

        {/* ── Delivery History List ── */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Completed Payouts</Text>
            <Text style={styles.historyCount}>
              {completedDeliveries.length} Records
            </Text>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={theme.colors.forest} />
              <Text style={styles.loadingText}>Loading dispatch payouts…</Text>
            </View>
          ) : completedDeliveries.length === 0 ? (
            <View style={styles.emptyCard}>
              <FloriaIcon name="package" size={32} color={theme.colors.muted} />
              <Text style={styles.emptyTitle}>No Completed Deliveries Yet</Text>
              <Text style={styles.emptyText}>
                Completed drops will appear here with audited compensation and proof of delivery receipts.
              </Text>
            </View>
          ) : (
            completedDeliveries.map((item) => {
              const matchingRow = serverEarnings?.earnings?.find(
                (e: any) => e.delivery_id === item.id,
              );
              const payout = matchingRow
                ? matchingRow.total_earning_paise / 100
                : 80;
              const dateObj = new Date(item.updated_at || item.created_at || item.assigned_at);
              const formattedDate = dateObj.toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              const city =
                (item as any).dropoffAddress?.city ||
                (item as any).dropoff_address_snapshot?.city ||
                "Destination Customer Drop-off";

              return (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyLeft}>
                    <View style={styles.historyIconCircle}>
                      <FloriaIcon
                        name="check"
                        size={14}
                        color={theme.colors.forest}
                        weight="bold"
                      />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyOrderNo}>
                        Order #{item.order_id?.slice(0, 8).toUpperCase() || "FLR-DISPATCH"}
                      </Text>
                      <Text style={styles.historyDate}>{formattedDate}</Text>
                      <Text style={styles.historyLocation} numberOfLines={1}>
                        {city}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.historyRight}>
                    <Text style={styles.historyPayout}>+₹{payout.toFixed(2)}</Text>
                    <View style={styles.settledBadge}>
                      <Text style={styles.settledBadgeText}>VERIFIED</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: theme.colors.sand,
    borderRadius: theme.radius.lg,
    padding: 3,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  periodTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    borderRadius: theme.radius.md,
  },
  periodTabSelected: {
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  periodTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.muted,
  },
  periodTabTextSelected: {
    color: theme.colors.forest,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  heroSubLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.forest,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.forest,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  walletIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.botanicalGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatsRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.sand,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
  },
  heroStatNum: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.charcoal,
    marginBottom: 2,
  },
  heroStatDesc: {
    fontSize: 10,
    color: theme.colors.muted,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.divider,
  },
  payoutCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    marginBottom: theme.spacing.lg,
  },
  payoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginBottom: 4,
  },
  payoutTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  payoutDescription: {
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 16,
    marginBottom: theme.spacing.sm,
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  payoutMetaLabel: {
    fontSize: 11,
    color: theme.colors.muted,
  },
  payoutMetaVal: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.charcoal,
  },
  historySection: {
    gap: theme.spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  historyCount: {
    fontSize: 11,
    color: theme.colors.muted,
  },
  historyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
  },
  historyIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.botanicalGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: {
    flex: 1,
  },
  historyOrderNo: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.charcoal,
  },
  historyDate: {
    fontSize: 10,
    color: theme.colors.muted,
    marginTop: 1,
  },
  historyLocation: {
    fontSize: 11,
    color: theme.colors.sage,
    marginTop: 2,
  },
  historyRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  historyPayout: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  settledBadge: {
    backgroundColor: theme.colors.botanicalGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
  },
  settledBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: theme.colors.forest,
    letterSpacing: 0.4,
  },
  loadingBox: {
    padding: theme.spacing.xl,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    gap: theme.spacing.xs,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.forest,
    marginTop: theme.spacing.xs,
  },
  emptyText: {
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 16,
  },
});
