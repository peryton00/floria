import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { ProductCard } from "../../components/customer/ProductCard";
import { NurseryCard } from "../../components/customer/NurseryCard";
import { CategoryChip } from "../../components/customer/CategoryChip";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

export default function CustomerHomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [nurseries, setNurseries] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [catRes, prodRes] = await Promise.all([
        api.getCategories(),
        api.getProducts({ limit: 12 }),
      ]);

      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
      if (prodRes.success && prodRes.data) {
        setFeaturedProducts(prodRes.data);

        // Derive unique nursery partners from real product catalog
        const uniqueNurseriesMap = new Map<string, any>();
        prodRes.data.forEach((p: any) => {
          const seller = p.seller || {
            id: p.seller_id || "nursery-1",
            business_name:
              p.seller_name || p.nursery_name || "Green Oasis Nursery",
            city: "Bengaluru",
          };
          if (seller.id && !uniqueNurseriesMap.has(seller.id)) {
            uniqueNurseriesMap.set(seller.id, {
              id: seller.id,
              name: seller.business_name || "Green Oasis Botanical Nursery",
              city: seller.city || "Bengaluru",
              story:
                "Certified regional grower specializing in acclimatized tropical foliage, rare aroids, and organic potting mediums.",
              rating: 4.9,
              plantCount: 18,
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
      {/* Hero Banner */}
      <View style={styles.hero}>
        <Text style={styles.heroPre}>Hyperlocal Plant Marketplace</Text>
        <Text style={styles.heroTitle}>Living Art for Mindful Sanctuaries</Text>
        <Text style={styles.heroSubtitle}>
          Directly sourced from Bengaluru's master botanical nurseries and
          delivered within hours.
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)/explore" as any)}
          style={styles.heroButton}
        >
          <Text style={styles.heroButtonText}>Explore Catalog →</Text>
        </TouchableOpacity>
      </View>

      {/* Botanical Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Botanical Taxonomy</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/explore" as any)}
          >
            <Text style={styles.seeAll}>View All →</Text>
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

      {/* Featured Plants Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Curated Specimens</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/explore" as any)}
          >
            <Text style={styles.seeAll}>See More →</Text>
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
                  pricePaise={
                    p.price_paise || p.inventory?.price_paise || 129900
                  }
                  nurseryId={p.seller_id || prod.seller_id || "nursery-1"}
                  nurseryName={
                    p.seller_name || p.nursery_name || "Green Oasis Nursery"
                  }
                  imageUrl={primaryImage}
                  careLevel={prod.care_level || "EASY"}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Verified Partner Nurseries */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Partner Nurseries</Text>
        </View>

        {nurseries.map((n) => (
          <NurseryCard
            key={n.id}
            id={n.id}
            name={n.business_name || n.name}
            city={n.city || "Bengaluru"}
            story={n.story || n.description}
            rating={n.rating || 4.9}
            plantCount={n.product_count || 18}
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
  heroPre: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.botanical,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
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
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
