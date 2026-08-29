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
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { ProductCard } from "../../components/customer/ProductCard";
import { CategoryChip } from "../../components/customer/CategoryChip";
import { CategoryGridSkeleton } from "../../components/ui/CategoryGridSkeleton";
import { ProductGridSkeleton } from "../../components/ui/ProductCardSkeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { haptics } from "../../lib/haptics";

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  "indoor-plants": "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80",
  "outdoor-plants": "https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=600&auto=format&fit=crop&q=80",
  "succulents-cacti": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600&auto=format&fit=crop&q=80",
  "flowering-plants": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80",
  "herbs-edibles": "https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=600&auto=format&fit=crop&q=80",
  "planters-pots": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80",
  "soil-fertilizers": "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&auto=format&fit=crop&q=80",
  "tools-accessories": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
};

const FALLBACK_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80";

export default function CustomerExploreScreen() {
  const params = useLocalSearchParams<{ category?: string; search?: string }>();
  const [searchQuery, setSearchQuery] = useState(params.search || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    params.category || "all",
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(
    Boolean(params.category && params.category !== "all") || Boolean(params.search),
  );
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync params when navigated with query params
  useEffect(() => {
    if (params.category) {
      setProducts([]);
      setLoadingProducts(true);
      setSelectedCategory(params.category);
    }
    if (params.search) {
      setProducts([]);
      setLoadingProducts(true);
      setSearchQuery(params.search);
    }
  }, [params.category, params.search]);

  const handleSelectCategory = (slug: string) => {
    if (slug === selectedCategory) return;
    haptics.selection();
    if (slug !== "all") {
      setProducts([]);
      setLoadingProducts(true);
    }
    setSelectedCategory(slug);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim().length > 0) {
      setProducts([]);
      setLoadingProducts(true);
    }
  };

  const fetchCatalog = useCallback(async () => {
    try {
      setError(null);
      const isViewingCategory = selectedCategory !== "all" || searchQuery.trim().length > 0;

      if (isViewingCategory) {
        setLoadingProducts(true);
      }

      // Always ensure categories are fetched
      const catRes = await api.getCategories();
      let loadedCategories = categories;
      if (catRes.success && catRes.data) {
        loadedCategories = catRes.data;
        setCategories(catRes.data);
      }
      setLoadingCategories(false);

      if (!isViewingCategory) {
        setProducts([]);
        setLoadingProducts(false);
      } else {
        const catObj = loadedCategories.find(
          (c: any) => c.slug === selectedCategory || c.id === selectedCategory,
        );

        const prodRes = await api.getProducts({
          category: catObj?.slug || (selectedCategory !== "all" ? selectedCategory : undefined),
          categoryId: catObj?.id,
          search: searchQuery.trim() || undefined,
          limit: 50,
        });

        if (prodRes.success && Array.isArray(prodRes.data)) {
          // Extra client guard to guarantee only category products are shown
          const strictProducts =
            selectedCategory !== "all" && catObj
              ? prodRes.data.filter((p: any) => {
                  const prod = p.product || p;
                  const pCatId = prod.category_id || p.category_id;
                  const pCatSlug = p.category?.slug || prod.category?.slug;
                  const pCatName = p.category?.name || prod.category?.name;
                  return (
                    pCatId === catObj.id ||
                    pCatSlug === catObj.slug ||
                    (pCatName &&
                      catObj.name &&
                      pCatName.toLowerCase() === catObj.name.toLowerCase())
                  );
                })
              : prodRes.data;

          setProducts(strictProducts);
        } else {
          setProducts([]);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load botanical catalog.");
    } finally {
      setLoadingCategories(false);
      setLoadingProducts(false);
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

  const isShowingProducts = selectedCategory !== "all" || searchQuery.trim().length > 0;
  const currentCategoryObj = categories.find((c) => c.slug === selectedCategory);

  return (
    <View style={styles.container}>
      {/* 1. Search Bar */}
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
          onChangeText={handleSearchChange}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
            }}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color={Colors.inkMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Main Body: Categories Card Grid OR Products of Selected Category */}
      {error && !loadingCategories && categories.length === 0 ? (
        <ErrorState message={error} onRetry={fetchCatalog} />
      ) : !isShowingProducts ? (
        /* --- CATEGORIES VIEW ONLY --- */
        <ScrollView
          contentContainerStyle={styles.categoryGridContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.forest]}
            />
          }
        >
          <View style={styles.categoriesHeader}>
            <Text style={styles.categoriesHeading}>Botanical Categories</Text>
            <Text style={styles.categoriesSubheading}>
              Hand-curated living plants and artisanal nursery craft
            </Text>
          </View>

          {loadingCategories && categories.length === 0 ? (
            <CategoryGridSkeleton count={6} />
          ) : (
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => {
                const imageUri =
                  cat.image_url ||
                  cat.banner_url ||
                  DEFAULT_CATEGORY_IMAGES[cat.slug] ||
                  FALLBACK_CATEGORY_IMAGE;

                return (
                  <TouchableOpacity
                    key={cat.id || cat.slug}
                    activeOpacity={0.85}
                    onPress={() => handleSelectCategory(cat.slug)}
                    style={styles.categoryCard}
                  >
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.categoryCardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.categoryCardOverlay}>
                      <View style={styles.categoryNameRow}>
                        <Text style={styles.categoryCardTitle} numberOfLines={1}>
                          {cat.name}
                        </Text>
                        <View style={styles.arrowIconBox}>
                          <Ionicons name="chevron-forward" size={13} color={Colors.white} />
                        </View>
                      </View>
                      {cat.description ? (
                        <Text style={styles.categoryCardDesc} numberOfLines={2}>
                          {cat.description}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : (
        /* --- PRODUCTS VIEW OF SELECTED CATEGORY / SEARCH --- */
        <View style={{ flex: 1 }}>
          {/* Active Category Header Bar & Filter Chips */}
          <View style={styles.activeFilterBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                handleSelectCategory("all");
                setSearchQuery("");
              }}
              style={styles.backToCategoriesBtn}
            >
              <Ionicons name="arrow-back" size={16} color={Colors.forest} />
              <Text style={styles.backToCategoriesText}>All Categories</Text>
            </TouchableOpacity>

            {currentCategoryObj && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {currentCategoryObj.name}
                </Text>
              </View>
            )}
          </View>

          {/* Horizontal category quick switch rail */}
          <View style={styles.quickChipsBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChipsScroll}
            >
              <CategoryChip
                label="All Categories"
                selected={selectedCategory === "all"}
                onPress={() => {
                  handleSelectCategory("all");
                  setSearchQuery("");
                }}
              />
              {categories.map((c) => (
                <CategoryChip
                  key={c.id || c.slug}
                  label={c.name}
                  selected={selectedCategory === c.slug}
                  onPress={() => handleSelectCategory(c.slug)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Products List or Skeleton */}
          {loadingProducts ? (
            <View style={{ paddingHorizontal: Spacing.sm, paddingTop: Spacing.xs }}>
              <ProductGridSkeleton count={6} />
            </View>
          ) : products.length === 0 ? (
            <EmptyState
              title="No Botanical Specimens Found"
              message={
                searchQuery
                  ? `No plants matched "${searchQuery}". Try a different keyword.`
                  : "No plants currently listed in this category."
              }
              actionLabel="View All Categories"
              onAction={() => {
                setSearchQuery("");
                handleSelectCategory("all");
              }}
            />
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) =>
                item.id || item.product?.id || String(Math.random())
              }
              numColumns={2}
              contentContainerStyle={styles.productGridContainer}
              showsVerticalScrollIndicator={false}
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
                        item.seller_name || item.nursery_name || "Floria Nursery"
                      }
                      imageUrl={primaryImage}
                      careLevel={prod.care_level || "EASY"}
                      isVerified={true}
                      rating={prod.rating || 4.8}
                    />
                  </View>
                );
              }}
            />
          )}
        </View>
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
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  clearBtn: {
    padding: 4,
  },
  categoryGridContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  categoriesHeader: {
    marginBottom: Spacing.md,
  },
  categoriesHeading: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: 2,
  },
  categoriesSubheading: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    lineHeight: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  categoryCard: {
    width: "47.5%",
    height: 160,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  categoryCardImage: {
    width: "100%",
    height: "100%",
  },
  categoryCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(18, 43, 37, 0.78)",
    padding: Spacing.sm,
  },
  categoryNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryCardTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.white,
    fontFamily: "Georgia",
    flex: 1,
    marginRight: 4,
  },
  arrowIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCardDesc: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
    lineHeight: 13,
  },
  activeFilterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  backToCategoriesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingRight: 10,
  },
  backToCategoriesText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.forest,
    fontWeight: "700",
  },
  categoryBadge: {
    backgroundColor: Colors.botanical,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.forest,
  },
  quickChipsBar: {
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.page,
  },
  quickChipsScroll: {
    paddingHorizontal: Spacing.md,
  },
  productGridContainer: {
    padding: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },
  gridItem: {
    width: "50%",
  },
});
