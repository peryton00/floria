import React, { useState, useRef } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { useWishlist } from "../../lib/contexts/WishlistContext";
import { useCart } from "../../lib/contexts/CartContext";
import { FloriaSkeleton } from "../ui/FloriaSkeleton";
import { haptics } from "../../lib/haptics";
import { MotionTokens, useReducedMotion } from "../../lib/motion";
import { PressableScale } from "../ui/PressableScale";

export interface ProductCardProps {
  id: string;
  name: string;
  pricePaise: number;
  nurseryId?: string;
  nurseryName?: string;
  imageUrl?: string;
  isOrganic?: boolean;
  isRare?: boolean;
  isOutOfStock?: boolean;
  careLevel?: string;
  rating?: number;
  reviewCount?: number;
  isFreeDelivery?: boolean;
  discountPercent?: number;
}

export function ProductCard({
  id,
  name,
  pricePaise,
  nurseryId = "nursery-1",
  nurseryName = "Floria Certified Grower",
  imageUrl,
  isOrganic,
  isRare,
  isOutOfStock = false,
  careLevel,
  rating = 4.8,
  reviewCount = 24,
  isFreeDelivery = true,
  discountPercent,
}: ProductCardProps) {
  const router = useRouter();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const isLiked = isInWishlist(id);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isRecentlyAdded, setIsRecentlyAdded] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (!reducedMotion) {
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: MotionTokens.duration.short,
        easing: MotionTokens.easing.easeOut,
        useNativeDriver: true,
      }).start();
    } else {
      imageOpacity.setValue(1);
    }
  };

  const handleHeartPress = () => {
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
      productId: id,
      name,
      pricePaise,
      nurseryName,
      imageUrl,
    });
  };

  const handleAddPress = () => {
    addItem({
      productId: id,
      nurseryId,
      nurseryName,
      name,
      pricePaise,
      imageUrl,
    });
    setIsRecentlyAdded(true);
    setTimeout(() => {
      setIsRecentlyAdded(false);
    }, 2000);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => router.push(`/products/${id}` as any)}
      style={styles.container}
    >
      {/* 1. Product Image Area */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <>
            <Animated.Image
              source={{ uri: imageUrl }}
              style={[styles.image, { opacity: imageOpacity }]}
              resizeMode="cover"
              onLoadEnd={handleImageLoad}
            />
            {!imageLoaded && (
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
            <Ionicons name="leaf-outline" size={32} color={Colors.sage} />
          </View>
        )}

        {/* Wishlist floating heart button — Top-Right corner with micro-interaction */}
        <TouchableOpacity
          activeOpacity={0.75}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={handleHeartPress}
          style={styles.wishlistButton}
        >
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={16}
              color={isLiked ? Colors.terracotta : Colors.inkLight}
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Badges — Top-Left corner */}
        {(isOutOfStock || (discountPercent && discountPercent > 0)) ? (
          <View style={styles.badgeContainer}>
            {isOutOfStock ? (
              <View style={[styles.badge, styles.badgeDark]}>
                <Text style={styles.badgeText}>Out of stock</Text>
              </View>
            ) : discountPercent && discountPercent > 0 ? (
              <View style={[styles.badge, styles.badgeTerracotta]}>
                <Text style={styles.badgeText}>{discountPercent}% OFF</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* 2. Product Information Area */}
      <View style={styles.content}>
        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {name}
        </Text>

        {/* Contextual Status / Metadata (Rating or Care level or New arrival) */}
        <View style={styles.metaRow}>
          {reviewCount > 0 ? (
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={10} color={Colors.terracotta} style={{ marginRight: 2 }} />
              <Text style={styles.ratingText}>{rating ? rating.toFixed(1) : "4.8"}</Text>
              <Text style={styles.reviewCountText}>({reviewCount})</Text>
            </View>
          ) : careLevel ? (
            <Text style={styles.careLevelText} numberOfLines={1}>
              {careLevel.toUpperCase()} CARE
            </Text>
          ) : (
            <Text style={styles.newArrivalText}>New arrival</Text>
          )}
        </View>

        {/* Price & Add-to-Cart Action */}
        <View style={styles.footer}>
          <View style={styles.priceColumn}>
            <Text style={styles.price}>{formatINR(pricePaise)}</Text>
            {isFreeDelivery && !isOutOfStock && (
              <Text style={styles.freeDelivery}>Free delivery</Text>
            )}
          </View>

          <PressableScale
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isOutOfStock}
            onPress={handleAddPress}
            targetScale={MotionTokens.scale.pressedCompact}
            style={[
              styles.addButton,
              isRecentlyAdded && styles.addButtonSuccess,
              isOutOfStock && styles.addButtonDisabled,
            ]}
          >
            <Ionicons
              name={isRecentlyAdded ? "checkmark" : "bag-handle-outline"}
              size={isRecentlyAdded ? 16 : 15}
              color={isOutOfStock ? Colors.inkMuted : Colors.white}
            />
          </PressableScale>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.md,
    flex: 1,
    marginHorizontal: Spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1.05,
    backgroundColor: Colors.linen,
    position: "relative",
    overflow: "hidden",
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.linen,
  },
  // Floating Wishlist Heart Button in Top-Right
  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 2,
  },
  // Badges in Top-Left
  badgeContainer: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "column",
    gap: 3,
    zIndex: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeDark: {
    backgroundColor: "rgba(18, 43, 37, 0.85)",
  },
  badgeTerracotta: {
    backgroundColor: Colors.terracotta,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  // Content Area
  content: {
    padding: Spacing.sm,
    flexDirection: "column",
    justifyContent: "space-between",
    flex: 1,
  },
  productName: {
    fontFamily: "Georgia",
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.ink,
    lineHeight: 18,
    minHeight: 36,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 16,
    marginBottom: 6,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.ink,
  },
  reviewCountText: {
    fontSize: 9,
    color: Colors.inkMuted,
    marginLeft: 2,
  },
  careLevelText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.forest,
    letterSpacing: 0.4,
  },
  newArrivalText: {
    fontSize: 10,
    color: Colors.inkMuted,
    fontWeight: "500",
  },
  // Footer: Price and Add Action
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  priceColumn: {
    justifyContent: "center",
  },
  price: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "700",
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  freeDelivery: {
    fontSize: 8.5,
    fontWeight: "600",
    color: "#15803D",
    marginTop: 1,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonDisabled: {
    backgroundColor: Colors.sand,
  },
  addButtonSuccess: {
    backgroundColor: Colors.forest,
  },
});
