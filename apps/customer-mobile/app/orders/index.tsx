import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { formatINR, formatDate } from "../../lib/format";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";

export default function OrderHistoryScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return Colors.success;
      case "out_for_delivery":
      case "picked_up":
      case "assigned":
        return Colors.forest;
      case "cancelled":
        return Colors.error;
      default:
        return Colors.warning;
    }
  };

  if (loading && !refreshing && orders.length === 0) {
    return (
      <View style={[styles.container, { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs }]}>
        <ListSkeleton count={4} />
      </View>
    );
  }

  if (error && orders.length === 0) {
    return <ErrorState message={error} onRetry={fetchOrders} />;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No Orders Placed Yet"
        message="Your future botanical purchases and live courier deliveries will appear here."
        actionLabel="Explore Living Plants"
        onAction={() => router.push("/(tabs)/explore" as any)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.forest]}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/orders/[id]",
                params: { id: item.id },
              } as any)
            }
            style={styles.orderCard}
          >
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderId}>
                  Order #{item.id?.substring(0, 8)}
                </Text>
                <Text style={styles.orderDate}>
                  {formatDate(item.created_at)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {item.status || "CONFIRMED"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.orderFooter}>
              <Text style={styles.itemsCount}>
                {item.items?.length || 1} Plant Specimen
                {(item.items?.length || 1) > 1 ? "s" : ""}
              </Text>
              <Text style={styles.orderTotal}>
                {formatINR(
                  item.total_amount_paise || item.total_paise || 129900,
                )}
              </Text>
            </View>

            <Text style={styles.trackLink}>Track Live Courier →</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl,
  },
  orderCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  orderDate: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemsCount: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
  },
  orderTotal: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.forest,
  },
  trackLink: {
    marginTop: Spacing.xs,
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.terracotta,
    textTransform: "uppercase",
    alignSelf: "flex-end",
  },
});
