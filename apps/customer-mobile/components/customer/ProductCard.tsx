import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { useWishlist } from "../../lib/contexts/WishlistContext";
import { useCart } from "../../lib/contexts/CartContext";

export interface ProductCardProps {
  id: string;
  name: string;
  pricePaise: number;
  nurseryId: string;
  nurseryName: string;
  imageUrl?: string;
  careLevel?: string;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  isOutOfStock?: boolean;
  isFreeDelivery?: boolean;
  discountPercent?: number;
}

export function ProductCard({
  id,
  name,
  pricePaise,
  nurseryId,
  nurseryName,
  imageUrl,
  careLevel,
  isVerified,
  rating,
  reviewCount = 0,
  isOutOfStock = false,
  isFreeDelivery = false,
  discountPercent,
}: ProductCardProps) {
  const router = useRouter();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const isLiked = isInWishlist(id);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/products/${id}` as any)}
      style={styles.container}
    >
      {/* Image Area */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="leaf-outline" size={36} color={Colors.sage} />
          </View>
        )}

        {/* Wishlist heart — glass style matching web */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            toggleWishlist({ productId: id, name, pricePaise, nurseryName, imageUrl })
          }
          style={styles.wishlistButton}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={14}
            color={isLiked ? "#DC2626" : Colors.inkLight}
          />
        </TouchableOpacity>

        {/* Badges — top-left, matching web priority logic */}
        <View style={styles.badges}>
          {isOutOfStock && (
            <View style={[styles.badge, styles.badgeGray]}>
              <Text style={styles.badgeText}>OUT OF STOCK</Text>
            </View>
          )}
          {!isOutOfStock && discountPercent && discountPercent > 0 && (
            <View style={[styles.badge, styles.badgeTerracotta]}>
              <Text style={styles.badgeText}>{discountPercent}% OFF</Text>
            </View>
          )}
          {!isOutOfStock && isFreeDelivery && (
            <View style={[styles.badge, styles.badgeForest]}>
              <Text style={styles.badgeText}>FREE DELIVERY</Text>
            </View>
          )}
        </View>
      </View>

      {/* Card Info */}
      <View style={styles.content}>
        {/* Seller line with verified badge — matches web */}
        <View style={styles.sellerRow}>
          <Text style={styles.nurseryName} numberOfLines={1}>
            {nurseryName}
          </Text>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={9} color={Colors.white} />
            </View>
          )}
        </View>

        {/* Product name */}
        <Text style={styles.productName} numberOfLines={1}>
          {name}
        </Text>

        {/* Rating pill — matches web's forest-800 green pill */}
        <View style={styles.ratingRow}>
          {reviewCount > 0 ? (
            <View style={[styles.ratingPill, { flexDirection: "row", alignItems: "center", gap: 2 }]}>
              <Text style={styles.ratingText}>
                {rating ? rating.toFixed(1) : "4.5"}
              </Text>
              <Ionicons name="star" size={9} color={Colors.white} />
            </View>
          ) : (
            <Text style={styles.newArrival}>New arrival</Text>
          )}
        </View>

        {/* Price + Add row — separated by border like web */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>{formatINR(pricePaise)}</Text>
            {isFreeDelivery && (
              <Text style={styles.freeDelivery}>Free delivery</Text>
            )}
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isOutOfStock}
            onPress={() =>
              addItem({ productId: id, nurseryId, nurseryName, name, pricePaise, imageUrl })
            }
            style={[styles.addButton, isOutOfStock && styles.addButtonDisabled]}
          >
            <Ionicons
              name="bag-handle-outline"
              size={13}
              color={isOutOfStock ? Colors.inkMuted : Colors.white}
            />
          </TouchableOpacity>
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
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
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
  // Wishlist — glass button matching web
  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  // Badges — top-left stack
  badges: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "column",
    gap: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeGray: { backgroundColor: "rgba(33,37,41,0.8)" },
  badgeTerracotta: { backgroundColor: Colors.terracotta },
  badgeForest: { backgroundColor: Colors.forest },
  badgeText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Card content
  content: {
    padding: Spacing.sm,
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  nurseryName: {
    fontSize: 10,
    color: Colors.inkMuted,
    fontWeight: "500",
    flex: 1,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.botanical,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: {
    fontSize: 8,
    fontWeight: "700",
    color: Colors.forestDark,
  },
  productName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600",
    color: Colors.ink,
    marginBottom: 6,
  },
  // Rating pill — forest-800 bg like web
  ratingRow: {
    marginBottom: 8,
    minHeight: 18,
    justifyContent: "center",
  },
  ratingPill: {
    alignSelf: "flex-start",
    backgroundColor: Colors.forest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  ratingText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "700",
  },
  newArrival: {
    fontSize: 10,
    color: Colors.inkSubtle,
    fontWeight: "500",
  },
  // Price + add row separated by border
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  price: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "700",
    color: Colors.ink,
  },
  freeDelivery: {
    fontSize: 9,
    fontWeight: "600",
    color: "#15803D",
    marginTop: 1,
  },
  // Terracotta round bag button — matches web
  addButton: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonDisabled: {
    backgroundColor: Colors.sand,
  },
});
