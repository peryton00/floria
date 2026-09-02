// Floria Delivery Mobile — Operational Dispatch Dashboard (Home)
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useDeliveries } from "../../lib/hooks/useDeliveries";
import { useDeliveryAuth } from "../../lib/contexts/DeliveryAuthContext";
import { theme } from "../../lib/theme";
import { FloriaIcon } from "../../components/ui/FloriaIcon";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { DeliveryCard } from "../../components/delivery/DeliveryCard";
import type { DeliveryAssignment } from "@floria/types";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function TodayScreen() {
  const router = useRouter();
  const { user } = useDeliveryAuth();
  const { deliveries, loading, error, refresh } = useDeliveries();
  const [onDuty, setOnDuty] = useState(true);

  // Compute live operational metrics from authoritative server deliveries
  const {
    assignedCount,
    inTransitCount,
    deliveredCount,
    activeDelivery,
    todayEarnings,
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
          new Date(a.assigned_at || (a as any).createdAt || 0).getTime() -
          new Date(b.assigned_at || (b as any).createdAt || 0).getTime()
        );
      });

    const earnings = delivered.reduce((acc, d) => {
      const items = (d as any).packagesCount || (d as any).orderItemCount || 1;
      return acc + (80 + (items > 1 ? (items - 1) * 20 : 0));
    }, 0);

    return {
      assignedCount: assigned.length,
      inTransitCount: inTransit.length,
      deliveredCount: delivered.length,
      activeDelivery: sortedActive[0] || null,
      todayEarnings: earnings,
      nextDeliveries: sortedActive.slice(1),
    };
  }, [deliveries]);

  const courierName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Courier";

  const handleNavigate = (addressStr?: string) => {
    if (!addressStr) return;
    const query = encodeURIComponent(addressStr);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url).catch(() => {});
  };

  const activeOrderId =
    activeDelivery?.order_id?.slice(0, 8).toUpperCase() ||
    (activeDelivery as any)?.orderId?.slice(0, 8).toUpperCase() ||
    "FLR-DISPATCH";

  const pickupName =
    (activeDelivery as any)?.pickupAddress?.fullName ||
    (activeDelivery as any)?.pickup_address_snapshot?.full_name ||
    "Botanical Nursery Hub";

  const pickupAddr =
    (activeDelivery as any)?.pickupAddress?.addressLine1 ||
    (activeDelivery as any)?.pickup_address_snapshot?.address_line1 ||
    "Regional Plant Facility";

  const dropoffName =
    (activeDelivery as any)?.dropoffAddress?.fullName ||
    (activeDelivery as any)?.dropoff_address_snapshot?.full_name ||
    "Customer Destination";

  const dropoffAddr =
    (activeDelivery as any)?.dropoffAddress?.addressLine1 ||
    (activeDelivery as any)?.dropoff_address_snapshot?.address_line1 ||
    "Customer Drop-off Address";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          colors={[theme.colors.forest]}
          tintColor={theme.colors.forest}
        />
      }
    >
      {/* ── 1. Header Greeting & Online Status ── */}
      <View style={styles.headerRow}>
        <View style={styles.courierInfo}>
          <View style={styles.logoBadgeRow}>
            <Image
              source={require("../../assets/images/floria_mark.png")}
              style={styles.floriaMark}
              resizeMode="contain"
            />
            <Text style={styles.greetingPre}>{getTimeGreeting()},</Text>
          </View>
          <Text style={styles.courierName} numberOfLines={1}>
            {courierName}
          </Text>
        </View>

        {/* Duty Toggle Pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.dutyPill, onDuty ? styles.dutyPillOn : styles.dutyPillOff]}
          onPress={() => setOnDuty(!onDuty)}
        >
          <View
            style={[
              styles.dutyDot,
              onDuty ? styles.dutyDotOn : styles.dutyDotOff,
            ]}
          />
          <Text style={[styles.dutyText, onDuty ? styles.dutyTextOn : styles.dutyTextOff]}>
            {onDuty ? "ONLINE" : "OFFLINE"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── 2. TODAY Summary KPIs ── */}
      <View style={styles.todaySection}>
        <Text style={styles.sectionLabel}>TODAY'S ACTIVITY</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>{assignedCount}</Text>
            <Text style={styles.kpiDesc}>Assigned</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: theme.colors.forest }]}>
              {deliveredCount}
            </Text>
            <Text style={styles.kpiDesc}>Completed</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: theme.colors.terracotta }]}>
              ₹{todayEarnings.toFixed(0)}
            </Text>
            <Text style={styles.kpiDesc}>Earnings</Text>
          </View>
        </View>
      </View>

      {/* ── 3. Current Delivery (Primary Operational Hero) ── */}
      <View style={styles.currentSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>CURRENT DELIVERY</Text>
          {activeDelivery && (
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/deliveries`)}
            >
              <Text style={styles.viewQueueText}>
                Queue ({deliveries.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {activeDelivery ? (
          <View style={styles.activeCard}>
            {/* Card Header */}
            <View style={styles.activeHeader}>
              <View style={styles.activeOrderInfo}>
                <Text style={styles.activeOrderLabel}>ORDER DISPATCH</Text>
                <Text style={styles.activeOrderId}>
                  #{activeOrderId}
                </Text>
              </View>
              <StatusBadge status={activeDelivery.status} />
            </View>

            {/* Stops Timeline */}
            <View style={styles.stopsTimeline}>
              {/* Pickup Stop */}
              <View style={styles.stopRow}>
                <View style={styles.stopIconCircle}>
                  <FloriaIcon name="hub" size={14} color={theme.colors.forest} />
                </View>
                <View style={styles.stopDetails}>
                  <Text style={styles.stopTypeLabel}>1. NURSERY PICKUP</Text>
                  <Text style={styles.stopName} numberOfLines={1}>
                    {pickupName}
                  </Text>
                  <Text style={styles.stopAddress} numberOfLines={1}>
                    {pickupAddr}
                  </Text>
                </View>
              </View>

              <View style={styles.timelineConnector} />

              {/* Drop-off Stop */}
              <View style={styles.stopRow}>
                <View
                  style={[
                    styles.stopIconCircle,
                    { backgroundColor: theme.colors.botanicalGreen },
                  ]}
                >
                  <FloriaIcon name="map_pin" size={14} color={theme.colors.forest} />
                </View>
                <View style={styles.stopDetails}>
                  <Text style={styles.stopTypeLabel}>2. CUSTOMER DROP-OFF</Text>
                  <Text style={styles.stopName} numberOfLines={1}>
                    {dropoffName}
                  </Text>
                  <Text style={styles.stopAddress} numberOfLines={1}>
                    {dropoffAddr}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.activeActionsRow}>
              {/* Navigate Action */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.navigateBtn}
                onPress={() => {
                  const targetAddress =
                    activeDelivery.status === "assigned"
                      ? pickupAddr
                      : dropoffAddr;
                  handleNavigate(targetAddress);
                }}
              >
                <FloriaIcon
                  name="navigation"
                  size={16}
                  color={theme.colors.forest}
                  weight="bold"
                />
                <Text style={styles.navigateBtnText}>
                  {activeDelivery.status === "assigned"
                    ? "NAVIGATE TO PICKUP"
                    : "NAVIGATE TO CUSTOMER"}
                </Text>
              </TouchableOpacity>

              {/* View / Update Action */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.openDetailBtn}
                onPress={() =>
                  router.push(`/deliveries/${activeDelivery.id}` as any)
                }
              >
                <Text style={styles.openDetailBtnText}>
                  {activeDelivery.status === "assigned"
                    ? "ACCEPT / ARRIVE"
                    : activeDelivery.status === "picked_up"
                    ? "START ROUTE"
                    : "COMPLETE (POD)"}
                </Text>
                <FloriaIcon
                  name="chevron_right"
                  size={14}
                  color={theme.colors.white}
                  weight="bold"
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyHeroCard}>
            <FloriaIcon name="check_circle" size={36} color={theme.colors.success} />
            <Text style={styles.emptyHeroTitle}>All Caught Up!</Text>
            <Text style={styles.emptyHeroDesc}>
              No active deliveries in progress. New assigned plant deliveries from nearby regional nurseries will appear here.
            </Text>
          </View>
        )}
      </View>

      {/* ── 4. Next In Queue List ── */}
      {nextDeliveries.length > 0 && (
        <View style={styles.queueSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>UPCOMING STOPS ({nextDeliveries.length})</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/deliveries")}>
              <Text style={styles.viewQueueText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.queueList}>
            {nextDeliveries.slice(0, 3).map((item) => (
              <DeliveryCard
                key={item.id}
                delivery={item}
                onPress={() => router.push(`/deliveries/${item.id}` as any)}
              />
            ))}
          </View>
        </View>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  courierInfo: {
    flex: 1,
  },
  logoBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  floriaMark: {
    width: 14,
    height: 18,
  },
  greetingPre: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: "500",
  },
  courierName: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.forest,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  dutyPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    gap: 6,
  },
  dutyPillOn: {
    backgroundColor: theme.colors.botanicalGreen,
    borderColor: theme.colors.forest,
  },
  dutyPillOff: {
    backgroundColor: theme.colors.sand,
    borderColor: theme.colors.divider,
  },
  dutyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dutyDotOn: {
    backgroundColor: theme.colors.forest,
  },
  dutyDotOff: {
    backgroundColor: theme.colors.muted,
  },
  dutyText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  dutyTextOn: {
    color: theme.colors.forest,
  },
  dutyTextOff: {
    color: theme.colors.muted,
  },
  todaySection: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.xs,
  },
  kpiGrid: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    alignItems: "center",
    ...theme.shadows.sm,
  },
  kpiNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.charcoal,
    marginBottom: 2,
  },
  kpiDesc: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: "500",
  },
  currentSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  viewQueueText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  activeCard: {
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.md,
  },
  activeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  activeOrderInfo: {
    gap: 2,
  },
  activeOrderLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.muted,
    letterSpacing: 0.8,
  },
  activeOrderId: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.charcoal,
  },
  stopsTimeline: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  stopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  stopIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.sand,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stopDetails: {
    flex: 1,
  },
  stopTypeLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: theme.colors.forest,
    letterSpacing: 0.6,
  },
  stopName: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.charcoal,
    marginTop: 1,
  },
  stopAddress: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  timelineConnector: {
    width: 2,
    height: 14,
    backgroundColor: theme.colors.divider,
    marginLeft: 13,
  },
  activeActionsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  navigateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: theme.spacing.sm + 4,
    backgroundColor: theme.colors.sand,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.forest,
  },
  navigateBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.forest,
    letterSpacing: 0.5,
  },
  openDetailBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: theme.spacing.sm + 4,
    backgroundColor: theme.colors.terracotta,
    borderRadius: theme.radius.md,
  },
  openDetailBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  emptyHeroCard: {
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  emptyHeroTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.forest,
    marginTop: theme.spacing.xs,
  },
  emptyHeroDesc: {
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 16,
  },
  queueSection: {
    gap: theme.spacing.xs,
  },
  queueList: {
    gap: theme.spacing.xs,
  },
});
