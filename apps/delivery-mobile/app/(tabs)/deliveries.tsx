// Floria Delivery Mobile — Deliveries Queue Operational Workflow
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useDeliveries } from "../../lib/hooks/useDeliveries";
import { theme } from "../../lib/theme";
import { FloriaIcon } from "../../components/ui/FloriaIcon";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui";
import { DeliveryCard } from "../../components/delivery/DeliveryCard";
import type { DeliveryAssignment } from "@floria/types";

const FILTER_TABS = [
  { id: "all", label: "ALL" },
  { id: "assigned", label: "ASSIGNED" },
  { id: "in_transit", label: "IN TRANSIT" },
  { id: "delivered", label: "DELIVERED" },
] as const;

export default function DeliveriesScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { deliveries, loading, error, refresh } = useDeliveries();

  // Filter deliveries deterministically client-side from the authoritative response
  const filteredDeliveries = useMemo(() => {
    let result = [...deliveries];

    if (activeFilter === "assigned") {
      result = result.filter((d) => d.status === "assigned");
    } else if (activeFilter === "in_transit") {
      result = result.filter(
        (d) => d.status === "picked_up" || d.status === "out_for_delivery",
      );
    } else if (activeFilter === "delivered") {
      result = result.filter((d) => d.status === "delivered");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d) => {
        const orderId = (d.order_id || (d as any).orderId || "").toLowerCase();
        const city = (
          (d as any).dropoffAddress?.city ||
          (d as any).dropoff_address_snapshot?.city ||
          ""
        ).toLowerCase();
        const name = (
          (d as any).dropoffAddress?.fullName ||
          (d as any).dropoff_address_snapshot?.full_name ||
          ""
        ).toLowerCase();
        return orderId.includes(q) || city.includes(q) || name.includes(q);
      });
    }

    // Sort order: Active (out_for_delivery, picked_up, assigned) first, then delivered
    return result.sort((a, b) => {
      const score = (st: string) => {
        if (st === "out_for_delivery") return 4;
        if (st === "picked_up") return 3;
        if (st === "assigned") return 2;
        if (st === "delivered") return 1;
        return 0;
      };
      const diff = score(b.status) - score(a.status);
      if (diff !== 0) return diff;
      return (
        new Date(b.assigned_at || (b as any).assignedAt || 0).getTime() -
        new Date(a.assigned_at || (a as any).assignedAt || 0).getTime()
      );
    });
  }, [deliveries, activeFilter, searchQuery]);

  const renderItem = ({ item }: { item: DeliveryAssignment }) => {
    return (
      <DeliveryCard
        delivery={item}
        onPress={() => router.push(`/deliveries/${item.id}` as any)}
        isPriority={item.status === "out_for_delivery"}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchInputWrap}>
          <FloriaIcon name="search" size={16} color={theme.colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order #, city, customer..."
            placeholderTextColor={theme.colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FloriaIcon name="close" size={16} color={theme.colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Filter Tabs */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterScroll}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.id;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(item.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Filter deliveries by ${item.label}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main List Area */}
      {loading && deliveries.length === 0 ? (
        <LoadingState message="Loading delivery assignments..." />
      ) : error ? (
        <ErrorState
          title="Could Not Load Deliveries"
          message={error}
          onRetry={refresh}
        />
      ) : filteredDeliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title="No Deliveries Found"
            subtitle={
              searchQuery
                ? `No delivery assignments match "${searchQuery}".`
                : `There are no delivery assignments matching the "${activeFilter.replace(/_/g, " ").toUpperCase()}" filter.`
            }
            iconName="package"
            actionLabel="REFRESH MANIFEST"
            onAction={refresh}
          />
        </View>
      ) : (
        <FlatList
          data={filteredDeliveries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              colors={[theme.colors.forest]}
              tintColor={theme.colors.forest}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  searchBarWrapper: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.sand,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    paddingHorizontal: theme.spacing.md,
    height: 42,
    gap: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.charcoal,
  },
  filterBar: {
    backgroundColor: theme.colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    paddingVertical: theme.spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.sand,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  filterChipActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  filterText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    letterSpacing: 0.6,
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
});
