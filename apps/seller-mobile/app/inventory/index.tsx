import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { InventorySkeleton } from "../../components/ui/Skeletons";
import { InventoryStockRow } from "../../components/seller/InventoryStockRow";
import { EmptyState } from "../../components/ui/EmptyState";
import { SellerPendingVerificationShield } from "../../components/seller";

const FILTERS = [
  { key: "all", label: "All Stock" },
  { key: "low", label: "Low Stock" },
  { key: "out", label: "Out of Stock" },
  { key: "in", label: "In Stock" },
];

export default function InventoryManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller } = useSellerAuth();
  const { showSuccess, showError } = useSellerFeedback();

  const isApproved = seller?.status === "approved" || seller?.status === "active";

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  if (!isApproved) {
    return (
      <View style={styles.screen}>
        <SellerPendingVerificationShield
          seller={seller}
          featureName="Stock & Inventory"
        />
      </View>
    );
  }

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSellerInventory();
      if (res.success && Array.isArray(res.data)) {
        setInventory(res.data);
      } else {
        setInventory([]);
      }
    } catch (err) {
      console.warn("[InventoryManagement] Load error:", err);
      setInventory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory, seller?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    // 1. Optimistic Update
    const previousInventory = [...inventory];
    setInventory((prev) =>
      prev.map((item) =>
        item.id === productId || item.product_id === productId
          ? { ...item, stock_quantity: newStock, quantity: newStock }
          : item,
      ),
    );

    // 2. Server-Authoritative Mutation
    try {
      const res = await api.updateSellerInventory(productId, {
        stock_quantity: newStock,
      });
      if (res.success) {
        showSuccess("Inventory stock updated.");
      } else {
        // Rollback
        setInventory(previousInventory);
        showError(res.error?.message || "Failed to update inventory.");
      }
    } catch (err: any) {
      // Rollback
      setInventory(previousInventory);
      showError(err.message || "Failed to update inventory.");
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const qty = item.stock_quantity ?? item.quantity ?? 0;
    const thresh = item.low_stock_threshold ?? 5;
    if (activeFilter === "low") return qty > 0 && qty <= thresh;
    if (activeFilter === "out") return qty <= 0;
    if (activeFilter === "in") return qty > thresh;
    return true;
  });

  return (
    <View style={styles.screen}>
      {/* ── Filter Bar ── */}
      <View style={styles.filterBar}>
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              activeOpacity={0.8}
              onPress={() => setActiveFilter(f.key)}
              style={[styles.filterTab, isActive && styles.activeFilterTab]}
            >
              <Text style={[styles.filterTabText, isActive && styles.activeFilterTabText]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Inventory List ── */}
      {loading && !refreshing ? (
        <InventorySkeleton />
      ) : (
        <FlatList
          data={filteredInventory}
          keyExtractor={(item) => item.id || item.product_id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.forest}
              colors={[Colors.forest]}
            />
          }
          renderItem={({ item }) => {
            const pId = item.id || item.product_id;
            const price = item.price_paise ?? item.price ?? 0;
            const stock = item.stock_quantity ?? item.quantity ?? 0;
            const thresh = item.low_stock_threshold ?? 5;

            return (
              <InventoryStockRow
                productId={pId}
                name={item.name || "Botanical Specimen"}
                sku={item.sku}
                pricePaise={price}
                stockQuantity={stock}
                lowStockThreshold={thresh}
                onUpdateStock={(newQty) => handleUpdateStock(pId, newQty)}
              />
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="package"
              title="No items in this stock view"
              description={
                activeFilter !== "all"
                  ? `No plants match the "${FILTERS.find((f) => f.key === activeFilter)?.label}" filter.`
                  : "Add plants to your nursery catalog to manage their stock levels."
              }
              actionLabel={activeFilter === "all" ? "+ List Product" : undefined}
              onAction={
                activeFilter === "all"
                  ? () => router.push("/products/new" as any)
                  : undefined
              }
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
  filterBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.page,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilterTab: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forestDark,
  },
  filterTabText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
  activeFilterTabText: {
    color: Colors.white,
    fontWeight: "700",
  },
  listContent: {
    padding: Spacing.md,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.page,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  pageTitle: {
    fontSize: Typography.fontSizes.lg,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.forest,
  },
});
