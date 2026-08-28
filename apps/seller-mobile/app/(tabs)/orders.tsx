import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { OrderActionCard } from "../../components/seller/OrderActionCard";
import { LoadingState } from "../../components/ui/LoadingState";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";

const TABS = [
  { key: "all", label: "All Orders" },
  { key: "new", label: "New (Action)" },
  { key: "preparing", label: "Preparing" },
  { key: "ready_for_pickup", label: "Ready" },
  { key: "delivered", label: "Delivered" },
];

export default function SellerOrdersQueueScreen() {
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getSellerOrders({
        status: activeTab !== "all" ? activeTab : undefined,
      });

      if (res.success && res.data) {
        setOrders(res.data);
      } else {
        setError(res.error?.message || "Failed to load orders.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch nursery orders queue.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleAdvanceStatus = async (orderId: string, nextStatus: string) => {
    try {
      setAdvancingId(orderId);
      const res = await api.updateFulfillmentStatus(orderId, nextStatus);
      if (res.success) {
        await fetchOrders();
      } else {
        Alert.alert(
          "Status Update Failed",
          res.error?.message || "Could not transition order status.",
        );
      }
    } catch (e: any) {
      Alert.alert(
        "Status Update Error",
        e.message || "Order transition error.",
      );
    } finally {
      setAdvancingId(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Horizontal Filter Tabs */}
      <View style={styles.tabBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsScroll}
          renderItem={({ item }) => {
            const isSelected = activeTab === item.key;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab(item.key)}
                style={[styles.tabChip, isSelected && styles.tabChipSelected]}
              >
                <Text
                  style={[styles.tabText, isSelected && styles.tabTextSelected]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders List */}
      {loading && !refreshing ? (
        <LoadingState message="Retrieving orders queue..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No Orders in this Status"
          message="Incoming plant orders from local customers will arrive here in real-time."
          actionLabel="Refresh Queue"
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
            <OrderActionCard
              id={item.id}
              orderNumber={item.order_number || item.id.substring(0, 8)}
              createdAt={item.created_at}
              status={item.status || "pending"}
              items={
                item.items || [{ name: "Botanical Specimen", quantity: 1 }]
              }
              totalPaise={item.total_amount_paise || item.total_paise || 129900}
              advancing={advancingId === item.id}
              onAdvanceStatus={(nextStatus) =>
                handleAdvanceStatus(item.id, nextStatus)
              }
            />
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
  tabBar: {
    backgroundColor: Colors.linen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.xs,
  },
  tabsScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  tabChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.sand,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabChipSelected: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forestDark,
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabTextSelected: {
    color: Colors.white,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
});
