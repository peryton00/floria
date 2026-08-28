import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { useCart } from "../../lib/contexts/CartContext";
import { useWishlist } from "../../lib/contexts/WishlistContext";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [productData, setProductData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getProductBySlug(id);
      if (res.success && res.data) {
        setProductData(res.data);
      } else {
        setError(res.error?.message || "Botanical specimen not found.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load plant details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading) {
    return <LoadingState message="Inspecting botanical details..." />;
  }

  if (error || !productData) {
    return (
      <ErrorState
        message={error || "Product unavailable."}
        onRetry={fetchProduct}
      />
    );
  }

  const prod = productData.product || productData;
  const seller = productData.seller || productData.nursery || {};
  const inventory = productData.inventory || {};
  const pricePaise = inventory.price_paise || productData.price_paise || 129900;
  const stock = inventory.stock_quantity ?? productData.stock_quantity ?? 10;
  const primaryImage =
    prod.images?.find((img: any) => img.is_primary)?.url ||
    prod.images?.[0]?.url;
  const isLiked = isInWishlist(prod.id);

  const handleAddToCart = () => {
    addItem(
      {
        productId: prod.id,
        nurseryId: seller.id || "nursery-1",
        nurseryName: seller.business_name || seller.name || "Nursery Partner",
        name: prod.name,
        pricePaise,
        imageUrl: primaryImage,
      },
      quantity,
    );
    Alert.alert(
      "Added to Bag",
      `${quantity} × ${prod.name} added to your botanical cart.`,
      [
        { text: "Continue Shopping", style: "cancel" },
        { text: "View Bag", onPress: () => router.push("/(tabs)/cart" as any) },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Photo Gallery */}
        <View style={styles.imageContainer}>
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="leaf-outline" size={64} color={Colors.sage} />
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              toggleWishlist({
                productId: prod.id,
                name: prod.name,
                pricePaise,
                nurseryName: seller.business_name || "Nursery Partner",
                imageUrl: primaryImage,
              })
            }
            style={styles.wishlistButton}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={22}
              color={isLiked ? Colors.terracotta : Colors.inkLight}
            />
          </TouchableOpacity>
        </View>

        {/* Botanical Identity & Nursery */}
        <View style={styles.detailsContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              seller.id && router.push(`/nurseries/${seller.id}` as any)
            }
            style={styles.nurseryChip}
          >
            <Text style={styles.nurseryName}>
              {seller.business_name || "Verified Nursery Partner"}
            </Text>
            <Ionicons name="arrow-forward" size={12} color={Colors.forest} />
          </TouchableOpacity>

          <Text style={styles.productName}>{prod.name}</Text>
          {prod.botanical_name && (
            <Text style={styles.botanicalName}>{prod.botanical_name}</Text>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatINR(pricePaise)}</Text>
            <View
              style={[
                styles.stockBadge,
                stock <= 0 && styles.stockBadgeOut,
                stock > 0 && stock <= 5 && styles.stockBadgeLow,
              ]}
            >
              <Text style={styles.stockBadgeText}>
                {stock <= 0
                  ? "Out of Stock"
                  : stock <= 5
                    ? `Only ${stock} Left`
                    : "In Stock"}
              </Text>
            </View>
          </View>

          {/* Plant Care Specification Cards */}
          <View style={styles.specsGrid}>
            <View style={styles.specCard}>
              <Ionicons
                name="sunny-outline"
                size={20}
                color={Colors.forest}
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.specTitle}>Light</Text>
              <Text style={styles.specVal}>
                {prod.light_requirement || "Bright Indirect"}
              </Text>
            </View>
            <View style={styles.specCard}>
              <Ionicons
                name="water-outline"
                size={20}
                color={Colors.forest}
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.specTitle}>Water</Text>
              <Text style={styles.specVal}>
                {prod.watering_schedule || "Every 4–6 Days"}
              </Text>
            </View>
            <View style={styles.specCard}>
              <Ionicons
                name="leaf-outline"
                size={20}
                color={Colors.forest}
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.specTitle}>Care</Text>
              <Text style={styles.specVal}>
                {prod.care_level || "Easy Care"}
              </Text>
            </View>
          </View>

          {/* Description */}
          {prod.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionHeading}>Botanical Overview</Text>
              <Text style={styles.descriptionText}>{prod.description}</Text>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity(Math.min(stock, quantity + 1))}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Sticky Footer */}
      <View style={styles.footer}>
        <View style={styles.footerPriceContainer}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerPrice}>
            {formatINR(pricePaise * quantity)}
          </Text>
        </View>
        <Button
          label="Add to Botanical Bag"
          onPress={handleAddToCart}
          disabled={stock <= 0}
          style={styles.addToCartBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  content: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: "100%",
    height: 320,
    backgroundColor: Colors.naturalSand,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  wishlistButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  wishlistIcon: {
    fontSize: 22,
    color: Colors.inkLight,
  },
  wishlistIconActive: {
    color: Colors.terracotta,
  },
  detailsContainer: {
    padding: Spacing.lg,
  },
  nurseryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: "flex-start",
    marginBottom: Spacing.xs,
  },
  nurseryName: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
    textTransform: "uppercase",
    marginRight: 4,
  },
  nurseryArrow: {
    fontSize: 12,
    color: Colors.forest,
  },
  productName: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    lineHeight: 30,
    marginTop: Spacing.xs,
  },
  botanicalName: {
    fontSize: Typography.fontSizes.sm,
    fontStyle: "italic",
    color: Colors.sage,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: Spacing.sm,
  },
  price: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: "bold",
    color: Colors.forest,
  },
  stockBadge: {
    backgroundColor: Colors.botanical,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  stockBadgeLow: {
    backgroundColor: Colors.warningBg,
  },
  stockBadgeOut: {
    backgroundColor: Colors.errorBg,
  },
  stockBadgeText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forestDark,
    textTransform: "uppercase",
  },
  specsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  specCard: {
    flex: 1,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  specIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  specTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
  },
  specVal: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.ink,
    textAlign: "center",
    marginTop: 2,
  },
  descriptionSection: {
    marginVertical: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkLight,
    lineHeight: Typography.lineHeights.base,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: Spacing.md,
    paddingTop: Spacing.sm,
  },
  quantityLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.sand,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.ink,
  },
  stepperVal: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    paddingHorizontal: 12,
    color: Colors.ink,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.linen,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerPriceContainer: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 10,
    color: Colors.inkMuted,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  footerPrice: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    color: Colors.forest,
  },
  addToCartBtn: {
    flex: 1.5,
  },
});
