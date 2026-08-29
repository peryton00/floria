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
  city = "Raipur",
  story,
  rating = 4.9,
  plantCount = 18,
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
          <Text style={styles.avatarText}>
            {(name || "G").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-sharp"
              size={11}
              color={Colors.forest}
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
            style={{ marginRight: 3 }}
          />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
      </View>

      {story ? (
        <Text style={styles.story} numberOfLines={2}>
          {story}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.plantCount}>
          {plantCount} Cultivated Specimens
        </Text>
        <View style={styles.viewLinkRow}>
          <Text style={styles.viewLink}>Explore Collection</Text>
          <Ionicons name="chevron-forward" size={11} color={Colors.terracotta} />
        </View>
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
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  avatarText: {
    color: Colors.white,
    fontWeight: "bold",
    fontSize: Typography.fontSizes.sm,
    fontFamily: "Georgia",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSizes.sm + 1,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  location: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.botanical,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontSize: 10.5,
    color: Colors.forest,
    fontWeight: "600",
  },
  viewLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewLink: {
    fontSize: 10.5,
    color: Colors.terracotta,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
