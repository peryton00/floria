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
import { FloriaIcon } from "@floria/icons";
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

export default function ListProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller } = useSellerAuth();
  const { showSuccess, showError } = useSellerFeedback();

  const isApproved =
    seller?.status === "approved" || seller?.status === "active";

  // Step State: 1 = Choose Canonical Product, 2 = Set Nursery Listing Details
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [catalogResults, setCatalogResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  // Listing Form State
  const [priceRupees, setPriceRupees] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("10");
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("5");
  const [sku, setSku] = useState<string>("");
  const [status, setStatus] = useState<"active" | "draft">("active");
  const [images, setImages] = useState<MobileProductImage[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Initial catalog fetch on mount
  const searchCatalog = useCallback(async (query: string) => {
    try {
      setSearchLoading(true);
      const res = await api.getProducts({
        search: query.trim() || undefined,
        limit: 30,
      });
      if (res.success && Array.isArray(res.data)) {
        setCatalogResults(res.data);
      } else {
        setCatalogResults([]);
      }
    } catch (err) {
      console.warn("[ListProduct] Search error:", err);
      setCatalogResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    searchCatalog("");
  }, [searchCatalog]);

  const handleSearchSubmit = () => {
    searchCatalog(searchQuery);
  };

  const handleSelectProduct = (prod: any) => {
    setSelectedProduct(prod);
    // Prepopulate price suggestion if available
    const existingPaise = prod.base_price_paise || prod.price_paise || 0;
    if (existingPaise > 0) {
      setPriceRupees(String(Math.round(existingPaise / 100)));
    }
    // Prepopulate SKU prefix
    const slug = prod.slug || prod.name?.toLowerCase().replace(/\s+/g, "-") || "specimen";
    setSku(`NUR-${slug.substring(0, 8).toUpperCase()}`);
  };

  const handleSubmitListing = async () => {
    if (!selectedProduct) {
      Alert.alert("Selection Required", "Please choose a botanical specimen to list.");
      return;
    }

    const priceNum = parseFloat(priceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price in rupees.");
      return;
    }

    const stockNum = parseInt(stockQuantity, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      Alert.alert("Invalid Stock", "Please enter a valid stock quantity.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        product_id: selectedProduct.id,
        price_paise: Math.round(priceNum * 100),
        stock_quantity: stockNum,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        sku: sku.trim() || undefined,
        status,
        images: images
          .filter((img) => img.status === "COMPLETED" || img.status === "READY" || img.assetId)
          .map((img, idx) => ({
            asset_id: img.assetId,
            url: img.url,
            is_primary: idx === 0,
          })),
      };

      const res = await api.createSellerProduct(payload);

      if (res.success) {
        showSuccess(`${selectedProduct.name} is now listed for sale.`);
        router.replace("/(tabs)/products" as any);
      } else {
        showError(res.error?.message || "Could not create listing. Please try again.");
      }
    } catch (e: any) {
      showError(e.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isApproved) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FloriaIcon name="arrow_left" size={20} color={Colors.forest} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>List Product</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ padding: Spacing.md }}>
          <SellerPendingVerificationShield seller={seller} inline={true} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.xs }]}>
        <TouchableOpacity
          onPress={() => (selectedProduct ? setSelectedProduct(null) : router.back())}
          style={styles.backButton}
        >
          <FloriaIcon name="arrow_left" size={20} color={Colors.forest} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {selectedProduct ? "Listing Details" : "Choose Existing Product"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {!selectedProduct ? (
        /* ── STEP 1: Search & Choose Canonical Product ── */
        <View style={styles.stepContainer}>
          <View style={styles.searchBarWrap}>
            <FloriaIcon name="search" size={18} color={Colors.inkMuted} />
            <TextInput
              placeholder="Search Floria botanical catalog..."
              placeholderTextColor={Colors.inkLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); searchCatalog(""); }}>
                <FloriaIcon name="close" size={16} color={Colors.inkMuted} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.catalogSubtitle}>
            Select a verified specimen from Floria's canonical botanical collection:
          </Text>

          {searchLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={Colors.forest} />
              <Text style={styles.loadingText}>Searching botanical catalog...</Text>
            </View>
          ) : catalogResults.length === 0 ? (
            <View style={styles.emptyResultsCard}>
              <FloriaIcon name="plant" size={32} color={Colors.sageLight} />
              <Text style={styles.emptyResultsTitle}>No botanical matches</Text>
              <Text style={styles.emptyResultsSubtitle}>
                Try searching for a different plant name, genus, or common term.
              </Text>
            </View>
          ) : (
            <FlatList
              data={catalogResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.catalogList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const imgUrl =
                  item.primary_image_url ||
                  item.image_url ||
                  item.product_images?.[0]?.url ||
                  null;

                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleSelectProduct(item)}
                    style={styles.catalogItemRow}
                  >
                    <Image
                      source={
                        imgUrl
                          ? { uri: imgUrl }
                          : require("../../assets/images/floria_mark.png")
                      }
                      style={styles.catalogThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.catalogItemInfo}>
                      <Text style={styles.catalogItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.botanical_name && (
                        <Text style={styles.catalogItemBotanical} numberOfLines={1}>
                          {item.botanical_name}
                        </Text>
                      )}
                      <View style={styles.catalogItemCategoryBadge}>
                        <Text style={styles.catalogItemCategoryText}>
                          {item.category?.name || "Botanical"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.selectArrowWrap}>
                      <FloriaIcon name="plus" size={18} color={Colors.forest} />
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      ) : (
        /* ── STEP 2: Configure Nursery Listing Details ── */
        <ScrollView
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Selected Product Summary Box */}
          <View style={styles.selectedProductCard}>
            <Image
              source={
                selectedProduct.primary_image_url || selectedProduct.image_url
                  ? { uri: selectedProduct.primary_image_url || selectedProduct.image_url }
                  : require("../../assets/images/floria_mark.png")
              }
              style={styles.selectedProductThumb}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedProductPre}>CANONICAL SPECIMEN</Text>
              <Text style={styles.selectedProductName} numberOfLines={1}>
                {selectedProduct.name}
              </Text>
              {selectedProduct.botanical_name && (
                <Text style={styles.selectedProductBotanical} numberOfLines={1}>
                  {selectedProduct.botanical_name}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setSelectedProduct(null)}
              style={styles.changeProductBtn}
            >
              <Text style={styles.changeProductText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Price & Stock Fields */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>SELLER PRICE (₹) *</Text>
            <View style={styles.inputWithIconWrap}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                placeholder="e.g. 450"
                placeholderTextColor={Colors.inkLight}
                keyboardType="numeric"
                value={priceRupees}
                onChangeText={setPriceRupees}
                style={styles.numericInput}
              />
            </View>
            <Text style={styles.fieldHelper}>
              Your nursery selling price before platform commission
            </Text>
          </View>

          <View style={styles.rowTwoFields}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>AVAILABLE STOCK *</Text>
              <TextInput
                placeholder="10"
                placeholderTextColor={Colors.inkLight}
                keyboardType="number-pad"
                value={stockQuantity}
                onChangeText={setStockQuantity}
                style={styles.textInput}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>LOW STOCK ALERT</Text>
              <TextInput
                placeholder="5"
                placeholderTextColor={Colors.inkLight}
                keyboardType="number-pad"
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
                style={styles.textInput}
              />
            </View>
          </View>

          {/* SKU Field */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>NURSERY SKU (OPTIONAL)</Text>
            <TextInput
              placeholder="e.g. NUR-MON-01"
              placeholderTextColor={Colors.inkLight}
              value={sku}
              onChangeText={setSku}
              style={styles.textInput}
            />
          </View>

          {/* Specimen Images via Floria Image Engine */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>NURSERY SPECIMEN PHOTOS (OPTIONAL)</Text>
            <Text style={styles.fieldHelper}>
              Upload actual photographs of your nursery batch. Processed through Floria Image Engine.
            </Text>
            <View style={{ marginTop: Spacing.xs }}>
              <MobileProductImageUploader
                images={images}
                onChange={setImages}
                maxImages={4}
              />
            </View>
          </View>

          {/* Availability Status Toggle */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>LISTING STATUS</Text>
            <View style={styles.statusToggleRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setStatus("active")}
                style={[
                  styles.statusToggleBtn,
                  status === "active" && styles.statusToggleActive,
                ]}
              >
                <FloriaIcon
                  name="check"
                  size={16}
                  color={status === "active" ? Colors.white : Colors.inkMuted}
                />
                <Text
                  style={[
                    styles.statusToggleText,
                    status === "active" && styles.statusToggleTextActive,
                  ]}
                >
                  Active for Sale
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setStatus("draft")}
                style={[
                  styles.statusToggleBtn,
                  status === "draft" && styles.statusToggleActive,
                ]}
              >
                <FloriaIcon
                  name="edit"
                  size={16}
                  color={status === "draft" ? Colors.white : Colors.inkMuted}
                />
                <Text
                  style={[
                    styles.statusToggleText,
                    status === "draft" && styles.statusToggleTextActive,
                  ]}
                >
                  Save as Draft
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <Button
            label={submitting ? "Publishing Listing..." : "List Product for Sale"}
            variant="primary"
            size="lg"
            loading={submitting}
            onPress={handleSubmitListing}
            style={{ marginTop: Spacing.md }}
          />
        </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.page,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.linen,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topBarTitle: {
    fontFamily: "Georgia",
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    color: Colors.forest,
  },
  stepContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
    paddingVertical: 4,
  },
  catalogSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginVertical: Spacing.sm,
    fontWeight: "500",
  },
  catalogList: {
    paddingBottom: Spacing.xxl,
    gap: Spacing.xs,
  },
  catalogItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  catalogThumb: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.softSand,
  },
  catalogItemInfo: {
    flex: 1,
  },
  catalogItemName: {
    fontFamily: "Georgia",
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  catalogItemBotanical: {
    fontSize: Typography.fontSizes.xs,
    fontStyle: "italic",
    color: Colors.inkMuted,
    marginTop: 1,
  },
  catalogItemCategoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.page,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catalogItemCategoryText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.sage,
    textTransform: "uppercase",
  },
  selectArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.botanical,
    alignItems: "center",
    justifyContent: "center",
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  loadingText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    fontWeight: "500",
  },
  emptyResultsCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  emptyResultsTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  emptyResultsSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
    textAlign: "center",
  },
  formScrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  selectedProductCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  selectedProductThumb: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.softSand,
  },
  selectedProductPre: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.terracotta,
    letterSpacing: 0.5,
  },
  selectedProductName: {
    fontFamily: "Georgia",
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.forest,
  },
  selectedProductBotanical: {
    fontSize: Typography.fontSizes.xs,
    fontStyle: "italic",
    color: Colors.inkMuted,
  },
  changeProductBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.page,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changeProductText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.forest,
    textTransform: "uppercase",
  },
  fieldSection: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldHelper: {
    fontSize: 10,
    color: Colors.inkLight,
    marginTop: 3,
  },
  inputWithIconWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.forest,
    marginRight: 6,
  },
  numericInput: {
    flex: 1,
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    color: Colors.ink,
    paddingVertical: Spacing.sm,
  },
  rowTwoFields: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  textInput: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  statusToggleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statusToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  statusToggleActive: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forestDark,
  },
  statusToggleText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.inkMuted,
  },
  statusToggleTextActive: {
    color: Colors.white,
  },
});
