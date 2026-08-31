import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { ProductListSkeleton } from "../../components/ui/Skeletons";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { SellerPendingVerificationShield } from "../../components/seller";

const PRODUCT_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "low", label: "Low Stock" },
  { key: "out", label: "Out of Stock" },
];

export default function SellerProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller } = useSellerAuth();

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const isApproved = seller?.status === "approved" || seller?.status === "active";

  const fetchProducts = useCallback(async () => {
    if (!isApproved) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let statusParam: string | undefined = undefined;
      let stockParam: string | undefined = undefined;

      if (activeFilter === "active") statusParam = "active";
      else if (activeFilter === "low") stockParam = "low";
      else if (activeFilter === "out") stockParam = "out";

      const res = await api.getSellerProducts({
        status: statusParam,
        stock: stockParam,
        search: searchQuery.trim() || undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.warn("[SellerProducts] Load error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, searchQuery, isApproved]);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts]),
  );

  if (!isApproved) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>Products</Text>
        </View>
        <SellerPendingVerificationShield
          seller={seller}
          featureName="Plant Catalog"
        />
      </View>
    );
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const renderProductItem = ({ item }: { item: any }) => {
    const productId = item.id;
    const name = item.name || "Botanical Specimen";
    const pricePaise =
      item.price_paise ??
      item.inventory?.[0]?.price_paise ??
      item.inventory?.price_paise ??
      0;
    const stockQuantity =
      item.stock_quantity ??
      item.inventory?.[0]?.stock_quantity ??
      item.inventory?.stock_quantity ??
      0;
    const lowStockThreshold =
      item.low_stock_threshold ??
      item.inventory?.[0]?.low_stock_threshold ??
      item.inventory?.low_stock_threshold ??
      5;
    const isLowStock = stockQuantity > 0 && stockQuantity <= lowStockThreshold;
    const isOutOfStock = stockQuantity <= 0;
    const imageUrl =
      item.primary_image_url ||
      item.image_url ||
      item.images?.[0]?.url ||
      "/brand_logo.svg";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/products/${productId}` as any)}
        style={styles.productCard}
      >
        <Image
          source={
            imageUrl.startsWith("http")
              ? { uri: imageUrl }
              : require("../../assets/images/floria_mark.png")
          }
          style={styles.productImage}
          resizeMode={imageUrl.startsWith("http") ? "cover" : "contain"}
        />

        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={1}>
            {name}
          </Text>

          <Text style={styles.productPrice}>{formatINR(pricePaise)}</Text>

          <View style={styles.stockRow}>
            {isOutOfStock ? (
              <View style={[styles.stockTag, styles.outOfStockTag]}>
                <Text style={styles.outOfStockTagText}>Out of stock</Text>
              </View>
            ) : isLowStock ? (
              <View style={[styles.stockTag, styles.lowStockTag]}>
                <Text style={styles.lowStockTagText}>
                  Stock: {stockQuantity} (Low)
                </Text>
              </View>
            ) : (
              <Text style={styles.stockText}>Stock: {stockQuantity}</Text>
            )}

            <StatusBadge status={item.status || "active"} />
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Top Bar with Add Plant CTA ── */}
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Products</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/products/new" as any)}
          style={styles.addPlantButton}
        >
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={styles.addPlantButtonText}>Add Plant</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={18} color={Colors.inkMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search your products..."
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

      {/* ── Filter Tabs ── */}
      <View style={styles.tabsContainer}>
        {PRODUCT_FILTERS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => setActiveFilter(tab.key)}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
            >
              <Text style={[styles.tabButtonText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Products List / Skeleton / Empty ── */}
      {loading && !refreshing ? (
        <ProductListSkeleton />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
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
              icon="leaf-outline"
              title="Your catalog is empty"
              description={
                searchQuery
                  ? "No products match your search query."
                  : activeFilter !== "all"
                    ? `No products currently in "${PRODUCT_FILTERS.find((f) => f.key === activeFilter)?.label}" filter.`
                    : "Add your first botanical specimen from the canonical catalog to start selling."
              }
              actionLabel={searchQuery ? "Clear Search" : "+ Add Plant"}
              onAction={() =>
                searchQuery ? setSearchQuery("") : router.push("/products/new" as any)
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  addPlantButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.forest,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  addPlantButtonText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.white,
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
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.sand,
  },
  productDetails: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingRight: Spacing.xs,
  },
  productName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "Georgia",
  },
  productPrice: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
    marginTop: 2,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 4,
  },
  stockText: {
    fontSize: 11,
    color: Colors.inkMuted,
    fontWeight: "500",
  },
  stockTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  lowStockTag: {
    backgroundColor: Colors.warningBg,
  },
  lowStockTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.warning,
  },
  outOfStockTag: {
    backgroundColor: Colors.errorBg,
  },
  outOfStockTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.error,
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
});
