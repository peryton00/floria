import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR, formatDate } from "../../lib/format";
import { EmptyState } from "../../components/ui/EmptyState";

export default function SettlementsScreen() {
  const insets = useSafeAreaInsets();
  const { seller } = useSellerAuth();

  const [earnings, setEarnings] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchSettlementData = useCallback(async () => {
    try {
      setLoading(true);
      const [earnRes, payRes] = await Promise.allSettled([
        api.getSellerEarnings(),
        api.getSellerPayouts(),
      ]);

      if (earnRes.status === "fulfilled" && earnRes.value.success) {
        setEarnings(earnRes.value.data);
      }
      if (payRes.status === "fulfilled" && payRes.value.success && Array.isArray(payRes.value.data)) {
        setPayouts(payRes.value.data);
      }
    } catch (err) {
      console.warn("[SettlementsScreen] Load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlementData();
  }, [fetchSettlementData, seller?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSettlementData();
  };

  const settledPaise = earnings?.settled_amount_paise ?? earnings?.settledPaise ?? 0;
  const pendingPaise = earnings?.pending_settlement_paise ?? earnings?.pendingPaise ?? 0;
  const grossSalesPaise = earnings?.gross_sales_paise ?? earnings?.grossPaise ?? (settledPaise + pendingPaise);
  const deductionsPaise = earnings?.marketplace_deductions_paise ?? earnings?.deductionsPaise ?? 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.forest}
            colors={[Colors.forest]}
          />
        }
      >
        {/* ── Cashfree Gateway Card ── */}
        <View style={styles.gatewayCard}>
          <View style={styles.gatewayHeader}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
            <Text style={styles.gatewayTitle}>Cashfree Marketplace Settlements</Text>
          </View>
          <Text style={styles.gatewaySub}>
            Earnings from fulfilled orders are automatically settled to your verified bank account on a T+2 rolling schedule.
          </Text>
        </View>

        {/* ── Financial Balances ── */}
        <View style={styles.balancesGrid}>
          <View style={[styles.balanceCard, { backgroundColor: Colors.forest }]}>
            <Text style={[styles.balanceLabel, { color: Colors.botanical }]}>
              Settled Amount
            </Text>
            <Text style={[styles.balanceValue, { color: Colors.white }]}>
              {formatINR(settledPaise)}
            </Text>
            <Text style={[styles.balanceSub, { color: Colors.botanical }]}>
              Transferred to bank
            </Text>
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Pending Settlement</Text>
            <Text style={[styles.balanceValue, { color: Colors.terracotta }]}>
              {formatINR(pendingPaise)}
            </Text>
            <Text style={styles.balanceSub}>Next payout batch</Text>
          </View>
        </View>

        {/* ── Summary Breakdown ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Financial Breakdown</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gross Plant Sales</Text>
            <Text style={styles.summaryValue}>{formatINR(grossSalesPaise)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Marketplace Commission & Fees</Text>
            <Text style={[styles.summaryValue, { color: Colors.inkMuted }]}>
              − {formatINR(deductionsPaise)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: "bold" }]}>
              Net Seller Earnings
            </Text>
            <Text style={[styles.summaryValue, { fontWeight: "bold", color: Colors.forest }]}>
              {formatINR(settledPaise + pendingPaise)}
            </Text>
          </View>
        </View>

        {/* ── Payout History ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Payout History</Text>

          {loading && !refreshing ? (
            <ActivityIndicator size="small" color={Colors.forest} style={{ marginTop: 20 }} />
          ) : payouts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={32} color={Colors.sageLight} />
              <Text style={styles.emptyTitle}>No past payouts yet</Text>
              <Text style={styles.emptySubtitle}>
                Bank transfer references will be listed here after order settlements.
              </Text>
            </View>
          ) : (
            payouts.map((p, idx) => (
              <View key={idx} style={styles.payoutRow}>
                <View style={styles.payoutIcon}>
                  <Ionicons name="arrow-up-circle" size={20} color={Colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payoutRef}>
                    Ref: {p.reference_id || `TRX-${idx + 1042}`}
                  </Text>
                  <Text style={styles.payoutDate}>{formatDate(p.created_at)}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.payoutAmount}>
                    {formatINR(p.amount_paise || p.amount || 0)}
                  </Text>
                  <Text style={styles.payoutStatus}>
                    {p.status || "SUCCESS"}
                  </Text>
                </View>
              </View>
            ))
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
  scrollContent: {
    padding: Spacing.md,
  },
  gatewayCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  gatewayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 4,
  },
  gatewayTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  gatewaySub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    lineHeight: 18,
  },
  balancesGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
  },
  balanceValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginVertical: 4,
  },
  balanceSub: {
    fontSize: 10,
    color: Colors.inkMuted,
  },
  card: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  cardHeading: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.ink,
  },
  summaryValue: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600",
    color: Colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  section: {
    marginTop: Spacing.xs,
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
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
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
    marginTop: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    textAlign: "center",
    marginTop: 2,
  },
  payoutRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  payoutIcon: {
    marginRight: Spacing.sm,
  },
  payoutRef: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.ink,
  },
  payoutDate: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  payoutAmount: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  payoutStatus: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.success,
    marginTop: 2,
  },
});
