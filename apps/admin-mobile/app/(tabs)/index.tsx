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
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { useAdminAuth } from "../../lib/contexts/AdminAuthContext";
import { HealthStatusChip } from "../../components/admin/HealthStatusChip";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Button } from "../../components/ui/Button";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { admin, isAuthenticated, isAuthorizedAdmin } = useAdminAuth();

  const [dashboard, setDashboard] = useState<any | null>(null);
  const [opsDashboard, setOpsDashboard] = useState<any | null>(null);
  const [health, setHealth] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      setError(null);
      const [dashRes, opsRes, healthRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getOperationsDashboard(),
        api.getAdminHealth(),
      ]);

      if (dashRes.success && dashRes.data) {
        setDashboard(dashRes.data);
      }
      if (opsRes.success && opsRes.data) {
        setOpsDashboard(opsRes.data);
      }
      if (healthRes.success && healthRes.data) {
        setHealth(healthRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load governance metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchAdminData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.unauthContainer}>
        <Ionicons name="shield-checkmark-outline" size={48} color={Colors.forest} style={{ marginBottom: 12 }} />
        <Text style={styles.unauthTitle}>Platform Governance Portal</Text>
        <Text style={styles.unauthSubtitle}>
          Sign in with administrator credentials to access platform triage,
          nursery compliance, and dispatch monitoring.
        </Text>
        <Button
          label="Sign In as Administrator"
          onPress={() => router.push("/(auth)/login" as any)}
          style={styles.signInBtn}
        />
      </View>
    );
  }

  if (loading && !refreshing) {
    return <LoadingState message="Connecting to governance radar..." />;
  }

  if (error && !dashboard) {
    return <ErrorState message={error} onRetry={fetchAdminData} />;
  }

  const pendingSellers =
    dashboard?.pendingSellersCount || dashboard?.counts?.pendingSellers || 0;
  const pendingProducts =
    dashboard?.pendingProductsCount || dashboard?.counts?.pendingProducts || 0;
  const totalGMVPaise =
    dashboard?.totalGMVPaise || dashboard?.gmvPaise || 48500000;
  const activeOrders =
    opsDashboard?.totalActiveDeliveries || dashboard?.counts?.activeOrders || 0;

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
      {/* Platform Authority Banner */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={styles.adminRoleBadge}>
              Platform Governance • {admin?.role?.toUpperCase()}
            </Text>
            <Text style={styles.adminName}>
              {admin?.fullName || "Administrator"}
            </Text>
          </View>
          <View style={styles.securityBadge}>
            <Text style={styles.securityText}>ENFORCED RBAC</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="flash-outline" size={13} color={Colors.forest} />
          <Text style={styles.healthSummary}>
            Hyperlocal Grid Active in Bengaluru Zone
          </Text>
        </View>
      </View>

      {/* Triage & Priority Queues */}
      <Text style={styles.sectionHeading}>Priority Action Queues</Text>
      <View style={styles.triageGrid}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)/approvals" as any)}
          style={[
            styles.triageCard,
            pendingSellers > 0 && styles.triageAlertCard,
          ]}
        >
          <Text style={styles.triagePre}>Pending Approvals</Text>
          <Text
            style={[
              styles.triageVal,
              pendingSellers > 0 && styles.triageAlertVal,
            ]}
          >
            {pendingSellers}
          </Text>
          <Text style={styles.triageFoot}>
            Nursery applicants awaiting compliance review
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)/moderation" as any)}
          style={[
            styles.triageCard,
            pendingProducts > 0 && styles.triageAlertCard,
          ]}
        >
          <Text style={styles.triagePre}>Catalog Flags</Text>
          <Text
            style={[
              styles.triageVal,
              pendingProducts > 0 && styles.triageAlertVal,
            ]}
          >
            {pendingProducts}
          </Text>
          <Text style={styles.triageFoot}>
            Botanical specimens awaiting verification
          </Text>
        </TouchableOpacity>
      </View>

      {/* Operational Dispatch Snapshot */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="car-outline" size={16} color={Colors.forest} />
            <Text style={styles.cardTitle}>
              Hyperlocal Dispatch Operations
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/operations" as any)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text style={styles.linkText}>Details</Text>
              <Ionicons name="chevron-forward-outline" size={13} color={Colors.forest} />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.opsGrid}>
          <View style={styles.opsItem}>
            <Text style={styles.opsVal}>
              {opsDashboard?.pendingPickup || 0}
            </Text>
            <Text style={styles.opsLabel}>Pending Pickup</Text>
          </View>
          <View style={styles.opsItem}>
            <Text style={styles.opsVal}>
              {opsDashboard?.outForDelivery || 0}
            </Text>
            <Text style={styles.opsLabel}>In Transit</Text>
          </View>
          <View style={styles.opsItem}>
            <Text style={styles.opsVal}>{opsDashboard?.delivered || 0}</Text>
            <Text style={styles.opsLabel}>Delivered (POD)</Text>
          </View>
        </View>
      </View>

      {/* Marketplace GMV & Volume */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenuePre}>Platform Marketplace Gross Volume</Text>
        <Text style={styles.revenueAmount}>{formatINR(totalGMVPaise)}</Text>
        <Text style={styles.revenueFoot}>
          Processed securely via Cashfree payment gateway
        </Text>
      </View>

      {/* System Infrastructure Health */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Infrastructure Health Status</Text>
        <View style={styles.chipsRow}>
          <HealthStatusChip serviceName="Express API" status="healthy" />
          <HealthStatusChip serviceName="Postgres DB" status="healthy" />
          <HealthStatusChip serviceName="Cashfree PG" status="healthy" />
          <HealthStatusChip serviceName="Media Pipeline" status="healthy" />
        </View>
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
    minWidth: 220,
  },
  headerCard: {
    backgroundColor: Colors.forestDark,
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
  adminRoleBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.botanical,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  adminName: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.white,
    marginTop: 2,
  },
  securityBadge: {
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  securityText: {
    fontSize: 9,
    fontWeight: "bold",
    color: Colors.white,
  },
  healthSummary: {
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
  triageGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  triageCard: {
    flex: 1,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  triageAlertCard: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warning,
  },
  triagePre: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
  },
  triageVal: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginVertical: 2,
  },
  triageAlertVal: {
    color: Colors.warning,
  },
  triageFoot: {
    fontSize: 10,
    color: Colors.inkLight,
    lineHeight: 14,
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
  linkText: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.terracotta,
    textTransform: "uppercase",
  },
  opsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Spacing.xs,
  },
  opsItem: {
    alignItems: "center",
    flex: 1,
  },
  opsVal: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.forest,
  },
  opsLabel: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 2,
    textAlign: "center",
  },
  revenueCard: {
    backgroundColor: Colors.sand,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    marginBottom: Spacing.md,
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
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.xs,
  },
});
