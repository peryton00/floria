// Floria Delivery Mobile — Production DeliveryCard Component (Step 5B.2.1)
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { Card, StatusBadge } from "../ui";
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
  const formattedTime = new Date(delivery.assigned_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card
      style={[styles.card, isPriority && styles.priorityCard]}
      variant={isPriority ? "elevated" : "default"}
      onPress={onPress}
    >
      {/* Top Row: Order ID & Status */}
      <View style={styles.topRow}>
        <View style={styles.orderBadge}>
          <MaterialIcons
            name="local-shipping"
            size={16}
            color={isPriority ? theme.colors.forest : theme.colors.muted}
          />
          <Text style={[styles.orderId, isPriority && styles.priorityOrderId]}>
            Order #{delivery.order_id}
          </Text>
        </View>
        <StatusBadge status={delivery.status} size="sm" />
      </View>

      {/* Detail row */}
      <View style={styles.middleRow}>
        <Text style={styles.metaText}>
          {delivery.status === "delivered" && delivery.delivered_at
            ? `Delivered at ${new Date(delivery.delivered_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : delivery.status === "out_for_delivery"
              ? "In Transit — En route to customer"
              : delivery.status === "picked_up"
                ? "Picked up from nursery"
                : `Assigned at ${formattedTime}`}
        </Text>
      </View>

      {/* Bottom Action Affordance */}
      <View style={styles.bottomRow}>
        <Text style={styles.assignmentId} numberOfLines={1}>
          Ref: {delivery.id.substring(0, 8)}...
        </Text>
        <View style={styles.actionGroup}>
          <Text style={styles.actionText}>
            {delivery.status === "delivered" ? "VIEW RECEIPT" : "VIEW STOP"}
          </Text>
          <MaterialIcons
            name="chevron-right"
            size={16}
            color={theme.colors.terracotta}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  priorityCard: {
    borderColor: theme.colors.forest,
    borderWidth: 1.5,
    backgroundColor: "#FDFCF9",
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
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.charcoal,
  },
  priorityOrderId: {
    color: theme.colors.forest,
    fontSize: 16,
  },
  middleRow: {
    marginBottom: theme.spacing.md,
  },
  metaText: {
    ...theme.typography.subtitle,
    fontSize: 12,
    color: theme.colors.muted,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: theme.spacing.sm,
  },
  assignmentId: {
    ...theme.typography.caption,
    fontSize: 10,
    color: theme.colors.muted,
    maxWidth: 140,
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.terracotta,
    letterSpacing: 0.5,
  },
});
