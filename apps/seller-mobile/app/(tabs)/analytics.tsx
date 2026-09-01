import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { api } from "../../lib/api";
import { FloriaIcon } from "../../components/ui/FloriaIcon";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { AnalyticsSkeleton } from "../../components/ui/Skeletons";
import { EmptyState } from "../../components/ui/EmptyState";
import { SellerPendingVerificationShield } from "../../components/seller";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "12m", label: "12M" },
];

export default function SellerAnalyticsScreen() {
  const { seller } = useSellerAuth();

  const [activeRange, setActiveRange] = useState<string>("30d");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const isApproved =
    seller?.status === "approved" || seller?.status === "active";

  const fetchAnalytics = useCallback(async () => {
    if (!isApproved) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getSellerAnalytics({ range: activeRange });
      if (res.success && res.data) {
        setAnalyticsData(res.data);
      } else {
        setAnalyticsData(null);
      }
    } catch (err) {
      console.warn("[SellerAnalytics] Load error:", err);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeRange, isApproved]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, seller?.id]);

  if (!isApproved) {
    return (
      <View style={styles.screen}>
        <SellerPendingVerificationShield
          seller={seller}
          featureName="Business Analytics"
        />
      </View>
    );
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  // Authoritative Metrics Extraction
  const summary = analyticsData?.summary || {};
  const revenuePaise =
    summary.grossRevenuePaise ??
    analyticsData?.revenue_paise ??
    analyticsData?.totalRevenuePaise ??
    0;
  const ordersCount =
    summary.ordersCount ??
    analyticsData?.orders_count ??
    analyticsData?.totalOrders ??
    0;
  const itemsSold =
    summary.unitsSold ??
    analyticsData?.items_sold ??
    analyticsData?.itemsSold ??
    0;
  const aovPaise =
    ordersCount > 0 ? Math.round(revenuePaise / ordersCount) : 0;

  const topProducts =
    analyticsData?.topProducts ||
    analyticsData?.top_products ||
    analyticsData?.topSellingPlants ||
    [];

  const categories =
    analyticsData?.categories ||
    analyticsData?.category_breakdown ||
    [];

  const rawSeries =
    analyticsData?.series ||
    analyticsData?.daily_trend ||
    analyticsData?.trend ||
    [];

  const trendData = rawSeries.map((item: any, idx: number) => {
    const dateStr = item.date || item.label || `${idx + 1}`;
    const dateParts = dateStr.split("-");
    const label =
      dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : dateStr;
    return {
      label,
      revenuePaise: item.grossRevenuePaise ?? item.revenue_paise ?? 0,
      ordersCount: item.ordersCount ?? item.orders ?? 0,
    };
  });

  const hasData =
    revenuePaise > 0 ||
    ordersCount > 0 ||
    itemsSold > 0 ||
    topProducts.length > 0;

  return (
    <View style={styles.screen}>
      {/* ── Range Selector ── */}
      <View style={styles.rangeContainer}>
        {RANGES.map((range) => {
          const isActive = activeRange === range.key;
          return (
            <TouchableOpacity
              key={range.key}
              activeOpacity={0.8}
              onPress={() => setActiveRange(range.key)}
              style={[styles.rangeTab, isActive && styles.activeRangeTab]}
            >
              <Text
                style={[
                  styles.rangeTabText,
                  isActive && styles.activeRangeTabText,
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
        {loading && !refreshing ? (
          <AnalyticsSkeleton />
        ) : !hasData ? (
          <EmptyState
            icon="bar-chart-outline"
            title="Not enough data yet"
            description="Your business performance insights and sales volume will appear as you start fulfilling orders."
          />
        ) : (
          <>
            {/* ── 4 KPI Cards Grid ── */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Revenue</Text>
                <Text style={styles.kpiValue}>{formatINR(revenuePaise)}</Text>
                <Text style={styles.kpiSub}>Gross sales volume</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Orders</Text>
                <Text style={styles.kpiValue}>{ordersCount}</Text>
                <Text style={styles.kpiSub}>Verified orders</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Plants Sold</Text>
                <Text style={styles.kpiValue}>{itemsSold}</Text>
                <Text style={styles.kpiSub}>Item quantities</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Avg Order Value</Text>
                <Text style={styles.kpiValue}>{formatINR(aovPaise)}</Text>
                <Text style={styles.kpiSub}>Per customer basket</Text>
              </View>
            </View>

            {/* ── Visual Trend Bars ── */}
            {trendData.length > 0 && (
              <View style={styles.trendSection}>
                <Text style={styles.sectionHeading}>Sales Trend (₹)</Text>
                <View style={styles.trendCard}>
                  <View style={styles.barsContainer}>
                    {trendData.map((item: any, idx: number) => {
                      const maxVal = Math.max(
                        ...trendData.map(
                          (d: any) => d.revenuePaise || 1,
                        ),
                      );
                      const currentVal = item.revenuePaise || 0;
                      const heightPercent = Math.max(
                        14,
                        Math.round((currentVal / maxVal) * 100),
                      );

                      return (
                        <View key={idx} style={styles.barColumn}>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                { height: `${heightPercent}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.barLabel}>{item.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* ── Top Selling Botanical Varieties ── */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Top Selling Varieties</Text>
              <View style={styles.topPlantsContainer}>
                {topProducts.length === 0 ? (
                  <Text style={styles.noTopProductsText}>
                    Top product rankings will calibrate once order volume increases.
                  </Text>
                ) : (
                  topProducts.map((prod: any, index: number) => {
                    const plantName =
                      prod.name || prod.product_name || `Plant #${index + 1}`;
                    const count = prod.quantity || prod.units_sold || 0;
                    const totalRevenue =
                      prod.revenuePaise ?? prod.total_revenue_paise ?? 0;

                    return (
                      <View key={index} style={styles.topPlantRow}>
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankBadgeText}>{index + 1}</Text>
                        </View>

                        <View style={styles.plantInfo}>
                          <Text style={styles.plantNameText} numberOfLines={1}>
                            {plantName}
                          </Text>
                          <Text style={styles.plantQuantityText}>
                            {count} {count === 1 ? "plant sold" : "plants sold"}
                          </Text>
                        </View>

                        <Text style={styles.plantRevenueText}>
                          {formatINR(totalRevenue)}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            {/* ── Category Breakdown ── */}
            {categories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Category Breakdown</Text>
                <View style={styles.topPlantsContainer}>
                  {categories.map((cat: any, index: number) => {
                    const catName = cat.name || "Uncategorized";
                    const count = cat.quantity || 0;
                    const totalRevenue = cat.revenuePaise || 0;

                    return (
                      <View key={index} style={styles.topPlantRow}>
                        <View
                          style={[
                            styles.rankBadge,
                            { backgroundColor: Colors.sand },
                          ]}
                        >
                          <FloriaIcon
                            name="leaf"
                            size={12}
                            color={Colors.forest}
                          />
                        </View>

                        <View style={styles.plantInfo}>
                          <Text
                            style={styles.plantNameText}
                            numberOfLines={1}
                          >
                            {catName}
                          </Text>
                          <Text style={styles.plantQuantityText}>
                            {count} {count === 1 ? "plant sold" : "plants sold"}
                          </Text>
                        </View>

                        <Text style={styles.plantRevenueText}>
                          {formatINR(totalRevenue)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  topBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.page,
  },
  pageTitle: {
    fontSize: Typography.fontSizes.lg,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.forest,
  },
  rangeContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.page,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeRangeTab: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forestDark,
  },
  rangeTabText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
  activeRangeTabText: {
    color: Colors.white,
    fontWeight: "700",
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
  },
  kpiValue: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.forest,
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 10,
    color: Colors.inkLight,
  },
  trendSection: {
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
  trendCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
    paddingTop: Spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barTrack: {
    flex: 1,
    width: 14,
    backgroundColor: Colors.sand,
    borderRadius: BorderRadius.full,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    backgroundColor: Colors.forest,
    borderRadius: BorderRadius.full,
    width: "100%",
  },
  barLabel: {
    fontSize: 9,
    color: Colors.inkMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  topPlantsContainer: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  noTopProductsText: {
    padding: Spacing.md,
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    textAlign: "center",
  },
  topPlantRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.botanical,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.forestDark,
  },
  plantInfo: {
    flex: 1,
    paddingRight: Spacing.xs,
  },
  plantNameText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "Georgia",
  },
  plantQuantityText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  plantRevenueText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
});
