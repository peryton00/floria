import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "../../lib/theme";
import { StorageService, RecentlyViewedItem } from "../../lib/storage";
import { ProductCard } from "./ProductCard";

export interface RecentlyViewedSectionProps {
  excludeId?: string;
  title?: string;
}

export function RecentlyViewedSection({
  excludeId,
  title = "Recently Viewed",
}: RecentlyViewedSectionProps) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    StorageService.getRecentlyViewed().then((list) => {
      const filtered = excludeId
        ? list.filter((item) => item.id !== excludeId)
        : list;
      setItems(filtered);
    });
  }, [excludeId]);

  if (items.length < 2) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Specimens you explored recently</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {items.map((item) => (
          <View key={item.id} style={styles.cardWrapper}>
            <ProductCard
              id={item.id}
              name={item.name}
              pricePaise={item.pricePaise}
              imageUrl={item.imageUrl}
              careLevel={item.careLevel}
              isOutOfStock={item.isOutOfStock}
              rating={item.rating}
              reviewCount={item.reviewCount}
              isFreeDelivery={item.isFreeDelivery}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  header: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs + 2,
  },
  title: {
    fontSize: Typography.fontSizes.md + 1,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 1,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  cardWrapper: {
    width: 172,
    marginRight: Spacing.sm,
  },
});
