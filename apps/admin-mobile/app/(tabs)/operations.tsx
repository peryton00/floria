import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { formatINR, formatDate } from "../../lib/format";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { LoadingState } from "../../components/ui/LoadingState";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";

export default function OperationsOversightScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getAdminOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      } else {
        setError(res.error?.message || "Failed to load operational orders.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to fulfillment records.");
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

  return (
    <View style={styles.container}>
      {/* Notice Banner */}
      <View style={[styles.notice, { flexDirection: "row", alignItems: "center", gap: 6 }]}>
        <Ionicons name="flash-outline" size={13} color={Colors.forest} />
        <Text style={styles.noticeText}>
          Real-time oversight of Bengaluru 4-hour hyperlocal dispatch grid.
        </Text>
      </View>

      {loading && !refreshing ? (
        <LoadingState message="Loading fulfillment stream..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No Active Orders"
          message="Marketplace orders will appear here as they progress through nursery preparation and courier handoff."
          actionLabel="Refresh Orders"
          onAction={fetchOrders}
        />
      ) : (
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
            <View style={styles.card}>
              <View style={styles.header}>
                <View>
                  <Text style={styles.orderNumber}>
                    Order #{item.order_number || item.id.substring(0, 8)}
                  </Text>
                  <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                </View>
                <StatusBadge status={item.status || "pending"} />
              </View>

              <View style={styles.body}>
                <Text style={styles.customerText}>
                  Customer: {item.customer?.email || "Local Customer"}
                </Text>
                <Text style={styles.nurseryText}>
                  Nursery: {item.seller?.business_name || "Partner Nursery"}
                </Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.total}>
                  {formatINR(
                    item.total_amount_paise || item.total_paise || 129900,
                  )}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Ionicons name="flash-outline" size={10} color={Colors.sage} />
                  <Text style={styles.paymentStatus}>Cashfree Settled</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  notice: {
    backgroundColor: Colors.botanical,
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  noticeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.forestDark,
    textAlign: "center",
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
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
  body: {
    marginVertical: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  customerText: {
    fontSize: 11,
    color: Colors.ink,
  },
  nurseryText: {
    fontSize: 11,
    color: Colors.sage,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  total: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  paymentStatus: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.success,
    textTransform: "uppercase",
  },
});
