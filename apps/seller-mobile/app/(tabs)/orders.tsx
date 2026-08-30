import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR, formatDate } from "../../lib/format";
import { OrderListSkeleton } from "../../components/ui/Skeletons";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
];

export default function SellerOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller } = useSellerAuth();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let statusFilter: string | undefined = undefined;
      if (activeTab === "new") statusFilter = "placed";
      else if (activeTab === "preparing") statusFilter = "preparing";
      else if (activeTab === "ready") statusFilter = "ready_for_pickup";
      else if (activeTab === "completed") statusFilter = "delivered";

      const res = await api.getSellerOrders({
        status: statusFilter,
        search: searchQuery.trim() || undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn("[SellerOrders] Load error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, seller?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const orderId = item.masterOrderId || item.id || "";
    const shortId = orderId.substring(0, 8).toUpperCase();
    const items = item.items || [];
    const sellerAmount = item.seller_payout_paise ?? item.totalPaise ?? item.subtotalPaise ?? 0;
    const createdAt = item.createdAt || item.created_at;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/orders/${orderId}` as any)}
        style={styles.orderCard}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderIdText}>#FL-{shortId}</Text>
            <Text style={styles.orderDate}>{formatDate(createdAt)}</Text>
          </View>
          <StatusBadge status={item.status || "PLACED"} />
        </View>

        {/* Multi-Seller Isolated Items List */}
        <View style={styles.itemsBox}>
          {items.map((lineItem: any, idx: number) => {
            const plantName =
              lineItem.product?.name || lineItem.product_name || "Botanical Specimen";
            return (
              <View key={idx} style={styles.itemLine}>
                <Ionicons name="leaf-outline" size={12} color={Colors.forest} style={{ marginTop: 2 }} />
                <Text style={styles.itemLineText} numberOfLines={1}>
                  {lineItem.quantity} × {plantName}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Footer: Seller Payout Amount & Navigation */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amountLabel}>Your Payout</Text>
            <Text style={styles.amountValue}>{formatINR(sellerAmount)}</Text>
          </View>

          <View style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>
              {item.status?.toLowerCase() === "preparing"
                ? "Manage Fulfillment"
                : "View Order"}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.forest} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Screen Header ── */}
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Orders</Text>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={18} color={Colors.inkMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by order # or customer..."
            placeholderTextColor={Colors.inkSubtle}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color={Colors.inkMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Status Tabs ── */}
      <View style={styles.tabsContainer}>
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
            >
              <Text style={[styles.tabButtonText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Orders List / Loading / Empty ── */}
      {loading && !refreshing ? (
        <OrderListSkeleton />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.masterOrderId || item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.forest}
              colors={[Colors.forest]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              description={
                searchQuery
                  ? "No orders match your search query."
                  : activeTab !== "all"
                    ? `No orders currently in "${STATUS_TABS.find((t) => t.key === activeTab)?.label}" status.`
                    : "New customer orders will appear here as they are placed."
              }
              actionLabel={searchQuery ? "Clear Search" : undefined}
              onAction={searchQuery ? () => setSearchQuery("") : undefined}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  topBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.page,
  },
  pageTitle: {
    fontSize: Typography.fontSizes.lg,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.forest,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.page,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.page,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTabButton: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forestDark,
  },
  tabButtonText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
  activeTabText: {
    color: Colors.white,
    fontWeight: "700",
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  orderCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  orderIdText: {
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
  itemsBox: {
    backgroundColor: Colors.page,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginVertical: 2,
  },
  itemLineText: {
    flex: 1,
    fontSize: Typography.fontSizes.xs,
    color: Colors.ink,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  amountLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
  },
  amountValue: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.forest,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.botanical,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  detailsButtonText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forestDark,
  },
});
