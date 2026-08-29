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
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
  const images = prod.images && prod.images.length > 0 ? prod.images : [];
  const primaryImage =
    images[activeImageIndex]?.url ||
    images[0]?.url ||
    prod.images?.find((img: any) => img.is_primary)?.url ||
    prod.images?.[0]?.url;

  const isLiked = isInWishlist(prod.id);

  const handleAddToCart = () => {
    addItem(
      {
        productId: prod.id,
        nurseryId: seller.id || "nursery-1",
        nurseryName: seller.business_name || seller.name || "Floria Partner Nursery",
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

  const handleBuyNow = () => {
    addItem(
      {
        productId: prod.id,
        nurseryId: seller.id || "nursery-1",
        nurseryName: seller.business_name || seller.name || "Floria Partner Nursery",
        name: prod.name,
        pricePaise,
        imageUrl: primaryImage,
      },
      quantity,
    );
    router.push("/(tabs)/cart" as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Photo Gallery Showcase */}
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

          {/* Top-Right Wishlist Heart */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              toggleWishlist({
                productId: prod.id,
                name: prod.name,
                pricePaise,
                nurseryName: seller.business_name || "Floria Partner Nursery",
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

        {/* Thumbnail selector if multiple images exist */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailRow}
          >
            {images.map((img: any, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setActiveImageIndex(idx)}
                style={[
                  styles.thumbnailWrapper,
                  activeImageIndex === idx && styles.thumbnailActive,
                ]}
              >
                <Image source={{ uri: img.url }} style={styles.thumbnail} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Botanical Identity & Nursery Card */}
        <View style={styles.detailsContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              seller.id && router.push(`/nurseries/${seller.id}` as any)
            }
            style={styles.nurseryChip}
          >
            <Ionicons name="storefront-outline" size={13} color={Colors.forest} />
            <Text style={styles.nurseryName}>
              {seller.business_name || "Floria Partner Nursery"}
            </Text>
            <Ionicons name="chevron-forward" size={12} color={Colors.forest} />
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
                size={18}
                color={Colors.forest}
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.specTitle}>Sunlight</Text>
              <Text style={styles.specVal}>
                {prod.light_requirement || "Bright Indirect"}
              </Text>
            </View>
            <View style={styles.specCard}>
              <Ionicons
                name="water-outline"
                size={18}
                color={Colors.forest}
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.specTitle}>Watering</Text>
              <Text style={styles.specVal}>
                {prod.watering_schedule || "Every 4–6 Days"}
              </Text>
            </View>
            <View style={styles.specCard}>
              <Ionicons
                name="leaf-outline"
                size={18}
                color={Colors.forest}
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.specTitle}>Care Level</Text>
              <Text style={styles.specVal}>
                {prod.care_level || "Easy Care"}
              </Text>
            </View>
          </View>

          {/* Botanical Overview */}
          {prod.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionHeading}>Botanical Overview</Text>
              <Text style={styles.descriptionText}>{prod.description}</Text>
            </View>
          )}

          {/* 7-Day Guarantee Banner */}
          <View style={styles.guaranteeBanner}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.forest} />
            <View style={styles.guaranteeTextCol}>
              <Text style={styles.guaranteeTitle}>7-Day Transit Health Guarantee</Text>
              <Text style={styles.guaranteeSub}>
                Guaranteed hydrated root delivery from our certified grower network.
              </Text>
            </View>
          </View>

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

      {/* Flipkart-Style Sticky Bottom Bar: [ Add to Bag ] + [ Buy Now ] */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={stock <= 0}
          onPress={handleAddToCart}
          style={[styles.addToBagBtn, stock <= 0 && styles.btnDisabled]}
        >
          <Ionicons name="bag-handle-outline" size={16} color={Colors.terracotta} />
          <Text style={styles.addToBagText}>Add to Bag</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={stock <= 0}
          onPress={handleBuyNow}
          style={[styles.buyNowBtn, stock <= 0 && styles.btnDisabled]}
        >
          <Ionicons name="flash-outline" size={16} color={Colors.white} />
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
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
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  wishlistButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    backgroundColor: Colors.linen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  thumbnailWrapper: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: "transparent",
    overflow: "hidden",
  },
  thumbnailActive: {
    borderColor: Colors.forest,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  detailsContainer: {
    padding: Spacing.md,
  },
  nurseryChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.botanical,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 4,
    marginBottom: Spacing.sm,
  },
  nurseryName: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
  },
  productName: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    lineHeight: Typography.lineHeights.xl,
  },
  botanicalName: {
    fontSize: Typography.fontSizes.sm,
    fontStyle: "italic",
    color: Colors.sage,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  price: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: "bold",
    color: Colors.forest,
  },
  stockBadge: {
    backgroundColor: Colors.botanical,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  stockBadgeLow: {
    backgroundColor: Colors.warningBg,
  },
  stockBadgeOut: {
    backgroundColor: Colors.errorBg,
  },
  stockBadgeText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.forest,
  },
  specsGrid: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  specCard: {
    flex: 1,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    alignItems: "center",
    textAlign: "center",
  },
  specTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.inkLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  specVal: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.ink,
    marginTop: 2,
    textAlign: "center",
  },
  descriptionSection: {
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkLight,
    lineHeight: Typography.lineHeights.base,
  },
  guaranteeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm + 2,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  guaranteeTextCol: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
  },
  guaranteeSub: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  quantitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  quantityLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600",
    color: Colors.ink,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.page,
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
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    color: Colors.forest,
  },
  stepperVal: {
    minWidth: 32,
    textAlign: "center",
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
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
    gap: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 6,
  },
  addToBagBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.terracotta,
    backgroundColor: Colors.page,
  },
  addToBagText: {
    color: Colors.terracotta,
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  buyNowBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.forest,
  },
  buyNowText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
