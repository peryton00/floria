import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { ProductCard } from "../../components/customer/ProductCard";
import { NurseryCard } from "../../components/customer/NurseryCard";
import { CategoryChip } from "../../components/customer/CategoryChip";
import { RecentlyViewedSection } from "../../components/customer/RecentlyViewedSection";
import { ProductGridSkeleton } from "../../components/ui/ProductCardSkeleton";
import { FloriaSkeleton } from "../../components/ui/FloriaSkeleton";
import { ErrorState } from "../../components/ui/ErrorState";

const TRUST_ITEMS = [
  { icon: "leaf-outline" as const, title: "Master Cultivators", desc: "Expert growers" },
  { icon: "shield-checkmark-outline" as const, title: "Plant Guarantee", desc: "7-day root health" },
  { icon: "card-outline" as const, title: "Secure Checkout", desc: "Encrypted & safe" },
  { icon: "car-outline" as const, title: "Careful Dispatch", desc: "Insulated transit" },
];

export default function CustomerHomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [nurseries, setNurseries] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [catRes, prodRes, nurseryRes] = await Promise.allSettled([
        api.getCategories(),
        api.getProducts({ limit: 20 }),
        api.getNurseries(),
      ]);

      if (catRes.status === "fulfilled" && catRes.value.success && catRes.value.data) {
        setCategories(catRes.value.data);
      }

      if (prodRes.status === "fulfilled" && prodRes.value.success && prodRes.value.data) {
        setFeaturedProducts(prodRes.value.data);
      }

      if (nurseryRes.status === "fulfilled" && nurseryRes.value.success && Array.isArray(nurseryRes.value.data)) {
        setNurseries(nurseryRes.value.data);
      } else if (prodRes.status === "fulfilled" && prodRes.value.success && Array.isArray(prodRes.value.data)) {
        const uniqueNurseriesMap = new Map<string, any>();
        prodRes.value.data.forEach((p: any) => {
          const seller = p.seller;
          if (seller && seller.id && !uniqueNurseriesMap.has(seller.id)) {
            uniqueNurseriesMap.set(seller.id, {
              id: seller.id,
              name: seller.business_name || "Floria Botanical Grower",
              city: seller.city || "Raipur",
              story: "Certified botanical grower cultivating premium specimens.",
              rating: p.rating || 4.9,
              plantCount: 14,
            });
          }
        });
        setNurseries(Array.from(uniqueNurseriesMap.values()));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load marketplace content.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: "/(tabs)/explore",
        params: { search: searchQuery.trim() },
      } as any);
    }
  };

  if (error && featuredProducts.length === 0 && !loading) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.forest]}
        />
      }
    >
      {/* 1. Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={18} color={Colors.inkMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Monstera, Ficus, Bonsai, Planters..."
          placeholderTextColor={Colors.inkSubtle}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
            <Ionicons name="close-circle" size={18} color={Colors.inkMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Hero Banner */}
      <View style={styles.hero}>
        <View style={styles.heroPreRow}>
          <Ionicons name="leaf-outline" size={12} color={Colors.botanical} />
          <Text style={styles.heroPre}>Artisanal Botanical Marketplace</Text>
        </View>
        <Text style={styles.heroTitle}>Living Art for Mindful Sanctuaries</Text>
        <Text style={styles.heroSubtitle}>
          Curated collection of living botanicals with guaranteed root health and insulated transit protection.
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)/explore" as any)}
          style={styles.heroButton}
        >
          <Text style={styles.heroButtonText}>Explore Catalog</Text>
          <Ionicons name="chevron-forward" size={13} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* 3. Trust Strip */}
      <View style={styles.trustGrid}>
        {TRUST_ITEMS.map((item, idx) => (
          <View key={idx} style={styles.trustCard}>
            <Ionicons name={item.icon} size={18} color={Colors.forest} style={{ marginBottom: 4 }} />
            <Text style={styles.trustTitle}>{item.title}</Text>
            <Text style={styles.trustDesc}>{item.desc}</Text>
          </View>
        ))}
      </View>

      {/* 4. Botanical Taxonomy Rail */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Botanical Taxonomy</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/explore" as any)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text style={styles.seeAll}>View All</Text>
              <Ionicons name="chevron-forward" size={12} color={Colors.terracotta} />
            </View>
          </TouchableOpacity>
        </View>

        {loading && categories.length === 0 ? (
          <View style={{ flexDirection: "row", gap: Spacing.xs, paddingVertical: Spacing.xs }}>
            <FloriaSkeleton width={80} height={32} borderRadius={16} />
            <FloriaSkeleton width={95} height={32} borderRadius={16} />
            <FloriaSkeleton width={110} height={32} borderRadius={16} />
            <FloriaSkeleton width={90} height={32} borderRadius={16} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            <CategoryChip
              label="All Plants"
              selected={selectedCategory === "all"}
              onPress={() => setSelectedCategory("all")}
            />
            {categories.map((c) => (
              <CategoryChip
                key={c.id || c.slug}
                label={c.name}
                selected={selectedCategory === c.slug}
                onPress={() => {
                  setSelectedCategory(c.slug);
                  router.push({
                    pathname: "/(tabs)/explore",
                    params: { category: c.slug },
                  } as any);
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* 5. Curated Specimens (Product Grid) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Curated Specimens</Text>
            <Text style={styles.sectionSubtitle}>Hand-selected botanical living plants</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/explore" as any)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text style={styles.seeAll}>See More</Text>
              <Ionicons name="chevron-forward" size={12} color={Colors.terracotta} />
            </View>
          </TouchableOpacity>
        </View>

        {loading && featuredProducts.length === 0 ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <View style={styles.productsGrid}>
            {featuredProducts.map((p) => {
              const prod = p.product || p;
              const primaryImage =
                prod.images?.find((img: any) => img.is_primary)?.url ||
                prod.images?.[0]?.url;
              const stockQty =
                p.inventory?.stock_quantity ??
                (Array.isArray(p.inventory) ? p.inventory[0]?.stock_quantity : undefined) ??
                (Array.isArray(prod.inventory) ? prod.inventory[0]?.stock_quantity : undefined) ??
                prod.inventory?.stock_quantity ??
                p.stock_quantity ??
                prod.stock_quantity;
              const isOutOfStock =
                typeof stockQty === "number"
                  ? stockQty <= 0
                  : Boolean(p.is_out_of_stock ?? prod.is_out_of_stock ?? false);

              return (
                <View key={prod.id || p.id} style={styles.gridItem}>
                  <ProductCard
                    id={prod.id || p.id}
                    name={prod.name}
                    pricePaise={
                      p.pricing?.customerPricePaise ||
                      p.pricing?.sellingPricePaise ||
                      p.customer_price_paise ||
                      p.price_paise ||
                      p.inventory?.price_paise ||
                      129900
                    }
                    nurseryId={p.seller_id || prod.seller_id || "nursery-1"}
                    nurseryName={p.seller_name || p.nursery_name || "Floria Nursery"}
                    imageUrl={primaryImage}
                    careLevel={prod.care_level}
                    isOutOfStock={isOutOfStock}
                    rating={p.rating_summary?.avg_rating ?? p.rating}
                    reviewCount={p.rating_summary?.review_count ?? p.review_count}
                    isFreeDelivery={Boolean(p.pricing?.isFreeDelivery ?? p.is_free_delivery ?? p.isFreeDelivery)}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* 6. Recently Explored Specimens */}
      <RecentlyViewedSection title="Recently Explored by You" />

      {/* 7. Curated Growers (Editorial Discovery Section) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Curated Growers</Text>
            <Text style={styles.sectionSubtitle}>
              Discover botanical collections from Floria's trusted growers
            </Text>
          </View>
        </View>

        {loading && nurseries.length === 0 ? (
          <View style={{ gap: Spacing.sm }}>
            <FloriaSkeleton width="100%" height={90} borderRadius={BorderRadius.lg} />
            <FloriaSkeleton width="100%" height={90} borderRadius={BorderRadius.lg} />
          </View>
        ) : (
          nurseries.slice(0, 3).map((n) => (
            <NurseryCard
              key={n.id}
              id={n.id}
              name={n.business_name || n.name}
              city={n.city || "Raipur"}
              story={n.story || n.business_description || n.description}
              rating={n.rating}
              plantCount={n.product_count || 16}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  contentContainer: {
    paddingBottom: Spacing.xxl + 40,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  clearSearchBtn: {
    padding: 4,
  },
  hero: {
    backgroundColor: Colors.forest,
    margin: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  heroPreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.xs,
  },
  heroPre: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.botanical,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    color: Colors.white,
    fontFamily: "Georgia",
    lineHeight: Typography.lineHeights.xl,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.botanical,
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
  },
  heroButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trustGrid: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  trustCard: {
    flex: 1,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xs + 2,
    alignItems: "center",
    textAlign: "center",
  },
  trustTitle: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.ink,
    textAlign: "center",
  },
  trustDesc: {
    fontSize: 8,
    color: Colors.inkMuted,
    textAlign: "center",
    marginTop: 1,
  },
  section: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md + 1,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "Georgia",
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  seeAll: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.terracotta,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  categoriesList: {
    paddingVertical: Spacing.xs,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -Spacing.xs,
  },
  gridItem: {
    width: "50%",
  },
});
