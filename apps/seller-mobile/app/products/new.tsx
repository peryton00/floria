import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloriaIcon } from "../../components/ui/FloriaIcon";
import { api } from "../../lib/api";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import {
  SellerPendingVerificationShield,
  MobileProductImageUploader,
  MobileProductImage,
} from "../../components/seller";

interface CategoryItem {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
}

export default function NewProductListingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller } = useSellerAuth();
  const { toast } = useSellerFeedback();

  const isApproved =
    seller?.status === "approved" || seller?.status === "active";

  // Categories & Financial Settings
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [financialSettings, setFinancialSettings] = useState<any>(null);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(true);

  // Fresh Product Form State
  const [name, setName] = useState<string>("");
  const [botanicalName, setBotanicalName] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [priceRupees, setPriceRupees] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("10");
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("5");
  const [sku, setSku] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [careInstructions, setCareInstructions] = useState<string>("");
  const [status, setStatus] = useState<"active" | "draft">("active");
  const [images, setImages] = useState<MobileProductImage[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Load Categories & Financial Settings on mount
  useEffect(() => {
    async function loadMetadata() {
      try {
        setLoadingMeta(true);
        const [catRes, finRes] = await Promise.all([
          api.getCategories().catch(() => ({ success: false, data: [] })),
          api.getFinancialSettings().catch(() => ({ success: false, data: null })),
        ]);
        if (catRes.success && Array.isArray(catRes.data) && catRes.data.length > 0) {
          setCategories(catRes.data);
          setCategoryId(catRes.data[0].id);
        }
        if (finRes.success && finRes.data) {
          setFinancialSettings(finRes.data);
        }
      } catch (err) {
        console.warn("[NewProduct] Error loading metadata:", err);
      } finally {
        setLoadingMeta(false);
      }
    }
    loadMetadata();
  }, []);

  // Live Pricing Breakdown Calculation
  const pricingBreakdown = useMemo(() => {
    const basePaise = Math.round((parseFloat(priceRupees) || 0) * 100);
    if (basePaise <= 0) return null;

    const commRate = financialSettings?.sellerCommissionRate ?? 12.0;
    const profitRate = financialSettings?.floriaProfitRate ?? 2.0;
    const thresholdPaise = financialSettings?.freeDeliveryThresholdPaise ?? 59900;
    const recoveryPaise = financialSettings?.freeDeliveryRecoveryPaise ?? 2000;

    const profitPaise = Math.round(basePaise * (profitRate / 100));
    const preRecoveryPaise = basePaise + profitPaise;
    const isFreeDel = preRecoveryPaise >= thresholdPaise;
    const deliveryRecoveryPaise = isFreeDel ? recoveryPaise : 0;
    const customerPricePaise = preRecoveryPaise + deliveryRecoveryPaise;
    const commissionPaise = Math.round(basePaise * (commRate / 100));
    const netPayoutPaise = basePaise - commissionPaise;

    return {
      basePaise,
      commRate,
      netPayoutPaise,
      customerPricePaise,
      isFreeDel,
      profitRate,
      recoveryPaise,
    };
  }, [priceRupees, financialSettings]);

  // Handle Submit Fresh Product
  const handleSubmitListing = async () => {
    if (!name.trim()) {
      toast.error("Missing Field", "Please enter a plant or product name.");
      return;
    }

    if (!categoryId) {
      toast.error("Missing Field", "Please select a botanical category.");
      return;
    }

    const parsedPrice = parseFloat(priceRupees);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Invalid Price", "Please enter a valid selling price in rupees.");
      return;
    }

    const parsedStock = parseInt(stockQuantity, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      toast.error("Invalid Stock", "Please enter a valid available stock quantity.");
      return;
    }

    const parsedThreshold = parseInt(lowStockThreshold, 10);
    const validThreshold = isNaN(parsedThreshold) ? 5 : parsedThreshold;

    const isUploadingImages = images.some(
      (img) => img.status === "UPLOADING" || img.status === "PROCESSING" || img.status === "OPTIMIZING",
    );
    if (isUploadingImages) {
      toast.warning(
        "Upload in Progress",
        "Please wait for your plant photos to finish processing.",
      );
      return;
    }

    const hasFailedImages = images.some((img) => img.status === "FAILED");
    if (hasFailedImages) {
      toast.error(
        "Image Upload Incomplete",
        "One or more images failed to upload. Please remove or retry them before publishing.",
      );
      return;
    }

    // Cleaned images payload with verified public URLs and asset IDs
    const cleanImages = images
      .filter((img) => img.status === "COMPLETED" || img.status === "READY" || (img.url && !img.url.startsWith("file://") && !img.url.startsWith("blob:")))
      .map((img) => ({
        asset_id: img.assetId && img.assetId.trim().length > 10 ? img.assetId : undefined,
        url: img.url,
        is_primary: Boolean(img.isPrimary),
      }));

    const primaryImage =
      cleanImages.find((img) => img.is_primary)?.url ||
      cleanImages[0]?.url ||
      undefined;

    try {
      setSubmitting(true);

      const payload = {
        name: name.trim(),
        botanical_name: botanicalName.trim() || undefined,
        category_id: categoryId,
        price_paise: Math.round(parsedPrice * 100),
        stock_quantity: parsedStock,
        low_stock_threshold: validThreshold,
        sku: sku.trim() || undefined,
        description: description.trim() || undefined,
        care_instructions: careInstructions.trim() || undefined,
        status,
        images: cleanImages,
        image_url: primaryImage,
      };

      const res = await api.createSellerProduct(payload);

      if (res.success && res.data) {
        toast.success(
          "Product Listed",
          `"${name}" has been published to your nursery catalog.`,
        );
        router.replace("/(tabs)/products" as any);
      } else {
        toast.error(
          "Listing Failed",
          res.error?.message || "Could not create listing. Please try again.",
        );
      }
    } catch (err: any) {
      toast.error("Error", err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isApproved) {
    return (
      <View style={styles.screen}>
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
      <ScrollView
        contentContainerStyle={[
          styles.formScrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Botanical Specimen Photos ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>PLANT SPECIMEN PHOTOS</Text>
          <Text style={styles.fieldHelper}>
            Upload high-resolution photographs of your nursery specimen. The first photo is the primary listing thumbnail.
          </Text>
          <View style={{ marginTop: Spacing.xs }}>
            <MobileProductImageUploader
              images={images}
              onChange={setImages}
              maxImages={5}
            />
          </View>
        </View>

        {/* ── 2. Plant Common Name ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>PLANT / PRODUCT NAME *</Text>
          <TextInput
            placeholder="e.g. Variegated Monstera Deliciosa"
            placeholderTextColor={Colors.inkLight}
            value={name}
            onChangeText={setName}
            style={styles.textInput}
          />
        </View>

        {/* ── 3. Botanical / Scientific Name ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>BOTANICAL / SCIENTIFIC NAME</Text>
          <TextInput
            placeholder="e.g. Monstera deliciosa var. borsigiana"
            placeholderTextColor={Colors.inkLight}
            value={botanicalName}
            onChangeText={setBotanicalName}
            style={[styles.textInput, { fontStyle: "italic" }]}
          />
        </View>

        {/* ── 4. Category Classification ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>CATEGORY CLASSIFICATION *</Text>
          {loadingMeta ? (
            <ActivityIndicator size="small" color={Colors.forest} style={{ marginVertical: Spacing.sm }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryChipsScroll}
            >
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.8}
                    onPress={() => setCategoryId(cat.id)}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── 5. Pricing (Base Rupees) ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>NURSERY BASE PRICE (₹) *</Text>
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

        {/* Live Automated Pricing & Profit Breakdown */}
        {pricingBreakdown && (
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <FloriaIcon name="wallet" size={14} color={Colors.forest} />
              <Text style={styles.breakdownTitle}>Live Pricing & Payout Estimation</Text>
            </View>

            <View style={styles.breakdownGrid}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownItemLabel}>Nursery Base</Text>
                <Text style={styles.breakdownItemVal}>
                  ₹{(pricingBreakdown.basePaise / 100).toFixed(2)}
                </Text>
              </View>

              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownItemLabel}>
                  Net Payout ({(100 - pricingBreakdown.commRate).toFixed(0)}%)
                </Text>
                <Text style={[styles.breakdownItemVal, { color: Colors.success }]}>
                  ₹{(pricingBreakdown.netPayoutPaise / 100).toFixed(2)}
                </Text>
                <Text style={styles.breakdownItemSub}>
                  After {pricingBreakdown.commRate}% fee
                </Text>
              </View>

              <View style={[styles.breakdownItem, styles.breakdownCustomerPriceItem]}>
                <Text style={[styles.breakdownItemLabel, { color: Colors.forest }]}>
                  Customer Price
                </Text>
                <Text style={[styles.breakdownItemVal, { color: Colors.forest }]}>
                  ₹{(pricingBreakdown.customerPricePaise / 100).toFixed(2)}
                </Text>
                <Text style={styles.breakdownItemSub}>
                  +{pricingBreakdown.profitRate}% margin {pricingBreakdown.isFreeDel ? `+ ₹${(pricingBreakdown.recoveryPaise / 100).toFixed(0)} delivery` : ""}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── 6. Stock & Low Stock Threshold ── */}
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

        {/* ── 7. Nursery SKU / Batch Code ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>NURSERY SKU / BATCH (OPTIONAL)</Text>
          <TextInput
            placeholder="e.g. NUR-MON-01 (Auto-generated if blank)"
            placeholderTextColor={Colors.inkLight}
            value={sku}
            onChangeText={setSku}
            style={styles.textInput}
          />
        </View>

        {/* ── 8. Plant Description ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>PLANT DESCRIPTION</Text>
          <TextInput
            placeholder="Describe the plant species, size, growth stage, foliage color, and pot specs..."
            placeholderTextColor={Colors.inkLight}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={[styles.textInput, styles.textArea]}
          />
        </View>

        {/* ── 9. Botanical Care Instructions ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>BOTANICAL CARE INSTRUCTIONS</Text>
          <TextInput
            placeholder="Sunlight requirements, watering intervals, humidity, and soil type recommendations..."
            placeholderTextColor={Colors.inkLight}
            value={careInstructions}
            onChangeText={setCareInstructions}
            multiline
            numberOfLines={3}
            style={[styles.textInput, styles.textArea]}
          />
        </View>

        {/* ── 10. Listing Status Toggle ── */}
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
                name="clock"
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

        {/* ── Submit Button ── */}
        <Button
          label={submitting ? "Publishing Product..." : "List Product for Sale"}
          variant="primary"
          size="lg"
          loading={submitting}
          onPress={handleSubmitListing}
          style={{ marginTop: Spacing.md }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  formScrollContent: {
    padding: Spacing.md,
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
  textArea: {
    height: 75,
    textAlignVertical: "top",
  },
  categoryChipsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forestDark,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.inkMuted,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  breakdownCard: {
    backgroundColor: Colors.sand,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.forest,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  breakdownGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  breakdownItem: {
    flex: 1,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownCustomerPriceItem: {
    backgroundColor: Colors.botanical,
    borderColor: Colors.forest + "33",
  },
  breakdownItemLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
  breakdownItemVal: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
    marginVertical: 1,
  },
  breakdownItemSub: {
    fontSize: 8,
    color: Colors.inkLight,
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
