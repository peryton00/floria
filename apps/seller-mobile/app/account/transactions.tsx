import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloriaIcon } from "@floria/icons";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR, formatDate } from "../../lib/format";
import { EmptyState } from "../../components/ui/EmptyState";

type FilterTab = "ALL" | "SETTLED" | "PENDING";

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller } = useSellerAuth();

  const [earnings, setEarnings] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterTab>("ALL");

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const [earnRes, payRes] = await Promise.allSettled([
        api.getSellerEarnings(),
        api.getSellerPayouts(),
      ]);

      if (earnRes.status === "fulfilled" && earnRes.value.success) {
        setEarnings(earnRes.value.data);
      }
      if (payRes.status === "fulfilled" && payRes.value.success) {
        const rawPayouts = payRes.value.data;
        if (Array.isArray(rawPayouts)) {
          setPayouts(rawPayouts);
        } else if (rawPayouts && Array.isArray((rawPayouts as any).payouts)) {
          setPayouts((rawPayouts as any).payouts);
        }
      }
    } catch (err) {
      console.warn("[TransactionHistoryScreen] Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, seller?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const settledPaise = earnings?.settled_amount_paise ?? earnings?.settledPaise ?? earnings?.totalNetEarningsPaise ?? 0;
  const pendingPaise = earnings?.pending_settlement_paise ?? earnings?.pendingPaise ?? 0;
  const grossSalesPaise = earnings?.gross_sales_paise ?? earnings?.grossPaise ?? earnings?.totalGrossRevenuePaise ?? (settledPaise + pendingPaise);
  const deductionsPaise = earnings?.marketplace_deductions_paise ?? earnings?.deductionsPaise ?? earnings?.totalCommissionPaise ?? 0;

  // Filter payouts list
  const filteredPayouts = payouts.filter((p) => {
    if (filter === "ALL") return true;
    if (filter === "SETTLED") return p.status === "settled" || p.status === "completed" || p.status === "transferred" || p.status === "success";
    if (filter === "PENDING") return p.status === "pending" || p.status === "processing" || p.status === "initiated";
    return true;
  });

  return (
    <View style={styles.screen}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <FloriaIcon name="arrow_left" size={20} color={Colors.forest} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Transaction History</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.forest} />
          <Text style={styles.loadingText}>Loading transaction ledger...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.forest}
              colors={[Colors.forest]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Financial Overview Grid */}
          <View style={styles.balancesGrid}>
            <View style={[styles.balanceCard, { backgroundColor: Colors.forest }]}>
              <Text style={[styles.balanceLabel, { color: Colors.botanical }]}>
                Total Settled
              </Text>
              <Text style={[styles.balanceValue, { color: Colors.white }]}>
                {formatINR(settledPaise)}
              </Text>
              <Text style={[styles.balanceSub, { color: Colors.botanical }]}>
                Transferred to bank
              </Text>
            </View>

            <View style={[styles.balanceCard, { backgroundColor: Colors.linen }]}>
              <Text style={[styles.balanceLabel, { color: Colors.inkMuted }]}>
                Pending Settlement
              </Text>
              <Text style={[styles.balanceValue, { color: Colors.ink }]}>
                {formatINR(pendingPaise)}
              </Text>
              <Text style={[styles.balanceSub, { color: Colors.inkMuted }]}>
                In transit (T+2 rolling)
              </Text>
            </View>
          </View>

          {/* Secondary Stats Row */}
          <View style={styles.secondaryStatsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Gross Sales</Text>
              <Text style={styles.statBoxValue}>{formatINR(grossSalesPaise)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Marketplace Fees</Text>
              <Text style={styles.statBoxValue}>{formatINR(deductionsPaise)}</Text>
            </View>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFilter("ALL")}
              style={[
                styles.filterChip,
                filter === "ALL" && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === "ALL" && styles.filterChipTextActive,
                ]}
              >
                All Transactions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFilter("SETTLED")}
              style={[
                styles.filterChip,
                filter === "SETTLED" && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === "SETTLED" && styles.filterChipTextActive,
                ]}
              >
                Settled
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFilter("PENDING")}
              style={[
                styles.filterChip,
                filter === "PENDING" && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === "PENDING" && styles.filterChipTextActive,
                ]}
              >
                Pending
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transactions List */}
          <Text style={styles.sectionHeading}>Payout Ledger</Text>

          {filteredPayouts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="wallet"
                title="No Transactions Found"
                description="Payout transfers and settled order funds will appear here as orders are fulfilled and delivered."
              />
            </View>
          ) : (
            filteredPayouts.map((payout, idx) => {
              const amountPaise = payout.amount_paise || payout.amountPaise || 0;
              const isSettled =
                payout.status === "settled" ||
                payout.status === "completed" ||
                payout.status === "transferred" ||
                payout.status === "success";

              return (
                <View key={payout.id || idx} style={styles.payoutCard}>
                  <View style={styles.payoutTop}>
                    <View style={styles.payoutIconWrap}>
                      <FloriaIcon
                        name={isSettled ? "check_circle" : "clock"}
                        size={22}
                        color={isSettled ? Colors.success : "#B45309"}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.payoutTitle}>
                        {payout.transfer_id || payout.reference_id || `Payout #${payout.id?.slice(-6) || idx + 1}`}
                      </Text>
                      <Text style={styles.payoutDate}>
                        {formatDate(payout.created_at || payout.payout_date || new Date())}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.payoutAmount}>
                        {formatINR(amountPaise)}
                      </Text>
                      <View
                        style={[
                          styles.payoutBadge,
                          isSettled ? styles.badgeSuccess : styles.badgePending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.payoutBadgeText,
                            isSettled ? styles.textSuccess : styles.textPending,
                          ]}
                        >
                          {isSettled ? "Settled" : "Processing"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {(payout.utr_number || payout.beneficiary_account) && (
                    <View style={styles.payoutFooter}>
                      {payout.utr_number && (
                        <Text style={styles.payoutUtr}>
                          UTR: {payout.utr_number}
                        </Text>
                      )}
                      {payout.beneficiary_account && (
                        <Text style={styles.payoutBank}>
                          Bank: •••• {payout.beneficiary_account.slice(-4)}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.linen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.page,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topBarTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.forest,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  balancesGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  balanceCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceLabel: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    fontFamily: "Georgia",
  },
  balanceSub: {
    fontSize: 10,
    marginTop: 4,
  },
  secondaryStatsRow: {
    flexDirection: "row",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
  },
  statBoxLabel: {
    fontSize: 11,
    color: Colors.inkMuted,
    fontWeight: "600",
    marginBottom: 2,
  },
  statBoxValue: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forest,
  },
  filterChipText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: "700",
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  emptyWrap: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  payoutCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  payoutTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  payoutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.page,
    justifyContent: "center",
    alignItems: "center",
  },
  payoutTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  payoutDate: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  payoutAmount: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  payoutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  badgeSuccess: {
    backgroundColor: "#DCFCE7",
  },
  badgePending: {
    backgroundColor: "#FEF3C7",
  },
  payoutBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  textSuccess: {
    color: Colors.success,
  },
  textPending: {
    color: "#B45309",
  },
  payoutFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  payoutUtr: {
    fontSize: 10,
    color: Colors.inkMuted,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  payoutBank: {
    fontSize: 10,
    color: Colors.inkMuted,
  },
});
