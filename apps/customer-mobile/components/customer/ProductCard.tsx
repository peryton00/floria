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
}

export function ProductCard({
  id,
  name,
  pricePaise,
  nurseryId,
  nurseryName,
  imageUrl,
  careLevel,
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

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            toggleWishlist({
              productId: id,
              name,
              pricePaise,
              nurseryName,
              imageUrl,
            })
          }
          style={styles.wishlistButton}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={18}
            color={isLiked ? Colors.terracotta : Colors.inkLight}
          />
        </TouchableOpacity>

        {careLevel && (
          <View style={styles.careBadge}>
            <Text style={styles.careBadgeText}>{careLevel}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.nurseryName} numberOfLines={1}>
          {nurseryName}
        </Text>
        <Text style={styles.productName} numberOfLines={2}>
          {name}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatINR(pricePaise)}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              addItem({
                productId: id,
                nurseryId,
                nurseryName,
                name,
                pricePaise,
                imageUrl,
              })
            }
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ ADD</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: Spacing.md,
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  imageContainer: {
    width: "100%",
    height: 140,
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
    fontSize: 40,
  },
  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  wishlistIcon: {
    fontSize: 16,
    color: Colors.inkLight,
  },
  wishlistIconActive: {
    color: Colors.terracotta,
  },
  careBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: Colors.forest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  careBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  content: {
    padding: Spacing.sm,
  },
  nurseryName: {
    fontSize: 10,
    color: Colors.sage,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
    minHeight: 36,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  price: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.forest,
  },
  addButton: {
    backgroundColor: Colors.forest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
