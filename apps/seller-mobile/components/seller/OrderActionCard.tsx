import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR, formatDate } from "../../lib/format";
import { StatusBadge } from "../ui/StatusBadge";
import { Button } from "../ui/Button";

export interface OrderActionCardProps {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  items: Array<{ name: string; quantity: number }>;
  totalPaise: number;
  deliveryType?: string;
  onAdvanceStatus?: (nextStatus: string) => void;
  advancing?: boolean;
}

export function OrderActionCard({
  id,
  orderNumber,
  createdAt,
  status,
  items,
  totalPaise,
  deliveryType = "Hyperlocal Courier",
  onAdvanceStatus,
  advancing = false,
}: OrderActionCardProps) {
  const router = useRouter();

  const getNextAction = () => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "new":
        return {
          label: "Accept & Inspect Plant",
          nextStatus: "preparing",
          variant: "primary" as const,
        };
      case "preparing":
      case "processing":
        return {
          label: "Mark Ready for Courier",
          nextStatus: "ready_for_pickup",
          variant: "success" as const,
        };
      case "ready_for_pickup":
      case "ready":
        return {
          label: "Courier Handoff",
          nextStatus: "out_for_delivery",
          variant: "terracotta" as const,
        };
      default:
        return null;
    }
  };

  const action = getNextAction();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push(`/orders/${id}` as any)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>
            Order #{orderNumber || id.substring(0, 8)}
          </Text>
          <Text style={styles.date}>{formatDate(createdAt)}</Text>
        </View>
        <StatusBadge status={status} />
      </View>

      <View style={styles.itemsList}>
        {items.map((item, idx) => (
          <Text key={idx} style={styles.itemText} numberOfLines={1}>
            🌱 {item.quantity} × {item.name}
          </Text>
        ))}
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.deliveryBadge}>⚡ {deliveryType}</Text>
          <Text style={styles.total}>{formatINR(totalPaise)}</Text>
        </View>

        {action && onAdvanceStatus && (
          <Button
            label={action.label}
            variant={action.variant}
            size="sm"
            loading={advancing}
            onPress={() => onAdvanceStatus(action.nextStatus)}
            style={styles.actionButton}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  orderNumber: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  date: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  itemsList: {
    backgroundColor: Colors.page,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.ink,
    lineHeight: 18,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  deliveryBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.terracotta,
    textTransform: "uppercase",
  },
  total: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.forest,
    marginTop: 2,
  },
  actionButton: {
    minWidth: 140,
  },
});
