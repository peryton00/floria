import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";

export interface NurseryCardProps {
  id: string;
  name: string;
  city?: string;
  story?: string;
  rating?: number;
  plantCount?: number;
}

export function NurseryCard({
  id,
  name,
  city = "Bangalore",
  story,
  rating = 4.8,
  plantCount = 24,
}: NurseryCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/nurseries/${id}` as any)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-sharp"
              size={12}
              color={Colors.inkMuted}
              style={{ marginRight: 2 }}
            />
            <Text style={styles.location}>{city}</Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons
            name="star"
            size={11}
            color={Colors.forest}
            style={{ marginRight: 2 }}
          />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      </View>

      {story ? (
        <Text style={styles.story} numberOfLines={2}>
          {story}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.plantCount}>
          {plantCount} Botanical Specimens Available
        </Text>
        <Text style={styles.viewLink}>View Nursery →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  avatarText: {
    color: Colors.white,
    fontWeight: "bold",
    fontSize: Typography.fontSizes.md,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.ink,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  location: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.sand,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.forest,
  },
  story: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
    marginVertical: Spacing.xs,
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.xs,
  },
  plantCount: {
    fontSize: 11,
    color: Colors.sage,
    fontWeight: "600",
  },
  viewLink: {
    fontSize: 11,
    color: Colors.terracotta,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
