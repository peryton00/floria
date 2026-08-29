import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { useCart } from "../../lib/contexts/CartContext";
import { useWishlist } from "../../lib/contexts/WishlistContext";
import { haptics } from "../../lib/haptics";
import { MotionTokens, useReducedMotion } from "../../lib/motion";
import { PressableScale } from "../../components/ui/PressableScale";
import { ProductCard } from "../../components/customer/ProductCard";
import { ProductDetailSkeleton } from "../../components/ui/ProductDetailSkeleton";
import { ProductCardSkeleton } from "../../components/ui/ProductCardSkeleton";
import { FloriaSkeleton } from "../../components/ui/FloriaSkeleton";
import { ErrorState } from "../../components/ui/ErrorState";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const reducedMotion = useReducedMotion();

  const [productData, setProductData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;

  const handleHeroImageLoad = () => {
    setHeroImageLoaded(true);
    if (!reducedMotion) {
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: MotionTokens.duration.short,
        easing: MotionTokens.easing.easeOut,
        useNativeDriver: true,
      }).start();
    } else {
      heroOpacity.setValue(1);
    }
  };

  // Recommendations state
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const fetchRecommendations = useCallback(async (currentProduct: any) => {
    try {
      setLoadingRecs(true);
      const catId = currentProduct.category_id || currentProduct.category?.id || currentProduct.category?.slug;
      
      const [catProdRes, generalProdRes] = await Promise.allSettled([
        catId ? api.getProducts({ category: catId, limit: 8 }) : Promise.resolve({ success: false, data: [] } as any),
        api.getProducts({ limit: 10 }),
      ]);

      const candidateList: any[] = [];
      const currentId = currentProduct.id;

      if (catProdRes.status === "fulfilled" && catProdRes.value.success && Array.isArray(catProdRes.value.data)) {
        candidateList.push(...catProdRes.value.data);
      }

      if (generalProdRes.status === "fulfilled" && generalProdRes.value.success && Array.isArray(generalProdRes.value.data)) {
        candidateList.push(...generalProdRes.value.data);
      }

      // Filter out duplicates and currently viewed product
      const uniqueMap = new Map<string, any>();
      candidateList.forEach((item) => {
        const prodObj = item.product || item;
        const itemId = prodObj.id || item.id;
        if (itemId && itemId !== currentId && !uniqueMap.has(itemId)) {
          uniqueMap.set(itemId, item);
        }
      });

      setRecommendations(Array.from(uniqueMap.values()).slice(0, 6));
    } catch {
      // Non-blocking: recommendations failure does not break the main page
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  }, []);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getProductBySlug(id);
      if (res.success && res.data) {
        setProductData(res.data);
        const prod = res.data.product || res.data;
        fetchRecommendations(prod);
      } else {
        setError(res.error?.message || "Botanical specimen not found.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load plant details.");
    } finally {
      setLoading(false);
    }
  }, [id, fetchRecommendations]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading && !productData) {
    return <ProductDetailSkeleton />;
  }

  if (error || !productData) {
    return (
      <ErrorState
        message={error || "Botanical specimen unavailable."}
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
  const bottomInset = Math.max(insets.bottom, 0);

  const handleAddToCart = () => {
    addItem(
      {
        productId: prod.id,
        nurseryId: seller.id || "nursery-1",
        nurseryName: seller.business_name || "Floria Nursery",
        name: prod.name,
        pricePaise,
        imageUrl: primaryImage,
      },
      quantity,
    );
    setIsAddedFeedback(true);

    setTimeout(() => {
      setIsAddedFeedback(false);
    }, 2000);
  };

  const handleBuyNow = () => {
    addItem(
      {
        productId: prod.id,
        nurseryId: seller.id || "nursery-1",
        nurseryName: seller.business_name || "Floria Nursery",
        name: prod.name,
        pricePaise,
        imageUrl: primaryImage,
      },
      quantity,
    );
    router.push("/(tabs)/cart" as any);
  };

  const isDescriptionLong = prod.description && prod.description.length > 180;
  const displayedDescription =
    isDescriptionLong && !showFullDescription
      ? `${prod.description.slice(0, 180).trim()}...`
      : prod.description;

  return (
    <View style={styles.container}>
      {/* Compact 44dp Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.forest} />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Botanical Specimen</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 88 + bottomInset },
        ]}
      >
        {/* 1. Large Hero Product Image Showcase */}
        <View style={styles.imageContainer}>
          {primaryImage ? (
            <>
              <Animated.Image
                source={{ uri: primaryImage }}
                style={[styles.image, { opacity: heroOpacity }]}
                resizeMode="cover"
                onLoadEnd={handleHeroImageLoad}
              />
              {!heroImageLoaded && (
                <View style={StyleSheet.absoluteFill}>
                  <FloriaSkeleton
                    width="100%"
                    height="100%"
                    borderRadius={0}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="leaf-outline" size={64} color={Colors.sage} />
            </View>
          )}

          {/* Floating Wishlist Heart — Top-Right Corner */}
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => {
              haptics.light();
              if (!reducedMotion) {
                Animated.sequence([
                  Animated.timing(heartScale, {
                    toValue: MotionTokens.scale.heartPulse,
                    duration: 90,
                    easing: MotionTokens.easing.easeOut,
                    useNativeDriver: true,
                  }),
                  Animated.timing(heartScale, {
                    toValue: 1,
                    duration: 110,
                    easing: MotionTokens.easing.easeIn,
                    useNativeDriver: true,
                  }),
                ]).start();
              }
              toggleWishlist({
                productId: prod.id,
                name: prod.name,
                pricePaise,
                nurseryName: "Floria Nursery",
                imageUrl: primaryImage,
              });
            }}
            style={styles.wishlistButton}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={20}
                color={isLiked ? Colors.terracotta : Colors.inkLight}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* 2. Horizontal Image Thumbnails (if multiple images exist) */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailRow}
          >
            {images.map((img: any, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  if (activeImageIndex !== idx) {
                    haptics.selection();
                    setActiveImageIndex(idx);
                  }
                }}
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

        {/* 3. Product Information Details Container */}
        <View style={styles.detailsContainer}>
          {/* Product Title */}
          <Text style={styles.productName}>{prod.name}</Text>
          {prod.botanical_name ? (
            <Text style={styles.botanicalName}>{prod.botanical_name}</Text>
          ) : null}

          {/* Price & Stock Row */}
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

          {/* 4. Plant Care Specification Cards */}
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

          {/* 5. Botanical Overview */}
          {prod.description ? (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionHeading}>Botanical Overview</Text>
              <Text style={styles.descriptionText}>{displayedDescription}</Text>
              {isDescriptionLong && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowFullDescription(!showFullDescription)}
                  style={styles.readMoreBtn}
                >
                  <Text style={styles.readMoreText}>
                    {showFullDescription ? "Show less" : "Read more"}
                  </Text>
                  <Ionicons
                    name={showFullDescription ? "chevron-up" : "chevron-down"}
                    size={12}
                    color={Colors.terracotta}
                  />
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* 6. 7-Day Plant Health Guarantee (Floria-First Benefit) */}
          <View style={styles.guaranteeBanner}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.forest} />
            <View style={styles.guaranteeTextCol}>
              <Text style={styles.guaranteeTitle}>7-Day Plant Health Guarantee</Text>
              <Text style={styles.guaranteeSub}>
                Your botanical specimen is protected for 7 days after delivery with guaranteed root health.
              </Text>
            </View>
          </View>

          {/* 7. Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                disabled={quantity <= 1}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={[styles.stepperBtn, quantity <= 1 && styles.stepperBtnDisabled]}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{quantity}</Text>
              <TouchableOpacity
                disabled={quantity >= stock}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => setQuantity(Math.min(stock, quantity + 1))}
                style={[styles.stepperBtn, quantity >= stock && styles.stepperBtnDisabled]}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 8. Recommendations: More to Explore */}
        {(loadingRecs || recommendations.length > 0) && (
          <View style={styles.recommendationsSection}>
            <View style={styles.recHeader}>
              <View>
                <Text style={styles.recTitle}>More to Explore</Text>
                <Text style={styles.recSubtitle}>
                  Related living plants for your sanctuary
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/explore" as any)}
                style={styles.seeAllBtn}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="arrow-forward" size={12} color={Colors.terracotta} />
              </TouchableOpacity>
            </View>

            {loadingRecs && recommendations.length === 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendationsList}
              >
                <View style={styles.recommendationCardWrapper}>
                  <ProductCardSkeleton />
                </View>
                <View style={styles.recommendationCardWrapper}>
                  <ProductCardSkeleton />
                </View>
                <View style={styles.recommendationCardWrapper}>
                  <ProductCardSkeleton />
                </View>
              </ScrollView>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendationsList}
              >
                {recommendations.map((rec) => {
                  const item = rec.product || rec;
                  const primaryImg =
                    item.images?.find((img: any) => img.is_primary)?.url ||
                    item.images?.[0]?.url;
                  return (
                    <View key={item.id || rec.id} style={styles.recommendationCardWrapper}>
                      <ProductCard
                        id={item.id || rec.id}
                        name={item.name}
                        pricePaise={rec.price_paise || rec.inventory?.price_paise || 129900}
                        imageUrl={primaryImg}
                        careLevel={item.care_level || "EASY"}
                        rating={rec.rating}
                        reviewCount={rec.review_count}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
      </ScrollView>

      {/* 9. Sticky Bottom Purchase Bar */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: bottomInset > 0 ? bottomInset + Spacing.xs : Spacing.md,
          },
        ]}
      >
        <PressableScale
          disabled={stock <= 0}
          onPress={handleAddToCart}
          targetScale={MotionTokens.scale.pressed}
          style={[
            styles.addToBagBtn,
            isAddedFeedback && styles.addToBagBtnSuccess,
            stock <= 0 && styles.btnDisabled,
          ]}
        >
          <Ionicons
            name={isAddedFeedback ? "checkmark-circle" : "bag-handle-outline"}
            size={16}
            color={isAddedFeedback ? Colors.white : Colors.terracotta}
          />
          <Text
            style={[
              styles.addToBagText,
              isAddedFeedback && styles.addToBagTextSuccess,
            ]}
          >
            {stock <= 0
              ? "Out of Stock"
              : isAddedFeedback
                ? `Added (${quantity})`
                : "Add to Bag"}
          </Text>
        </PressableScale>

        <PressableScale
          disabled={stock <= 0}
          onPress={handleBuyNow}
          targetScale={MotionTokens.scale.pressed}
          style={[styles.buyNowBtn, stock <= 0 && styles.btnDisabled]}
        >
          <Ionicons name="flash-outline" size={16} color={Colors.white} />
          <Text style={styles.buyNowText}>Buy Now</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  topHeader: {
    height: 44,
    backgroundColor: Colors.page,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  topHeaderTitle: {
    fontFamily: "Georgia",
    fontWeight: "bold",
    fontSize: 16,
    color: Colors.ink,
  },
  headerRightSpacer: {
    width: 32,
  },
  content: {
    paddingBottom: 110,
  },
  // Hero Image
  imageContainer: {
    width: "100%",
    aspectRatio: 1.08,
    backgroundColor: Colors.linen,
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
    backgroundColor: Colors.linen,
  },
  wishlistButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
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
  // Details Container
  detailsContainer: {
    padding: Spacing.md,
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
    marginTop: Spacing.sm,
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
  // Specs Grid
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
  // Overview
  descriptionSection: {
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.sm + 1,
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
  readMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  readMoreText: {
    fontSize: 12,
    color: Colors.terracotta,
    fontWeight: "700",
  },
  // Guarantee Banner
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
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: "700",
    color: Colors.forest,
  },
  guaranteeSub: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
    lineHeight: 15,
  },
  // Quantity
  quantitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
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
  stepperBtnDisabled: {
    opacity: 0.35,
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
  // Recommendations Section
  recommendationsSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  recHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  recTitle: {
    fontSize: Typography.fontSizes.md + 1,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  recSubtitle: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  seeAllText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.terracotta,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  recommendationsList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  recommendationCardWrapper: {
    width: 172,
    marginRight: Spacing.sm,
  },
  // Sticky Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.linen,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
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
  addToBagBtnSuccess: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forest,
  },
  addToBagTextSuccess: {
    color: Colors.white,
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
  // Floating Toast
  floatingToast: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.forestDark || "#12241B",
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 99,
  },
  toastLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs + 2,
    flex: 1,
    marginRight: Spacing.sm,
  },
  toastIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.forestLight,
    alignItems: "center",
    justifyContent: "center",
  },
  toastTitle: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: "bold",
    color: Colors.white,
  },
  toastSub: {
    fontSize: 10,
    color: Colors.botanical,
    marginTop: 1,
  },
  toastActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  toastActionText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
