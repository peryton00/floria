import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { ProductCard } from "../../components/customer/ProductCard";
import { CategoryChip } from "../../components/customer/CategoryChip";
import { LoadingState } from "../../components/ui/LoadingState";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";

export default function CustomerExploreScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    params.category || "all",
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    try {
      setError(null);
      const [catRes, prodRes] = await Promise.all([
        api.getCategories(),
        api.getProducts({
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          search: searchQuery.trim() || undefined,
          limit: 30,
        }),
      ]);

      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load catalog.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCatalog();
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={Colors.inkMuted}
          style={{ marginRight: Spacing.sm }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Monstera, Ficus, Bonsai, Planters..."
          placeholderTextColor={Colors.inkSubtle}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={Colors.inkMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Chips Carousel */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <CategoryChip
            label="All Specimens"
            selected={selectedCategory === "all"}
            onPress={() => setSelectedCategory("all")}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.name}
              selected={selectedCategory === c.slug}
              onPress={() => setSelectedCategory(c.slug)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Catalog List */}
      {loading && !refreshing ? (
        <LoadingState message="Searching botanical catalog..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCatalog} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No Botanical Specimens Found"
          message="Try searching for a different plant name or clear category filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setSelectedCategory("all");
          }}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) =>
            item.id || item.product?.id || Math.random().toString()
          }
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.forest]}
            />
          }
          renderItem={({ item }) => {
            const prod = item.product || item;
            const primaryImage =
              prod.images?.find((img: any) => img.is_primary)?.url ||
              prod.images?.[0]?.url;
            return (
              <View style={styles.gridItem}>
                <ProductCard
                  id={prod.id}
                  name={prod.name}
                  pricePaise={
                    item.price_paise || item.inventory?.price_paise || 129900
                  }
                  nurseryId={item.seller_id || prod.seller_id || "nursery-1"}
                  nurseryName={
                    item.seller_name || item.nursery_name || "Green Oasis"
                  }
                  imageUrl={primaryImage}
                  careLevel={prod.care_level || "EASY"}
                />
              </View>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    margin: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  clearIcon: {
    fontSize: 14,
    color: Colors.inkMuted,
    padding: 4,
  },
  categoryBar: {
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.page,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.md,
  },
  gridContainer: {
    padding: Spacing.sm,
  },
  gridItem: {
    width: "50%",
  },
});
