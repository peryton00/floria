import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { ModerationCard } from "../../components/admin/ModerationCard";
import { LoadingState } from "../../components/ui/LoadingState";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";

const FILTER_TABS = [
  { key: "all", label: "All Items" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft / Pending" },
  { key: "flagged", label: "Flagged" },
];

export default function CatalogModerationScreen() {
  const [activeTab, setActiveTab] = useState("all");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getAdminProducts({
        status: activeTab !== "all" ? activeTab : undefined,
      });

      if (res.success && res.data) {
        setProducts(res.data);
      } else {
        setError(res.error?.message || "Failed to load catalog products.");
      }
    } catch (err: any) {
      setError(
        err.message || "Failed to connect to catalog moderation gateway.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handlePublish = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await api.publishProduct(id);
      if (res.success) {
        Alert.alert(
          "Published",
          "Botanical specimen is now live on marketplace.",
        );
        await fetchProducts();
      } else {
        Alert.alert(
          "Publish Error",
          res.error?.message || "Could not publish specimen.",
        );
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Request failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleFlag = async (id: string) => {
    Alert.alert(
      "Flag Listing",
      "Flag this plant listing for quality or policy non-compliance?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Flag Specimen",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(id);
              const res = await api.updateAdminProductStatus(id, "flagged");
              if (res.success) {
                Alert.alert(
                  "Flagged",
                  "Listing has been flagged and suppressed from public view.",
                );
                await fetchProducts();
              } else {
                Alert.alert(
                  "Error",
                  res.error?.message || "Could not flag listing.",
                );
              }
            } catch (e: any) {
              Alert.alert("Error", e.message || "Request failed.");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsScroll}
          renderItem={({ item }) => {
            const isSelected = activeTab === item.key;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab(item.key)}
                style={[styles.tabChip, isSelected && styles.tabChipSelected]}
              >
                <Text
                  style={[styles.tabText, isSelected && styles.tabTextSelected]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <LoadingState message="Loading botanical catalog items..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No Products Found"
          message="Products submitted by nurseries will appear here for taxonomy and pricing review."
          actionLabel="Refresh List"
          onAction={fetchProducts}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.forest]}
            />
          }
          renderItem={({ item }) => (
            <ModerationCard
              id={item.id}
              name={item.name || "Botanical Specimen"}
              botanicalName={item.botanical_name}
              sellerName={item.seller_name || item.seller?.business_name}
              pricePaise={
                item.price_paise || item.inventory?.price_paise || 129900
              }
              status={item.status || "published"}
              processing={processingId === item.id}
              onPublish={() => handlePublish(item.id)}
              onFlag={() => handleFlag(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  tabBar: {
    backgroundColor: Colors.linen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.xs,
  },
  tabsScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  tabChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.sand,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabChipSelected: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forestDark,
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabTextSelected: {
    color: Colors.white,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
});
