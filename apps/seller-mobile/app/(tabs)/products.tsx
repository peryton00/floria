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
import { formatINR } from "../../lib/format";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";

export default function SellerProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getSellerProducts();
      if (res.success && res.data) {
        setProducts(res.data);
      } else {
        setError(res.error?.message || "Failed to load products.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to catalog.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Plant Catalog ({products.length})</Text>
        <Button
          label="+ New Specimen"
          size="sm"
          onPress={() => router.push("/products/new" as any)}
        />
      </View>

      {loading && !refreshing ? (
        <LoadingState message="Loading botanical catalog..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No Products in Catalog"
          message="Publish living plants, rare aroids, bonsai, and planters to the Floria marketplace."
          actionLabel="+ Create First Plant"
          onAction={() => router.push("/products/new" as any)}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.forest]}
            />
          }
          renderItem={({ item }) => {
            const inventory = item.inventory || {};
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/products/[id]",
                    params: { id: item.id },
                  } as any)
                }
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.botanical_name ? (
                      <Text style={styles.botanicalName}>
                        {item.botanical_name}
                      </Text>
                    ) : null}
                  </View>
                  <StatusBadge status={item.status || "published"} />
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.price}>
                      {formatINR(
                        inventory.price_paise || item.price_paise || 129900,
                      )}
                    </Text>
                    <Text style={styles.stock}>
                      Stock:{" "}
                      {inventory.stock_quantity ?? item.stock_quantity ?? 0}{" "}
                      available
                    </Text>
                  </View>
                  <Text style={styles.editLink}>Edit Specimen →</Text>
                </View>
              </TouchableOpacity>
            );
          }}
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.linen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  productName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  botanicalName: {
    fontSize: 11,
    fontStyle: "italic",
    color: Colors.sage,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.xs,
  },
  price: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  stock: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  editLink: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.terracotta,
    textTransform: "uppercase",
  },
});
