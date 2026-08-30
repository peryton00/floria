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
  Modal,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { rupeesToPaise } from "../../lib/format";
import { Button } from "../../components/ui/Button";

export default function AddPlantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useSellerFeedback();

  // Step 1: Catalog Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [catalogResults, setCatalogResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Step 2: Listing Configuration State
  const [priceRupees, setPriceRupees] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("10");
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("5");
  const [status, setStatus] = useState<"active" | "draft">("active");
  const [sellerNotes, setSellerNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Unknown Product Request Modal State
  const [requestModalVisible, setRequestModalVisible] = useState<boolean>(false);
  const [reqPlantName, setReqPlantName] = useState<string>("");
  const [reqBotanicalName, setReqBotanicalName] = useState<string>("");
  const [reqNotes, setReqNotes] = useState<string>("");
  const [submittingRequest, setSubmittingRequest] = useState<boolean>(false);

  const searchCatalog = useCallback(async (query: string) => {
    try {
      setSearchLoading(true);
      const res = await api.getProducts({
        search: query.trim() || undefined,
        limit: 25,
      });
      if (res.success && Array.isArray(res.data)) {
        setCatalogResults(res.data);
      } else {
        setCatalogResults([]);
      }
    } catch (err) {
      console.warn("[AddPlant] Catalog search error:", err);
      setCatalogResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    searchCatalog(searchQuery);
  }, [searchQuery, searchCatalog]);

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    const existingPrice =
      product.price_paise ||
      product.inventory?.[0]?.price_paise ||
      product.inventory?.price_paise ||
      49900;
    setPriceRupees(String(Math.round(existingPrice / 100)));
  };

  const handleCreateListing = async () => {
    if (!selectedProduct) {
      showError("Please select a botanical specimen from the catalog.");
      return;
    }

    const priceNum = parseFloat(priceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      showError("Please enter a valid selling price in ₹.");
      return;
    }

    const stockNum = parseInt(stockQuantity, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      showError("Please enter a valid stock count.");
      return;
    }

    const thresholdNum = parseInt(lowStockThreshold, 10) || 5;

    try {
      setSubmitting(true);
      const payload = {
        name: selectedProduct.name,
        category_id: selectedProduct.category_id,
        description: selectedProduct.description || sellerNotes || undefined,
        care_instructions: selectedProduct.care_instructions,
        price_paise: rupeesToPaise(priceNum),
        stock_quantity: stockNum,
        low_stock_threshold: thresholdNum,
        status,
        image_url:
          selectedProduct.primary_image_url ||
          selectedProduct.image_url ||
          selectedProduct.images?.[0]?.url,
      };

      const res = await api.createSellerProduct(payload);
      if (res.success) {
        showSuccess(`"${selectedProduct.name}" added to your nursery listings!`);
        router.replace("/(tabs)/products" as any);
      } else {
        showError(res.error?.message || "Failed to add plant to catalog.");
      }
    } catch (err: any) {
      showError(err.message || "Failed to create seller listing.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitUnknownProductRequest = async () => {
    if (!reqPlantName.trim()) {
      showError("Please enter the common plant name.");
      return;
    }

    try {
      setSubmittingRequest(true);
      showSuccess(
        `Catalog request submitted for "${reqPlantName}". The Floria taxonomy team will review it.`,
      );
      setRequestModalVisible(false);
      setReqPlantName("");
      setReqBotanicalName("");
      setReqNotes("");
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <View style={styles.screen}>
      {!selectedProduct ? (
        // ── STEP 1: Search Canonical Floria Catalog ──
        <View style={{ flex: 1 }}>
          <View style={styles.searchHeader}>
            <Text style={styles.searchTitle}>Search Floria Catalog</Text>
            <Text style={styles.searchSubtitle}>
              Select an authoritative botanical specimen to add to your nursery stock.
            </Text>

            <View style={styles.searchInputWrap}>
              <Ionicons name="search-outline" size={18} color={Colors.inkMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search plants (e.g. Monstera, Snake Plant)..."
                placeholderTextColor={Colors.inkSubtle}
                style={styles.searchInput}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={16} color={Colors.inkMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {searchLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color={Colors.forest} />
              <Text style={styles.centerLoadingText}>Searching botanical catalog...</Text>
            </View>
          ) : (
            <FlatList
              data={catalogResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.resultsList}
              renderItem={({ item }) => {
                const img =
                  item.primary_image_url ||
                  item.image_url ||
                  item.images?.[0]?.url ||
                  "/floria-logo.png";
                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleSelectProduct(item)}
                    style={styles.catalogItemRow}
                  >
                    <Image
                      source={{
                        uri: img.startsWith("http")
                          ? img
                          : "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=200",
                      }}
                      style={styles.catalogItemImage}
                    />
                    <View style={styles.catalogItemInfo}>
                      <Text style={styles.catalogItemName}>{item.name}</Text>
                      {item.botanical_name && (
                        <Text style={styles.catalogItemBotanical}>
                          {item.botanical_name}
                        </Text>
                      )}
                      <Text style={styles.catalogItemCategory}>
                        {item.category?.name || "Indoor Foliage"}
                      </Text>
                    </View>
                    <View style={styles.selectButton}>
                      <Text style={styles.selectButtonText}>Select</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setRequestModalVisible(true)}
                  style={styles.requestNewPlantBox}
                >
                  <Ionicons name="help-circle-outline" size={20} color={Colors.forest} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestNewPlantTitle}>
                      Can't find your plant?
                    </Text>
                    <Text style={styles.requestNewPlantSub}>
                      Request a new product to be cataloged by Floria botanists.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.forest} />
                </TouchableOpacity>
              }
            />
          )}
        </View>
      ) : (
        // ── STEP 2: Configure Seller Listing ──
        <ScrollView
          contentContainerStyle={[styles.configScroll, { paddingBottom: insets.bottom + 90 }]}
        >
          {/* Selected Canonical Product Card */}
          <View style={styles.selectedProductCard}>
            <Image
              source={{
                uri: (
                  selectedProduct.primary_image_url ||
                  selectedProduct.image_url ||
                  selectedProduct.images?.[0]?.url ||
                  ""
                ).startsWith("http")
                  ? selectedProduct.primary_image_url || selectedProduct.image_url
                  : "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=200",
              }}
              style={styles.selectedProductImage}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedProductTitle}>{selectedProduct.name}</Text>
              <Text style={styles.selectedProductCategory}>
                Canonical Catalog Specimen
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedProduct(null)}
                style={styles.changeSpecimenBtn}
              >
                <Text style={styles.changeSpecimenText}>Change plant</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields: Seller-Owned Listing Data */}
          <View style={styles.formCard}>
            <Text style={styles.formHeader}>Configure Your Nursery Listing</Text>

            {/* Price (₹) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Selling Price (₹) *</Text>
              <TextInput
                value={priceRupees}
                onChangeText={setPriceRupees}
                placeholder="499"
                placeholderTextColor={Colors.inkSubtle}
                keyboardType="numeric"
                style={styles.textInput}
              />
              <Text style={styles.inputHelp}>
                Set the price customers in your delivery zone will pay for this plant.
              </Text>
            </View>

            {/* Stock Quantity */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Initial Stock Quantity *</Text>
              <TextInput
                value={stockQuantity}
                onChangeText={setStockQuantity}
                placeholder="10"
                placeholderTextColor={Colors.inkSubtle}
                keyboardType="number-pad"
                style={styles.textInput}
              />
            </View>

            {/* Low Stock Alert Threshold */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Low Stock Alert Threshold</Text>
              <TextInput
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
                placeholder="5"
                placeholderTextColor={Colors.inkSubtle}
                keyboardType="number-pad"
                style={styles.textInput}
              />
              <Text style={styles.inputHelp}>
                You will receive a notification when stock drops to or below this amount.
              </Text>
            </View>

            {/* Status (Active / Draft) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Listing Status</Text>
              <View style={styles.statusToggleRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
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
                    Active (Ready to Sell)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
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

            {/* Seller Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nursery Specific Notes (Optional)</Text>
              <TextInput
                value={sellerNotes}
                onChangeText={setSellerNotes}
                placeholder="e.g. Grown in clay pots, acclimated to bright indirect sunlight"
                placeholderTextColor={Colors.inkSubtle}
                multiline
                numberOfLines={3}
                style={[styles.textInput, { height: 75, textAlignVertical: "top" }]}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── Fixed Bottom Submit Bar (Step 2) ── */}
      {selectedProduct && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            label={`Add "${selectedProduct.name}" to Nursery`}
            variant="primary"
            size="lg"
            loading={submitting}
            onPress={handleCreateListing}
          />
        </View>
      )}

      {/* ── Unknown Product Request Modal ── */}
      <Modal
        visible={requestModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Text style={styles.modalTitle}>Request a New Product</Text>
            <Text style={styles.modalSubtitle}>
              Can't find a botanical specimen? Submit details so our taxonomy team can verify and add it to the global catalog.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Common Plant Name *</Text>
              <TextInput
                value={reqPlantName}
                onChangeText={setReqPlantName}
                placeholder="e.g. Philodendron Birkin"
                placeholderTextColor={Colors.inkSubtle}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Botanical / Scientific Name (Optional)</Text>
              <TextInput
                value={reqBotanicalName}
                onChangeText={setReqBotanicalName}
                placeholder="e.g. Philodendron hybrid"
                placeholderTextColor={Colors.inkSubtle}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Notes / Plant Details</Text>
              <TextInput
                value={reqNotes}
                onChangeText={setReqNotes}
                placeholder="Describe leaf variegation, growth habit, pot size..."
                placeholderTextColor={Colors.inkSubtle}
                multiline
                numberOfLines={3}
                style={[styles.textInput, { height: 70, textAlignVertical: "top" }]}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="outline"
                size="md"
                onPress={() => setRequestModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                label="Submit Request"
                variant="primary"
                size="md"
                loading={submittingRequest}
                onPress={handleSubmitUnknownProductRequest}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  searchHeader: {
    padding: Spacing.md,
    backgroundColor: Colors.page,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchTitle: {
    fontSize: Typography.fontSizes.md,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.ink,
  },
  searchSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  centerLoadingText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
  },
  resultsList: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  catalogItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  catalogItemImage: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.sand,
  },
  catalogItemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  catalogItemName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "Georgia",
  },
  catalogItemBotanical: {
    fontSize: 11,
    fontStyle: "italic",
    color: Colors.inkMuted,
  },
  catalogItemCategory: {
    fontSize: 10,
    color: Colors.sage,
    fontWeight: "600",
    marginTop: 2,
  },
  selectButton: {
    backgroundColor: Colors.botanical,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  selectButtonText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forestDark,
  },
  requestNewPlantBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  requestNewPlantTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  requestNewPlantSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  configScroll: {
    padding: Spacing.md,
  },
  selectedProductCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  selectedProductImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.sand,
    marginRight: Spacing.md,
  },
  selectedProductTitle: {
    fontSize: Typography.fontSizes.md,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.ink,
  },
  selectedProductCategory: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.sage,
    fontWeight: "600",
    marginTop: 2,
  },
  changeSpecimenBtn: {
    marginTop: 4,
  },
  changeSpecimenText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
  },
  formCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
  inputHelp: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 3,
  },
  statusToggleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.page,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.md,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.ink,
  },
  modalSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginVertical: Spacing.xs,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
