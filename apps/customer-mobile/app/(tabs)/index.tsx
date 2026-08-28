import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { ProductCard } from "../../components/customer/ProductCard";
import { NurseryCard } from "../../components/customer/NurseryCard";
import { CategoryChip } from "../../components/customer/CategoryChip";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

// Trust strip items — mirrors web's mobile trust strip
const TRUST_ITEMS = [
  { icon: "storefront-outline" as const, lines: ["Trusted", "Nurseries"] },
  { icon: "leaf-outline" as const, lines: ["Quality", "Products"] },
  { icon: "shield-checkmark-outline" as const, lines: ["Secure", "Payments"] },
  { icon: "bicycle-outline" as const, lines: ["Fast", "Delivery"] },
];

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

        const uniqueNurseriesMap = new Map<string, any>();
        prodRes.data.forEach((p: any) => {
          const seller = p.seller || {
            id: p.seller_id || "nursery-1",
            business_name: p.seller_name || p.nursery_name || "Green Oasis Nursery",
            city: "Bengaluru",
          };
          if (seller.id && !uniqueNurseriesMap.has(seller.id)) {
            uniqueNurseriesMap.set(seller.id, {
              id: seller.id,
              name: seller.business_name || "Green Oasis Botanical Nursery",
              city: seller.city || "Bengaluru",
              story: "Certified regional grower specializing in acclimatized tropical foliage, rare aroids, and organic potting mediums.",
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

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return <LoadingState message="Discovering botanical nurseries..." />;
  if (error && featuredProducts.length === 0) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.page} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.forest]} />
        }
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          {/* Pill badge — "PURE. ORGANIC. SUSTAINABLE." */}
          <View style={styles.heroPill}>
            <Ionicons name="leaf-outline" size={10} color={Colors.sage} />
            <Text style={styles.heroPillText}>PURE. ORGANIC. SUSTAINABLE.</Text>
          </View>

          {/* Headline */}
          <Text style={styles.heroTitle}>
            {"Discover.\nChoose. Grow."}
          </Text>
          <Text style={styles.heroSubtitle}>
            Plants & gardening essentials from trusted nurseries, delivered to your door.
          </Text>

          {/* CTAs — matches web's two-button row */}
          <View style={styles.heroCTAs}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/explore" as any)}
              style={styles.heroButtonPrimary}
            >
              <Text style={styles.heroButtonPrimaryText}>Explore Plants →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/explore" as any)}
              style={styles.heroButtonOutline}
            >
              <Text style={styles.heroButtonOutlineText}>SHOP GARDENING</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── TRUST STRIP — mirrors web mobile strip ── */}
        <View style={styles.trustStrip}>
          {TRUST_ITEMS.map(({ icon, lines }, i) => (
            <View
              key={i}
              style={[
                styles.trustItem,
                i < TRUST_ITEMS.length - 1 && styles.trustItemBorder,
              ]}
            >
              <Ionicons name={icon} size={20} color={Colors.forest} />
              <Text style={styles.trustLine}>{lines[0]}</Text>
              <Text style={styles.trustLine}>{lines[1]}</Text>
            </View>
          ))}
        </View>

        {/* ── SHOP BY CATEGORY ── */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionPill}>
              <Text style={styles.sectionPillText}>Curated Flora & Essentials</Text>
            </View>
          </View>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Shop by Category</Text>
              <Text style={styles.sectionSubtitle}>
                From air-purifying foliage to handcrafted planters.
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/explore" as any)}>
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
                  router.push({ pathname: "/(tabs)/explore", params: { category: c.slug } } as any);
                }}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── BEST SELLERS ── */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionPill}>
              <Text style={styles.sectionPillText}>Hand-Picked Specimens</Text>
            </View>
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Best Sellers</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/explore" as any)}>
              <Text style={styles.seeAll}>See More →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productsGrid}>
            {featuredProducts.slice(0, 6).map((p) => {
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
                    nurseryName={p.seller_name || p.nursery_name || "Green Oasis Nursery"}
                    imageUrl={primaryImage}
                    careLevel={prod.care_level || "EASY"}
                    isVerified={p.seller?.is_verified}
                    rating={p.rating_summary?.avg_rating}
                    reviewCount={p.rating_summary?.review_count ?? 0}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* ── PARTNER NURSERIES ── */}
        {nurseries.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <View style={styles.sectionPill}>
                <Text style={styles.sectionPillText}>Verified Partners</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Our Nurseries</Text>
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
        )}

        {/* ── 7-DAY GUARANTEE BANNER ── */}
        <View style={styles.guaranteeBanner}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.forestDark} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.guaranteeTitle}>7-Day Botanical Transit Guarantee</Text>
            <Text style={styles.guaranteeText}>
              Every plant arrives hand-delivered with insulated packaging and guaranteed healthy.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.page },
  contentContainer: { paddingBottom: Spacing.xxl },

  // ── Hero ──
  hero: {
    backgroundColor: Colors.page,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: "#F0F5EB",
    borderWidth: 1,
    borderColor: "#D5DEC8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginBottom: 10,
  },
  heroPillText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#4A6B43",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: "bold",
    color: Colors.forest,
    fontFamily: "Georgia",
    letterSpacing: -0.5,
    lineHeight: Typography.lineHeights.xxl,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkLight,
    lineHeight: Typography.lineHeights.sm,
    marginBottom: Spacing.md,
    maxWidth: 280,
  },
  heroCTAs: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  heroButtonPrimary: {
    backgroundColor: "#1E3E26",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  heroButtonPrimaryText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
  },
  heroButtonOutline: {
    borderWidth: 1.5,
    borderColor: "#1E3E26",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  heroButtonOutlineText: {
    color: "#1E3E26",
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // ── Trust strip ──
  trustStrip: {
    flexDirection: "row",
    backgroundColor: Colors.page,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  trustItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  trustItemBorder: {
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  trustLine: {
    fontSize: 8,
    fontWeight: "700",
    color: Colors.ink,
    textAlign: "center",
    lineHeight: 11,
    marginTop: 2,
  },

  // ── Sections ──
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionLabelRow: {
    marginBottom: Spacing.xs,
  },
  sectionPill: {
    alignSelf: "flex-start",
    backgroundColor: "#F0F5EB",
    borderWidth: 1,
    borderColor: "#C4D3C5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  sectionPillText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.forest,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "Georgia",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 2,
    maxWidth: 220,
  },
  seeAll: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.forest,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoriesList: {
    paddingVertical: Spacing.xs,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -Spacing.xs,
  },
  gridItem: { width: "50%" },

  // ── Guarantee banner ──
  guaranteeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    margin: Spacing.md,
    marginTop: Spacing.lg,
    backgroundColor: Colors.sand,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guaranteeTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forestDark,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  guaranteeText: {
    fontSize: 11,
    color: Colors.inkLight,
    lineHeight: 16,
  },
});
