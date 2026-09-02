// Floria Delivery Mobile — Production DeliveryCard Component with Phosphor Icons
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { theme } from "../../lib/theme";
import { FloriaIcon } from "../ui/FloriaIcon";
import { StatusBadge } from "../ui/StatusBadge";
import type { DeliveryAssignment } from "@floria/types";

interface DeliveryCardProps {
  delivery: DeliveryAssignment;
  onPress: () => void;
  isPriority?: boolean;
}

export function DeliveryCard({
  delivery,
  onPress,
  isPriority = false,
}: DeliveryCardProps) {
  const formattedTime = new Date(
    delivery.assigned_at || (delivery as any).createdAt || Date.now(),
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const orderId =
    delivery.order_id?.slice(0, 8).toUpperCase() ||
    (delivery as any).orderId?.slice(0, 8).toUpperCase() ||
    "DISPATCH";

  const packagesCount =
    (delivery as any).packagesCount || (delivery as any).orderItemCount || 1;

  const dropoffCity =
    (delivery as any).dropoffAddress?.city ||
    (delivery as any).dropoff_address_snapshot?.city ||
    "Destination Customer";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, isPriority && styles.priorityCard]}
    >
      {/* Top Row: Order ID & Status */}
      <View style={styles.topRow}>
        <View style={styles.orderBadge}>
          <FloriaIcon
            name="shipping"
            size={16}
            color={isPriority ? theme.colors.forest : theme.colors.muted}
            weight="bold"
          />
          <Text style={[styles.orderId, isPriority && styles.priorityOrderId]}>
            Order #{orderId}
          </Text>
        </View>
        <StatusBadge status={delivery.status} size="sm" />
      </View>

      {/* Middle Destination Row */}
      <View style={styles.middleRow}>
        <View style={styles.locationRow}>
          <FloriaIcon name="map_pin" size={14} color={theme.colors.muted} />
          <Text style={styles.locationText} numberOfLines={1}>
            {dropoffCity} • {packagesCount} {packagesCount === 1 ? "package" : "packages"}
          </Text>
        </View>
        <Text style={styles.metaText}>
          {delivery.status === "delivered" && (delivery.delivered_at || (delivery as any).deliveredAt)
            ? `Delivered at ${new Date(delivery.delivered_at || (delivery as any).deliveredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : delivery.status === "out_for_delivery"
            ? "In Transit — En route to customer"
            : delivery.status === "picked_up"
            ? "Picked up from nursery hub"
            : `Assigned at ${formattedTime}`}
        </Text>
      </View>

      {/* Bottom Action Row */}
      <View style={styles.bottomRow}>
        <Text style={styles.assignmentId} numberOfLines={1}>
          Ref: {delivery.id.substring(0, 8)}...
        </Text>
        <View style={styles.actionGroup}>
          <Text style={styles.actionText}>
            {delivery.status === "delivered" ? "VIEW RECEIPT" : "VIEW STOP"}
          </Text>
          <FloriaIcon
            name="chevron_right"
            size={14}
            color={theme.colors.terracotta}
            weight="bold"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  priorityCard: {
    borderColor: theme.colors.forest,
    borderWidth: 1.5,
    backgroundColor: "#FAF9F5",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  orderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.charcoal,
  },
  priorityOrderId: {
    color: theme.colors.forest,
  },
  middleRow: {
    gap: 4,
    marginBottom: theme.spacing.md,
    paddingVertical: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.charcoal,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  assignmentId: {
    fontSize: 10,
    color: theme.colors.muted,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.terracotta,
    letterSpacing: 0.5,
  },
});
