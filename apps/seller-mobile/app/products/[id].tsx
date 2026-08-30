import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { rupeesToPaise } from "../../lib/format";
import { Button } from "../../components/ui/Button";
import { SellerPendingVerificationShield } from "../../components/seller";

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller } = useSellerAuth();
  const { showSuccess, showError, confirmAction } = useSellerFeedback();

  const isApproved = seller?.status === "approved" || seller?.status === "active";

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [product, setProduct] = useState<any>(null);

  if (!isApproved) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Colors.forest} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Edit Plant Listing</Text>
        </View>
        <SellerPendingVerificationShield
          seller={seller}
          featureName="Edit Plant Listing"
        />
      </View>
    );
  }

  // Form State
  const [priceRupees, setPriceRupees] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("5");
  const [status, setStatus] = useState<"active" | "draft" | "inactive">("active");
  const [notes, setNotes] = useState<string>("");

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getSellerProductById(id);
      if (res.success && res.data) {
        const p = res.data;
        setProduct(p);
        const price =
          p.price_paise ??
          p.inventory?.[0]?.price_paise ??
          p.inventory?.price_paise ??
          0;
        const stock =
          p.stock_quantity ??
          p.inventory?.[0]?.stock_quantity ??
          p.inventory?.stock_quantity ??
          0;
        const thresh =
          p.low_stock_threshold ??
          p.inventory?.[0]?.low_stock_threshold ??
          p.inventory?.low_stock_threshold ??
          5;

        setPriceRupees(String(Math.round(price / 100)));
        setStockQuantity(String(stock));
        setLowStockThreshold(String(thresh));
        setStatus(p.status || "active");
        setNotes(p.description || "");
      }
    } catch (err) {
      console.warn("[EditProduct] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct, seller?.id]);

  const handleSave = async () => {
    if (!id) return;
    const priceNum = parseFloat(priceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      showError("Please enter a valid price in ₹.");
      return;
    }
    const stockNum = parseInt(stockQuantity, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      showError("Please enter a valid stock count.");
      return;
    }
    const threshNum = parseInt(lowStockThreshold, 10) || 5;

    try {
      setSaving(true);
      const updates = {
        price_paise: rupeesToPaise(priceNum),
        stock_quantity: stockNum,
        low_stock_threshold: threshNum,
        status,
        description: notes.trim() || undefined,
      };

      const res = await api.updateSellerProduct(id, updates);
      if (res.success) {
        showSuccess("Plant listing updated successfully!");
        router.back();
      } else {
        showError(res.error?.message || "Failed to update plant listing.");
      }
    } catch (err: any) {
      showError(err.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListing = () => {
    confirmAction({
      title: "Remove Botanical Listing",
      message: `Are you sure you want to remove "${product?.name}" from your nursery? This will mark the listing inactive.`,
      confirmText: "Remove Listing",
      isDestructive: true,
      onConfirm: async () => {
        if (!id) return;
        try {
          const res = await api.deleteSellerProduct(id);
          if (res.success) {
            showSuccess("Plant removed from nursery catalog.");
            router.replace("/(tabs)/products" as any);
          } else {
            showError(res.error?.message || "Failed to delete product.");
          }
        } catch (err: any) {
          showError(err.message || "Failed to delete product.");
        }
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.centerScreen, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.forest} />
        <Text style={styles.loadingText}>Loading plant details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.centerScreen, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.inkMuted} />
        <Text style={styles.notFoundText}>Product not found</Text>
        <Button
          label="Back to Products"
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: Spacing.md }}
        />
      </View>
    );
  }

  const imageUrl =
    product.primary_image_url ||
    product.image_url ||
    product.images?.[0]?.url ||
    "/floria-logo.png";

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* ── Canonical Specimen Header Card ── */}
        <View style={styles.specimenCard}>
          <Image
            source={{
              uri: imageUrl.startsWith("http")
                ? imageUrl
                : "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=200",
            }}
            style={styles.specimenImage}
          />
          <View style={styles.specimenInfo}>
            <Text style={styles.specimenName}>{product.name}</Text>
            {product.botanical_name && (
              <Text style={styles.botanicalName}>{product.botanical_name}</Text>
            )}
            <Text style={styles.categoryName}>
              {product.category?.name || "Botanical Specimen"}
            </Text>
          </View>
        </View>

        {/* ── Form Card: Seller Editable Listing Data ── */}
        <View style={styles.formCard}>
          <Text style={styles.formHeader}>Seller Pricing & Inventory</Text>

          {/* Selling Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
            <TextInput
              value={priceRupees}
              onChangeText={setPriceRupees}
              keyboardType="numeric"
              placeholder="499"
              placeholderTextColor={Colors.inkSubtle}
              style={styles.textInput}
            />
          </View>

          {/* Stock Quantity */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Stock Quantity *</Text>
            <TextInput
              value={stockQuantity}
              onChangeText={setStockQuantity}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor={Colors.inkSubtle}
              style={styles.textInput}
            />
          </View>

          {/* Low Stock Alert Threshold */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Low Stock Alert Threshold</Text>
            <TextInput
              value={lowStockThreshold}
              onChangeText={setLowStockThreshold}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor={Colors.inkSubtle}
              style={styles.textInput}
            />
          </View>

          {/* Listing Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Listing Status</Text>
            <View style={styles.statusToggleRow}>
              {(["active", "draft", "inactive"] as const).map((st) => {
                const isActive = status === st;
                const label =
                  st === "active" ? "Active" : st === "draft" ? "Draft" : "Inactive";
                return (
                  <TouchableOpacity
                    key={st}
                    activeOpacity={0.8}
                    onPress={() => setStatus(st)}
                    style={[
                      styles.statusToggleBtn,
                      isActive && styles.statusToggleBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        isActive && styles.statusToggleTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Nursery Specific Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nursery Specific Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add nursery specific notes..."
              placeholderTextColor={Colors.inkSubtle}
              multiline
              numberOfLines={3}
              style={[styles.textInput, { height: 75, textAlignVertical: "top" }]}
            />
          </View>
        </View>

        {/* ── Remove Listing Button ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleDeleteListing}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
          <Text style={styles.deleteButtonText}>Remove from Nursery Catalog</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Fixed Bottom Save Bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label="Save Changes"
          variant="primary"
          size="lg"
          loading={saving}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.page,
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
    marginTop: Spacing.sm,
  },
  notFoundText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.ink,
    marginTop: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  specimenCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  specimenImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.sand,
    marginRight: Spacing.md,
  },
  specimenInfo: {
    flex: 1,
  },
  specimenName: {
    fontSize: Typography.fontSizes.md,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.ink,
  },
  botanicalName: {
    fontSize: 11,
    fontStyle: "italic",
    color: Colors.inkMuted,
    marginTop: 2,
  },
  categoryName: {
    fontSize: 10,
    color: Colors.sage,
    fontWeight: "600",
    marginTop: 2,
  },
  formCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  formHeader: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.page,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    height: 44,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  statusToggleRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: 4,
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.page,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusToggleBtnActive: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forestDark,
  },
  statusToggleText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
  statusToggleTextActive: {
    color: Colors.white,
    fontWeight: "700",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.errorBg,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.error,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.linen,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.page,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  pageTitle: {
    fontSize: Typography.fontSizes.lg,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.forest,
  },
});
