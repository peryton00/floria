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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloriaIcon } from "@floria/icons";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { rupeesToPaise } from "../../lib/format";
import { Button } from "../../components/ui/Button";
import {
  SellerPendingVerificationShield,
  MobileProductImageUploader,
  MobileProductImage,
} from "../../components/seller";

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

  // Form State
  const [name, setName] = useState<string>("");
  const [priceRupees, setPriceRupees] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("5");
  const [status, setStatus] = useState<"active" | "draft" | "inactive">("active");
  const [notes, setNotes] = useState<string>("");
  const [images, setImages] = useState<MobileProductImage[]>([]);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getSellerProductById(id);
      if (res.success && res.data) {
        const p = res.data;
        setProduct(p);
        setName(p.name || "");
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

        // Map existing images
        if (Array.isArray(p.images) && p.images.length > 0) {
          setImages(
            p.images.map((img: any, idx: number) => ({
              id: img.id,
              assetId: img.asset_id || img.assetId,
              url: img.url,
              isPrimary: img.is_primary ?? idx === 0,
              status: "READY",
            })),
          );
        } else if (p.image_url || p.primary_image_url) {
          setImages([
            {
              url: p.primary_image_url || p.image_url,
              isPrimary: true,
              status: "READY",
            },
          ]);
        }
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

  if (!isApproved) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FloriaIcon name="arrow_left" size={20} color={Colors.forest} />
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

    // Check if any image is still uploading or processing
    const isImageInProgress = images.some(
      (img) => img.status === "UPLOADING" || img.status === "PROCESSING",
    );
    if (isImageInProgress) {
      showError("Please wait until photos finish processing through image engine.");
      return;
    }

    try {
      setSaving(true);
      const cleanImages = images
        .filter((img) => img.status !== "FAILED")
        .map((img) => ({
          asset_id: img.assetId || undefined,
          url: img.url,
          is_primary: img.isPrimary,
        }));

      const primaryUrl =
        cleanImages.find((img) => img.is_primary)?.url ||
        cleanImages[0]?.url ||
        product?.image_url;

      const updates: any = {
        name: name.trim() || undefined,
        price_paise: rupeesToPaise(priceNum),
        stock_quantity: stockNum,
        low_stock_threshold: threshNum,
        status,
        description: notes.trim() || undefined,
        images: cleanImages,
        image_url: primaryUrl,
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
        <FloriaIcon name="warning" size={48} color={Colors.inkMuted} />
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Specimen Header Card */}
        <View style={styles.specimenCard}>
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

        {/* ── Section: Device Photo Gallery with Image Engine ── */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.formHeader}>Plant Photos ({images.length})</Text>
            <Text style={styles.imageEngineTag}>Floria Image Engine</Text>
          </View>
          <Text style={styles.photoHelperText}>
            Capture photos directly with camera or select from device gallery.
          </Text>

          <MobileProductImageUploader
            images={images}
            onChange={setImages}
            maxImages={5}
          />
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
            <Text style={styles.inputLabel}>Nursery Specific Notes & Care</Text>
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
          <FloriaIcon name="delete" size={18} color={Colors.error} />
          <Text style={styles.deleteButtonText}>Remove from Nursery Catalog</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Fixed Bottom Save Bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label={saving ? "Saving Changes..." : "Save Changes"}
          onPress={handleSave}
          loading={saving}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: Colors.page,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.linen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.page,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pageTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.forest,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  specimenCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  specimenInfo: {
    gap: 4,
  },
  specimenName: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  botanicalName: {
    fontSize: Typography.fontSizes.xs,
    fontStyle: "italic",
    color: Colors.inkMuted,
  },
  categoryName: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.forest,
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
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  formHeader: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  imageEngineTag: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.forest,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoHelperText: {
    fontSize: 11,
    color: Colors.inkMuted,
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.ink,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.page,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  statusToggleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.page,
  },
  statusToggleBtnActive: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forest,
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
    gap: Spacing.xs,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    marginTop: Spacing.sm,
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
  loadingText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
    marginTop: Spacing.md,
  },
  notFoundText: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    color: Colors.ink,
    marginTop: Spacing.md,
  },
});
