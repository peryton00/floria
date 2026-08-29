import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { InventoryStockRow } from "../../components/seller/InventoryStockRow";
import { LoadingState } from "../../components/ui/LoadingState";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";

export default function SellerInventoryScreen() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getSellerInventory();
      if (res.success && res.data) {
        setInventory(res.data);
      } else {
        setError(res.error?.message || "Failed to load nursery inventory.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to inventory ledger.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    // Optimistic local state update
    setInventory((prev) =>
      prev.map((i) =>
        i.product_id === productId || i.id === productId
          ? { ...i, stock_quantity: newStock }
          : i,
      ),
    );

    try {
      const res = await api.updateSellerInventory(productId, {
        stock_quantity: newStock,
      });
      if (!res.success) {
        Alert.alert(
          "Stock Update Error",
          res.error?.message || "Could not update stock on server.",
        );
        await fetchInventory();
      }
    } catch (e: any) {
      Alert.alert(
        "Connection Error",
        e.message || "Failed to persist stock update.",
      );
      await fetchInventory();
    }
  };

  return (
    <View style={styles.container}>
      {/* Notice Banner */}
      <View style={[styles.noticeBanner, { flexDirection: "row", alignItems: "center", gap: 6 }]}>
        <Ionicons name="flash-outline" size={13} color={Colors.forest} />
        <Text style={styles.noticeText}>
          Tap + or − to adjust live available specimen quantities instantly.
        </Text>
      </View>

      {loading && !refreshing ? (
        <LoadingState message="Loading botanical stock ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchInventory} />
      ) : inventory.length === 0 ? (
        <EmptyState
          title="No Inventory Items"
          message="Products published to the Floria catalog will appear here for stock control."
          actionLabel="Refresh Ledger"
          onAction={fetchInventory}
        />
      ) : (
        <FlatList
          data={inventory}
          keyExtractor={(item) => item.product_id || item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.forest]}
            />
          }
          renderItem={({ item }) => (
            <InventoryStockRow
              productId={item.product_id || item.id}
              name={item.product_name || item.name || "Botanical Specimen"}
              sku={item.sku}
              pricePaise={item.price_paise || 129900}
              stockQuantity={item.stock_quantity ?? 0}
              lowStockThreshold={item.low_stock_threshold || 5}
              onUpdateStock={(newStock) =>
                handleUpdateStock(item.product_id || item.id, newStock)
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
  noticeBanner: {
    backgroundColor: Colors.botanical,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
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
});
