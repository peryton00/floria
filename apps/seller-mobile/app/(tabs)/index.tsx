import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { SellerMetricCard } from "../../components/seller/SellerMetricCard";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Button } from "../../components/ui/Button";

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { seller, isAuthenticated, isAuthorizedSeller } = useSellerAuth();

  const [dashboard, setDashboard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getSellerDashboard();
      if (res.success && res.data) {
        setDashboard(res.data);
      } else {
        setError(res.error?.message || "Failed to load nursery metrics.");
      }
    } catch (err: any) {
      setError(err.message || "Connection to nursery gateway failed.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.unauthContainer}>
        <Text style={styles.unauthEmoji}>🌱</Text>
        <Text style={styles.unauthTitle}>Nursery Partner Portal</Text>
        <Text style={styles.unauthSubtitle}>
          Sign in to view real-time orders, manage live stock, and prepare plant
          dispatch.
        </Text>
        <Button
          label="Sign In to Nursery"
          onPress={() => router.push("/(auth)/login" as any)}
          style={styles.signInBtn}
        />
      </View>
    );
  }

  if (loading && !refreshing) {
    return <LoadingState message="Connecting to nursery radar..." />;
  }

  if (error && !dashboard) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const kpis = dashboard?.kpis || {
    newOrders: 0,
    preparingOrders: 0,
    readyForPickupOrders: 0,
    lowStockProducts: 0,
    totalRevenuePaise: 0,
    publishedProducts: 0,
  };

  const inventoryAlerts = dashboard?.inventoryAlerts || [];
  const actionItems = dashboard?.actionRequired || [];

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
      {/* Store Header Banner */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={styles.nurseryPre}>Active Nursery Partner</Text>
            <Text style={styles.nurseryName}>
              {seller?.businessName || "My Botanical Nursery"}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>STORE OPEN</Text>
          </View>
        </View>
        <Text style={styles.hyperlocalNote}>
          ⚡ 4-Hour Hyperlocal Courier Dispatch Enabled
        </Text>
      </View>

      {/* Operational Radar Metrics */}
      <Text style={styles.sectionHeading}>Immediate Action Radar</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricRow}>
          <SellerMetricCard
            title="New Orders"
            value={kpis.newOrders}
            subtitle={
              kpis.newOrders > 0 ? "Requires Acceptance" : "All Caught Up"
            }
            variant={kpis.newOrders > 0 ? "alert" : "default"}
            onPress={() => router.push("/(tabs)/orders" as any)}
          />
          <SellerMetricCard
            title="Preparing"
            value={kpis.preparingOrders}
            subtitle="Inspection & Hydration"
            variant={kpis.preparingOrders > 0 ? "default" : "default"}
            onPress={() => router.push("/(tabs)/orders" as any)}
          />
        </View>

        <View style={styles.metricRow}>
          <SellerMetricCard
            title="Ready for Courier"
            value={kpis.readyForPickupOrders}
            subtitle="Awaiting Courier Pickup"
            variant="success"
            onPress={() => router.push("/(tabs)/orders" as any)}
          />
          <SellerMetricCard
            title="Low Stock Alerts"
            value={kpis.lowStockProducts}
            subtitle={
              kpis.lowStockProducts > 0
                ? "Action Recommended"
                : "Optimal Levels"
            }
            variant={kpis.lowStockProducts > 0 ? "alert" : "default"}
            onPress={() => router.push("/(tabs)/inventory" as any)}
          />
        </View>
      </View>

      {/* Action Items List */}
      {actionItems.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>⚠️ Urgent Actions Required</Text>
          {actionItems.map((act: any, idx: number) => (
            <TouchableOpacity
              key={idx}
              onPress={() => router.push("/(tabs)/orders" as any)}
              style={styles.actionRow}
            >
              <Text style={styles.actionIcon}>🚨</Text>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>{act.title}</Text>
                <Text style={styles.actionCount}>
                  {act.count} order(s) pending
                </Text>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Stock Critical Alerts */}
      {inventoryAlerts.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              Critical Botanical Stock ({inventoryAlerts.length})
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/inventory" as any)}
            >
              <Text style={styles.manageLink}>Adjust →</Text>
            </TouchableOpacity>
          </View>
          {inventoryAlerts.slice(0, 3).map((item: any) => (
            <View key={item.id} style={styles.alertItem}>
              <Text style={styles.alertName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.alertStockBadge}>
                <Text style={styles.alertStockText}>
                  {item.stockQuantity <= 0
                    ? "OUT OF STOCK"
                    : `${item.stockQuantity} LEFT`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Revenue Summary */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenuePre}>Settled & Pending Nursery Revenue</Text>
        <Text style={styles.revenueAmount}>
          {formatINR(kpis.totalRevenuePaise || 0)}
        </Text>
        <Text style={styles.revenueFoot}>
          From {kpis.completedOrders || 0} completed plant deliveries
        </Text>
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
  unauthContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.page,
  },
  unauthEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  unauthTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: Spacing.xs,
  },
  unauthSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  signInBtn: {
    minWidth: 200,
  },
  headerCard: {
    backgroundColor: Colors.forest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
  },
  nurseryPre: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.botanical,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nurseryName: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.white,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.white,
  },
  hyperlocalNote: {
    fontSize: 11,
    color: Colors.botanical,
    marginTop: Spacing.sm,
    fontWeight: "500",
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricsGrid: {
    marginBottom: Spacing.md,
  },
  metricRow: {
    flexDirection: "row",
    marginHorizontal: -Spacing.xs,
  },
  sectionCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  manageLink: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.terracotta,
    textTransform: "uppercase",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.xs,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.ink,
  },
  actionCount: {
    fontSize: 10,
    color: Colors.terracotta,
    fontWeight: "600",
  },
  actionArrow: {
    fontSize: 14,
    color: Colors.inkMuted,
  },
  alertItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  alertName: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.ink,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  alertStockBadge: {
    backgroundColor: Colors.warningBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  alertStockText: {
    fontSize: 9,
    fontWeight: "bold",
    color: Colors.warning,
  },
  revenueCard: {
    backgroundColor: Colors.sand,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  revenuePre: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.sage,
    textTransform: "uppercase",
  },
  revenueAmount: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.forest,
    marginVertical: 2,
  },
  revenueFoot: {
    fontSize: 11,
    color: Colors.inkLight,
  },
});
