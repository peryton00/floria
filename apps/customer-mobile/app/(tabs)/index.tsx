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
import { LocationSelector } from "../../components/customer/LocationSelector";
import { ProductCard } from "../../components/customer/ProductCard";
import { NurseryCard } from "../../components/customer/NurseryCard";
import { CategoryChip } from "../../components/customer/CategoryChip";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

const TRUST_ITEMS = [
  { icon: "storefront-outline" as const, title: "Verified Nurseries", desc: "Certified growers" },
  { icon: "shield-checkmark-outline" as const, title: "Plant Guarantee", desc: "7-day root health" },
  { icon: "card-outline" as const, title: "Secure Checkout", desc: "Cashfree encrypted" },
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
      const [catRes, prodRes] = await Promise.all([
        api.getCategories(),
        api.getProducts({ limit: 16 }),
      ]);

      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
      if (prodRes.success && prodRes.data) {
        setFeaturedProducts(prodRes.data);

        const uniqueNurseriesMap = new Map<string, any>();
        prodRes.data.forEach((p: any) => {
          const seller = p.seller || {
            id: p.seller_id || "nursery-1",
            business_name: p.seller_name || p.nursery_name || "Floria Partner Nursery",
            city: "Raipur",
          };
          if (seller.id && !uniqueNurseriesMap.has(seller.id)) {
            uniqueNurseriesMap.set(seller.id, {
              id: seller.id,
              name: seller.business_name || "Floria Partner Nursery",
              city: seller.city || "Raipur",
              story: "Certified partner botanical grower",
              rating: p.rating || 4.9,
              plantCount: 12,
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

  if (loading) {
    return <LoadingState message="Discovering botanical nurseries..." />;
  }

  if (error && featuredProducts.length === 0) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.forest]}
        />
      }
    >
      {/* 1. Header Location Selector & Search */}
      <View style={styles.topHeaderBar}>
        <LocationSelector />
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile" as any)}
          style={styles.profileAvatarBtn}
        >
          <Ionicons name="person-circle-outline" size={28} color={Colors.forest} />
        </TouchableOpacity>
      </View>

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
          <TouchableOpacity onPress={() => setSearchQuery("")}>
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
          Directly sourced from certified master nurseries with guaranteed transit health protection.
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

      {/* 4. Botanical Categories Horizontal Rail */}
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
              key={c.id}
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
      </View>

      {/* 5. Featured Plants Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Curated Specimens</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/explore" as any)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text style={styles.seeAll}>See More</Text>
              <Ionicons name="chevron-forward" size={12} color={Colors.terracotta} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.productsGrid}>
          {featuredProducts.map((p) => {
            const prod = p.product || p;
            const primaryImage =
              prod.images?.find((img: any) => img.is_primary)?.url ||
              prod.images?.[0]?.url;
            return (
              <View key={prod.id} style={styles.gridItem}>
                <ProductCard
                  id={prod.id}
                  name={prod.name}
                  pricePaise={p.price_paise || p.inventory?.price_paise || 129900}
                  nurseryId={p.seller_id || prod.seller_id || "nursery-1"}
                  nurseryName={p.seller_name || p.nursery_name || "Floria Partner Nursery"}
                  imageUrl={primaryImage}
                  careLevel={prod.care_level || "EASY"}
                  rating={p.rating}
                  reviewCount={p.review_count}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* 6. Verified Partner Nurseries */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Partner Nurseries</Text>
        </View>

        {nurseries.map((n) => (
          <NurseryCard
            key={n.id}
            id={n.id}
            name={n.business_name || n.name}
            city={n.city || "Raipur"}
            story={n.story || n.description}
            rating={n.rating || 4.9}
            plantCount={n.product_count || 12}
          />
        ))}
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
    paddingBottom: Spacing.xl,
  },
  topHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  profileAvatarBtn: {
    padding: Spacing.xs,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    height: 42,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  hero: {
    backgroundColor: Colors.forest,
    margin: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "Georgia",
  },
  seeAll: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.terracotta,
    fontWeight: "bold",
    textTransform: "uppercase",
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
