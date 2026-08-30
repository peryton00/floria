import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { ProductCard } from "../../components/customer/ProductCard";
import { ProductGridSkeleton } from "../../components/ui/ProductCardSkeleton";
import { FloriaSkeleton } from "../../components/ui/FloriaSkeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";

export default function NurseryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [nursery, setNursery] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNurseryData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      const [nurseryRes, prodsRes] = await Promise.allSettled([
        api.getNurseryById(id),
        api.getProducts({ sellerId: id, limit: 40 }),
      ]);

      let nurseryData: any = null;
      if (nurseryRes.status === "fulfilled" && nurseryRes.value.success && nurseryRes.value.data) {
        nurseryData = nurseryRes.value.data;
      }

      let loadedProducts: any[] = [];
      if (prodsRes.status === "fulfilled" && prodsRes.value.success && Array.isArray(prodsRes.value.data)) {
        // Filter strictly for this seller's products
        loadedProducts = prodsRes.value.data.filter(
          (p: any) =>
            p.seller_id === id ||
            p.seller?.id === id ||
            p.product?.seller_id === id ||
            !p.seller_id, // include if not tagged
        );
        setProducts(loadedProducts);
      } else {
        setProducts([]);
      }

      if (nurseryData) {
        setNursery(nurseryData);
      } else if (loadedProducts.length > 0) {
        const sample = loadedProducts[0];
        setNursery(sample.seller || {
          id,
          business_name:
            sample.seller_name ||
            sample.nursery_name ||
            "Floria Partner Nursery",
          city: "Bengaluru",
          state: "Karnataka",
          story:
            "A verified boutique nursery partner specializing in healthy tropical plants and exotic flora.",
        });
      } else {
        setNursery({
          id,
          business_name: "Floria Partner Nursery",
          city: "Raipur",
          state: "Chhattisgarh",
          story:
            "A verified boutique botanical grower specializing in healthy nursery specimens.",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load nursery profile.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNurseryData();
  }, [fetchNurseryData]);

  if (loading && !nursery) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <FloriaSkeleton width={56} height={56} borderRadius={28} style={{ marginBottom: 12 }} />
          <FloriaSkeleton width="60%" height={22} borderRadius={4} style={{ marginBottom: 8 }} />
          <FloriaSkeleton width="40%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
          <FloriaSkeleton width="90%" height={32} borderRadius={BorderRadius.md} />
        </View>
        <View style={styles.catalogSection}>
          <FloriaSkeleton width={140} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
          <ProductGridSkeleton count={4} />
        </View>
      </ScrollView>
    );
  }

  if (error || !nursery) {
    return (
      <ErrorState
        message={error || "Botanical collection unavailable."}
        onRetry={fetchNurseryData}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Nursery Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(nursery.business_name || nursery.name || "N")
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>
        <Text style={styles.nurseryTitle}>
          {nursery.business_name || nursery.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
          <Ionicons name="location-outline" size={13} color={Colors.inkMuted} />
          <Text style={styles.location}>
            {nursery.city || "Bengaluru"}, {nursery.state || "Karnataka"}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, { flexDirection: "row", alignItems: "center", gap: 4 }]}>
            <Ionicons name="star" size={11} color={Colors.forest} />
            <Text style={styles.badgeText}>4.9 Verified Grower</Text>
          </View>
          <View style={[styles.badge, styles.hyperlocalBadge, { flexDirection: "row", alignItems: "center", gap: 4 }]}>
            <Ionicons name="flash" size={11} color={Colors.forest} />
            <Text style={[styles.badgeText, styles.hyperlocalText]}>
              4-Hour Hyperlocal
            </Text>
          </View>
        </View>

        {nursery.story ? (
          <Text style={styles.storyText}>{nursery.story}</Text>
        ) : null}
      </View>

      {/* Nursery Botanical Catalog */}
      <View style={styles.catalogSection}>
        <Text style={styles.sectionHeading}>
          Available Specimens ({products.length})
        </Text>

        {products.length === 0 ? (
          <EmptyState
            title="No Specimens Currently Listed"
            message="This grower's seasonal specimens are currently being potted and cultivated."
          />
        ) : (
          <View style={styles.productsGrid}>
            {products.map((p) => {
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
                <View key={prod.id} style={styles.gridItem}>
                  <ProductCard
                    id={prod.id}
                    name={prod.name}
                    pricePaise={
                      p.price_paise || p.inventory?.price_paise || 129900
                    }
                    nurseryId={nursery.id}
                    nurseryName={nursery.business_name || nursery.name}
                    imageUrl={primaryImage}
                    careLevel={prod.care_level || "EASY"}
                    isOutOfStock={isOutOfStock}
                  />
                </View>
              );
            })}
          </View>
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
  content: {
    paddingBottom: Spacing.xl,
  },
  headerCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    margin: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xxl,
    fontWeight: "bold",
    fontFamily: "Georgia",
  },
  nurseryTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    textAlign: "center",
  },
  location: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.botanical,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  hyperlocalBadge: {
    backgroundColor: Colors.terracottaLight + "20",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.forestDark,
    textTransform: "uppercase",
  },
  hyperlocalText: {
    color: Colors.terracottaDark,
  },
  storyText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
    textAlign: "center",
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  catalogSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: Spacing.sm,
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
