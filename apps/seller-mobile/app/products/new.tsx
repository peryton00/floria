import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { Button } from "../../components/ui/Button";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import {
  SellerPendingVerificationShield,
  MobileProductImageUploader,
  MobileProductImage,
} from "../../components/seller";

export default function AddPlantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller } = useSellerAuth();
  const { showSuccess, showError } = useSellerFeedback();

  const rawStatus = String(seller?.status || (seller as any)?.sellerStatus || "").toLowerCase();
  const isApproved = rawStatus === "approved" || rawStatus === "active";

  // Tab Mode: 'CUSTOM' (Create new plant product) vs 'CATALOG' (Quick-add from catalog)
  const [creationMode, setCreationMode] = useState<"CUSTOM" | "CATALOG">("CUSTOM");

  // Catalog Categories
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Custom Product Form State
  const [productName, setProductName] = useState<string>("");
  const [botanicalName, setBotanicalName] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [priceRupees, setPriceRupees] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("10");
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("5");
  const [description, setDescription] = useState<string>("");
  const [careInstructions, setCareInstructions] = useState<string>("");
  const [status, setStatus] = useState<"active" | "draft">("active");

  // Images uploaded from device via Floria Image Engine
  const [images, setImages] = useState<MobileProductImage[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Quick-Add Catalog Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [catalogResults, setCatalogResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<any | null>(null);

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.getCategories();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
          setSelectedCategoryId(res.data[0].id);
        }
      } catch (e) {
        console.warn("[AddPlant] Categories load error:", e);
      }
    }
    loadCategories();
  }, []);

  // Quick-add search
  const searchCatalog = useCallback(async (query: string) => {
    try {
      setSearchLoading(true);
      const res = await api.getProducts({
        search: query.trim() || undefined,
        limit: 20,
      });
      if (res.success && Array.isArray(res.data)) {
        setCatalogResults(res.data);
      } else {
        setCatalogResults([]);
      }
    } catch (err) {
      console.warn("[AddPlant] Search error:", err);
      setCatalogResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (creationMode === "CATALOG") {
      searchCatalog(searchQuery);
    }
  }, [searchQuery, creationMode, searchCatalog]);

  if (!isApproved) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Colors.forest} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Add Plant Product</Text>
        </View>
        <SellerPendingVerificationShield
          seller={seller}
          featureName="Add Plant Listing"
        />
      </View>
    );
  }

  // Submit custom product
  const handlePublishCustomProduct = async () => {
    if (!productName.trim()) {
      Alert.alert("Missing Name", "Please enter a product name for the plant.");
      return;
    }
    const priceNum = parseFloat(priceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Invalid Price", "Please specify a valid positive selling price in ₹.");
      return;
    }
    const stockNum = parseInt(stockQuantity, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      Alert.alert("Invalid Stock", "Please enter a valid stock quantity.");
      return;
    }

    // Check if any image is still uploading or processing
    const isImageInProgress = images.some(
      (img) => img.status === "UPLOADING" || img.status === "PROCESSING",
    );
    if (isImageInProgress) {
      Alert.alert(
        "Image Processing",
        "Please wait until your device photos finish processing through the image engine.",
      );
      return;
    }

    try {
      setSubmitting(true);
      const cleanImages = images
        .filter((img) => img.status !== "FAILED" && Boolean(img.url))
        .map((img) => ({
          asset_id:
            img.assetId && img.assetId.trim().length > 10
              ? img.assetId.trim()
              : undefined,
          url: img.url,
          is_primary: Boolean(img.isPrimary),
        }));

      const primaryUrl =
        cleanImages.find((img) => img.is_primary)?.url ||
        cleanImages[0]?.url ||
        "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80";

      const payload = {
        name: productName.trim(),
        botanical_name: botanicalName.trim() || undefined,
        category_id: selectedCategoryId || (categories.length > 0 ? categories[0].id : undefined),
        price_paise: Math.round(priceNum * 100),
        stock_quantity: stockNum,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        sku: sku.trim() || undefined,
        description: description.trim() || undefined,
        care_instructions: careInstructions.trim() || undefined,
        status,
        images: cleanImages,
        image_url: primaryUrl,
      };

      const res = await api.createSellerProduct(payload);
      if (res.success) {
        showSuccess(`"${productName.trim()}" published to nursery catalog.`);
        router.back();
      } else {
        console.warn("[AddPlant] Publication failed:", res.error);
        const msg = res.error?.message || "Failed to publish plant product.";
        showError(msg);
        Alert.alert("Publication Error", msg);
      }
    } catch (err: any) {
      console.warn("[AddPlant] Unexpected submit error:", err);
      const msg = err.message || "Failed to submit product.";
      showError(msg);
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick-Add from catalog selection
  const handleSelectCatalogItem = (prod: any) => {
    setSelectedCatalogProduct(prod);
    const existingPrice =
      prod.price_paise ||
      prod.inventory?.[0]?.price_paise ||
      prod.inventory?.price_paise ||
      (prod.price ? prod.price * 100 : 49900);

    setPriceRupees((existingPrice / 100).toFixed(0));
    setStockQuantity("10");
  };

  const handlePublishCatalogListing = async () => {
    if (!selectedCatalogProduct) return;
    const priceNum = parseFloat(priceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Invalid Price", "Please specify a valid price.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createSellerProduct({
        product_id: selectedCatalogProduct.id,
        name: selectedCatalogProduct.name,
        category_id: selectedCatalogProduct.category_id || selectedCatalogProduct.category?.id,
        price_paise: Math.round(priceNum * 100),
        stock_quantity: parseInt(stockQuantity, 10) || 10,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        status,
        image_url: selectedCatalogProduct.image_url || selectedCatalogProduct.images?.[0]?.url,
      });

      if (res.success) {
        showSuccess(`"${selectedCatalogProduct.name}" added to inventory.`);
        router.back();
      } else {
        const msg = res.error?.message || "Failed to list plant.";
        showError(msg);
        Alert.alert("Listing Error", msg);
      }
    } catch (err: any) {
      const msg = err.message || "Failed to add plant.";
      showError(msg);
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedPayoutPaise = priceRupees ? Math.round(parseFloat(priceRupees) * 100 * 0.9) : 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      {/* Top Header */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.forest} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Add Plant Product</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Mode Switcher Tabs */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          onPress={() => setCreationMode("CUSTOM")}
          style={[styles.tabBtn, creationMode === "CUSTOM" && styles.tabBtnActive]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="sparkles"
            size={16}
            color={creationMode === "CUSTOM" ? Colors.white : Colors.inkMuted}
          />
          <Text
            style={[
              styles.tabBtnText,
              creationMode === "CUSTOM" && styles.tabBtnTextActive,
            ]}
          >
            Create New Product
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCreationMode("CATALOG")}
          style={[styles.tabBtn, creationMode === "CATALOG" && styles.tabBtnActive]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="library-outline"
            size={16}
            color={creationMode === "CATALOG" ? Colors.white : Colors.inkMuted}
          />
          <Text
            style={[
              styles.tabBtnText,
              creationMode === "CATALOG" && styles.tabBtnTextActive,
            ]}
          >
            Quick-Add Catalog
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Mode 1: Create New Plant Product Form ── */}
      {creationMode === "CUSTOM" && (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Basic Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Plant Identification</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Product / Plant Name *</Text>
              <TextInput
                style={styles.input}
                value={productName}
                onChangeText={setProductName}
                placeholder="e.g. Philodendron Pink Princess"
                placeholderTextColor={Colors.inkSubtle}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Botanical / Scientific Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={botanicalName}
                onChangeText={setBotanicalName}
                placeholder="e.g. Philodendron erubescens"
                placeholderTextColor={Colors.inkSubtle}
              />
            </View>

            {/* Categories Selector */}
            <View style={styles.field}>
              <Text style={styles.label}>Botanical Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategoryId(cat.id)}
                      style={[styles.catChip, isSelected && styles.catChipActive]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          isSelected && styles.catChipTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>SKU / Batch Code (Optional)</Text>
              <TextInput
                style={styles.input}
                value={sku}
                onChangeText={setSku}
                placeholder="FLR-PLT-001"
                placeholderTextColor={Colors.inkSubtle}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Section 2: Botanical Photography (From Device via Image Engine) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Plant Photos ({images.length})</Text>
              <Text style={styles.imageEngineTag}>Floria Image Engine</Text>
            </View>
            <Text style={styles.photoHelperText}>
              Upload pictures directly from your device camera or photo gallery. Photos are automatically transcoded to high-speed WebP.
            </Text>

            <MobileProductImageUploader
              images={images}
              onChange={setImages}
              maxImages={5}
            />
          </View>

          {/* Section 3: Pricing & Inventory */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Pricing & Stock Quantity</Text>

            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Selling Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={priceRupees}
                  onChangeText={setPriceRupees}
                  placeholder="499"
                  placeholderTextColor={Colors.inkSubtle}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Stock Units *</Text>
                <TextInput
                  style={styles.input}
                  value={stockQuantity}
                  onChangeText={setStockQuantity}
                  placeholder="10"
                  placeholderTextColor={Colors.inkSubtle}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Payout Estimator Banner */}
            {parseFloat(priceRupees) > 0 && (
              <View style={styles.payoutCard}>
                <Ionicons name="cash-outline" size={18} color={Colors.forest} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.payoutLabel}>Est. Net Nursery Payout</Text>
                  <Text style={styles.payoutValue}>{formatINR(estimatedPayoutPaise)} per specimen</Text>
                </View>
              </View>
            )}

            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Low Stock Alert</Text>
                <TextInput
                  style={styles.input}
                  value={lowStockThreshold}
                  onChangeText={setLowStockThreshold}
                  placeholder="5"
                  placeholderTextColor={Colors.inkSubtle}
                  keyboardType="number-pad"
                />
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Listing Status</Text>
                <View style={styles.statusToggleRow}>
                  <TouchableOpacity
                    onPress={() => setStatus("active")}
                    style={[
                      styles.statusToggleBtn,
                      status === "active" && styles.statusToggleBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        status === "active" && styles.statusToggleTextActive,
                      ]}
                    >
                      Active
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setStatus("draft")}
                    style={[
                      styles.statusToggleBtn,
                      status === "draft" && styles.statusToggleBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        status === "draft" && styles.statusToggleTextActive,
                      ]}
                    >
                      Draft
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Section 4: Care & Descriptions */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Plant Care & Descriptions</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Plant Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Healthy foliage plant, acclimated for indoor apartments and bright shaded patios..."
                placeholderTextColor={Colors.inkSubtle}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Care & Watering Guidelines</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={careInstructions}
                onChangeText={setCareInstructions}
                placeholder="Water when top 2 inches of soil feel dry. Prefers bright indirect light. Avoid direct harsh sun."
                placeholderTextColor={Colors.inkSubtle}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Publish Action Button */}
          <Button
            label={submitting ? "Publishing Plant..." : "Publish Plant to Marketplace"}
            onPress={handlePublishCustomProduct}
            loading={submitting}
            style={styles.publishBtn}
          />
        </ScrollView>
      )}

      {/* ── Mode 2: Quick-Add from Master Catalog ── */}
      {creationMode === "CATALOG" && (
        <View style={{ flex: 1 }}>
          {selectedCatalogProduct ? (
            /* Selected Catalog Item Configuration */
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.selectedProductCard}>
                <Image
                  source={{
                    uri:
                      selectedCatalogProduct.image_url ||
                      selectedCatalogProduct.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600",
                  }}
                  style={styles.selectedProductImage}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedProductTitle}>{selectedCatalogProduct.name}</Text>
                  <Text style={styles.selectedProductCat}>
                    {selectedCatalogProduct.category?.name || "Botanical Species"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedCatalogProduct(null)}
                    style={{ marginTop: 6 }}
                  >
                    <Text style={styles.changeSelectionText}>Change Selected Plant</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>Your Nursery Pricing & Stock</Text>
                <View style={styles.rowFields}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>Selling Price (₹) *</Text>
                    <TextInput
                      style={styles.input}
                      value={priceRupees}
                      onChangeText={setPriceRupees}
                      placeholder="499"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>Stock Quantity *</Text>
                    <TextInput
                      style={styles.input}
                      value={stockQuantity}
                      onChangeText={setStockQuantity}
                      placeholder="10"
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </View>

              <Button
                label={submitting ? "Listing Plant..." : "Add to Nursery Inventory"}
                onPress={handlePublishCatalogListing}
                loading={submitting}
                style={styles.publishBtn}
              />
            </ScrollView>
          ) : (
            /* Catalog Search Screen */
            <View style={{ flex: 1, padding: Spacing.md }}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color={Colors.inkMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search botanical species or plant name..."
                  placeholderTextColor={Colors.inkSubtle}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={18} color={Colors.inkMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {searchLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.forest} />
                </View>
              ) : (
                <FlatList
                  data={catalogResults}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleSelectCatalogItem(item)}
                      style={styles.catalogItemRow}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{
                          uri:
                            item.image_url ||
                            item.images?.[0]?.url ||
                            "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600",
                        }}
                        style={styles.catalogItemThumb}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.catalogItemName}>{item.name}</Text>
                        <Text style={styles.catalogItemCat}>
                          {item.category?.name || "Botanical Specimen"}
                        </Text>
                      </View>
                      <Ionicons name="add-circle" size={24} color={Colors.forest} />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={{ padding: Spacing.xl, alignItems: "center" }}>
                      <Text style={{ color: Colors.inkMuted, fontSize: Typography.fontSizes.sm }}>
                        No catalog templates matching "{searchQuery}".
                      </Text>
                      <TouchableOpacity
                        onPress={() => setCreationMode("CUSTOM")}
                        style={{ marginTop: 12 }}
                      >
                        <Text style={{ color: Colors.forest, fontWeight: "bold" }}>
                          + Create Custom Plant Instead
                        </Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              )}
            </View>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.linen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: Colors.linen,
    padding: 6,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: Colors.forest,
  },
  tabBtnText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
  tabBtnTextActive: {
    color: Colors.white,
    fontWeight: "700",
  },
  scrollContent: {
    padding: Spacing.md,
  },
  sectionCard: {
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
  sectionHeading: {
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
  field: {
    marginBottom: Spacing.md,
  },
  rowFields: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.ink,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.page,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  catScroll: {
    flexDirection: "row",
    marginVertical: 4,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.page,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forest,
  },
  catChipText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.ink,
    fontWeight: "600",
  },
  catChipTextActive: {
    color: Colors.white,
    fontWeight: "700",
  },
  payoutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#DCFCE7",
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  payoutLabel: {
    fontSize: 10,
    color: Colors.forestDark,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  payoutValue: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  statusToggleRow: {
    flexDirection: "row",
    gap: 6,
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.page,
    borderWidth: 1,
    borderColor: Colors.border,
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
  publishBtn: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  selectedProductCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  selectedProductImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
  },
  selectedProductTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.ink,
  },
  selectedProductCat: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
  },
  changeSelectionText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.forest,
    fontWeight: "700",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  catalogItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  catalogItemThumb: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
  },
  catalogItemName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  catalogItemCat: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
});
