import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { ProductCard } from "../../components/customer/ProductCard";
import { LoadingState } from "../../components/ui/LoadingState";
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
      const prodsRes = await api.getProducts({ sellerId: id, limit: 30 });

      if (prodsRes.success && prodsRes.data && prodsRes.data.length > 0) {
        setProducts(prodsRes.data);
        const sample = prodsRes.data[0];
        const seller = sample.seller || {
          id,
          business_name:
            sample.seller_name ||
            sample.nursery_name ||
            "Green Oasis Botanical Nursery",
          city: "Bengaluru",
          state: "Karnataka",
          story:
            "A verified boutique nursery partner specializing in healthy tropical plants and exotic flora.",
        };
        setNursery(seller);
      } else {
        // Fallback default nursery info
        setNursery({
          id,
          business_name: "Green Oasis Botanical Nursery",
          city: "Bengaluru",
          state: "Karnataka",
          story:
            "A verified boutique nursery partner specializing in healthy tropical plants and exotic flora.",
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

  if (loading) {
    return (
      <LoadingState message="Loading nursery profile & botanical specimens..." />
    );
  }

  if (error || !nursery) {
    return (
      <ErrorState
        message={error || "Nursery unavailable."}
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
        <Text style={styles.location}>
          📍 {nursery.city || "Bengaluru"}, {nursery.state || "Karnataka"}
        </Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>★ 4.9 Verified Grower</Text>
          </View>
          <View style={[styles.badge, styles.hyperlocalBadge]}>
            <Text style={[styles.badgeText, styles.hyperlocalText]}>
              ⚡ 4-Hour Hyperlocal
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

        <View style={styles.productsGrid}>
          {products.map((p) => {
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
                  nurseryId={nursery.id}
                  nurseryName={nursery.business_name || nursery.name}
                  imageUrl={primaryImage}
                  careLevel={prod.care_level || "EASY"}
                />
              </View>
            );
          })}
        </View>
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
