import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing } from "../../lib/theme";
import { useWishlist } from "../../lib/contexts/WishlistContext";
import { ProductCard } from "../../components/customer/ProductCard";
import { EmptyState } from "../../components/ui/EmptyState";

export default function CustomerWishlistScreen() {
  const router = useRouter();
  const { wishlist } = useWishlist();

  if (wishlist.length === 0) {
    return (
      <EmptyState
        title="Your Wishlist is Empty"
        message="Save your favorite rare aroids, bonsai, and ficus specimens to revisit later."
        actionLabel="Explore Catalog"
        onAction={() => router.push("/(tabs)/explore" as any)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.productId}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ProductCard
              id={item.productId}
              name={item.name}
              pricePaise={item.pricePaise}
              nurseryId="nursery-1"
              nurseryName={item.nurseryName}
              imageUrl={item.imageUrl}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  list: {
    padding: Spacing.sm,
  },
  gridItem: {
    width: "50%",
  },
});
