// Floria Delivery Mobile — Today Screen Operational Workflow (Step 5B.2.1)
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useDeliveries } from "../../lib/hooks/useDeliveries";
import { useDeliveryAuth } from "../../lib/contexts/DeliveryAuthContext";
import { theme } from "../../lib/theme";
import {
  Card,
  Button,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui";
import { DeliveryCard } from "../../components/delivery/DeliveryCard";
import type { DeliveryAssignment } from "@floria/types";

export default function TodayScreen() {
  const router = useRouter();
  const { user } = useDeliveryAuth();
  const { deliveries, loading, error, refresh } = useDeliveries();

  // Compute live operational metrics from authoritative server deliveries
  const {
    assignedCount,
    inTransitCount,
    deliveredCount,
    activeDelivery,
    nextDeliveries,
  } = useMemo(() => {
    const assigned = deliveries.filter((d) => d.status === "assigned");
    const inTransit = deliveries.filter(
      (d) => d.status === "picked_up" || d.status === "out_for_delivery",
    );
    const delivered = deliveries.filter((d) => d.status === "delivered");

    // Priority ordering: out_for_delivery -> picked_up -> earliest assigned
    const sortedActive = [...deliveries]
      .filter((d) => d.status !== "delivered" && d.status !== "failed")
      .sort((a, b) => {
        const score = (status: string) => {
          if (status === "out_for_delivery") return 3;
          if (status === "picked_up") return 2;
          if (status === "assigned") return 1;
          return 0;
        };
        const diff = score(b.status) - score(a.status);
        if (diff !== 0) return diff;
        return (
          new Date(a.assigned_at).getTime() - new Date(b.assigned_at).getTime()
        );
      });

    return {
      assignedCount: assigned.length,
      inTransitCount: inTransit.length,
      deliveredCount: delivered.length,
      activeDelivery: sortedActive[0] || null,
      nextDeliveries: sortedActive.slice(1),
    };
  }, [deliveries]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          colors={[theme.colors.forest]}
          tintColor={theme.colors.forest}
        />
      }
    >
      {/* Courier Header Banner */}
      <View style={styles.courierBanner}>
        <View style={styles.courierInfo}>
          <Text style={styles.courierLabel}>DISPATCH ROSTER</Text>
          <Text style={styles.courierEmail} numberOfLines={1}>
            {user?.email || "Active Courier"}
          </Text>
        </View>
        <View
          style={styles.dutyPill}
          accessibilityRole="text"
          accessibilityLabel="Duty Status: Active On Duty"
        >
          <View style={styles.dutyDot} />
          <Text style={styles.dutyText}>ON DUTY</Text>
        </View>
      </View>

      {/* KPI Performance Row */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiNumber}>{assignedCount}</Text>
          <Text style={styles.kpiLabel}>Assigned</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiNumber}>{inTransitCount}</Text>
          <Text style={styles.kpiLabel}>In Transit</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiNumber}>{deliveredCount}</Text>
          <Text style={styles.kpiLabel}>Delivered</Text>
        </View>
      </View>

      {/* Content Rendering */}
      {loading && deliveries.length === 0 ? (
        <LoadingState message="Loading today's route manifest..." />
      ) : error ? (
        <ErrorState
          title="Manifest Sync Failed"
          message={error}
          onRetry={refresh}
        />
      ) : activeDelivery ? (
        <>
          {/* Priority Stop Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CURRENT PRIORITY STOP</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/deliveries")}
              accessibilityRole="button"
              accessibilityLabel="View full delivery queue"
            >
              <Text style={styles.viewAllText}>
                QUEUE ({deliveries.length})
              </Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.priorityCard} variant="elevated">
            <View style={styles.cardHeader}>
              <View style={styles.orderBadgeWrapper}>
                <MaterialIcons
                  name="local-shipping"
                  size={18}
                  color={theme.colors.forest}
                />
                <Text style={styles.orderId}>
                  Order #{activeDelivery.order_id}
                </Text>
              </View>
              <StatusBadge status={activeDelivery.status} />
            </View>

            <Text style={styles.cardDetail}>
              {activeDelivery.status === "out_for_delivery"
                ? "Package in vehicle — proceeding to customer address"
                : activeDelivery.status === "picked_up"
                  ? "Nursery order verified — ready to initiate delivery transit"
                  : `Assigned at ${new Date(activeDelivery.assigned_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — pending nursery pickup`}
            </Text>

            <View style={styles.cardDivider} />

            <Button
              label={
                activeDelivery.status === "assigned"
                  ? "PROCEED TO PICKUP"
                  : activeDelivery.status === "picked_up"
                    ? "PROCEED TO TRANSIT"
                    : "PROCEED TO DROP-OFF"
              }
              onPress={() => router.push(`/deliveries/${activeDelivery.id}`)}
              variant="primary"
              size="md"
              icon={
                <MaterialIcons
                  name="arrow-forward"
                  size={16}
                  color={theme.colors.white}
                />
              }
            />
          </Card>

          {/* Upcoming Stops List */}
          {nextDeliveries.length > 0 && (
            <>
              <View style={[styles.sectionHeader, styles.upcomingHeader]}>
                <Text style={styles.sectionTitle}>
                  UPCOMING STOPS ({nextDeliveries.length})
                </Text>
              </View>
              {nextDeliveries.map((d: DeliveryAssignment) => (
                <DeliveryCard
                  key={d.id}
                  delivery={d}
                  onPress={() => router.push(`/deliveries/${d.id}`)}
                />
              ))}
            </>
          )}
        </>
      ) : (
        <EmptyState
          title="All Deliveries Completed"
          subtitle="You have completed all assigned deliveries for today or the queue is currently clear."
          iconName="check-circle"
          actionLabel="REFRESH DISPATCH"
          onAction={refresh}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  courierBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  courierInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  courierLabel: {
    ...theme.typography.sectionLabel,
    fontSize: 9,
    marginBottom: 2,
  },
  courierEmail: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  dutyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.botanicalGreen,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radius.full,
    gap: 6,
  },
  dutyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  dutyText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.forest,
    letterSpacing: 0.5,
  },
  kpiRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: theme.colors.linen,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: "center",
    ...theme.shadows.sm,
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  kpiLabel: {
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  upcomingHeader: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.sectionLabel,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.terracotta,
    letterSpacing: 0.5,
  },
  priorityCard: {
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.forest,
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  orderBadgeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  cardDetail: {
    ...theme.typography.subtitle,
    fontSize: 12,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginBottom: theme.spacing.md,
  },
});
