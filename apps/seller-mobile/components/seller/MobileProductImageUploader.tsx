import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import {
  Star,
  Check,
  WarningCircle,
  Trash,
  Camera,
  Images,
  X,
  CaretRight,
} from "phosphor-react-native";
import { api } from "../../lib/api";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

export interface MobileProductImage {
  id?: string;
  assetId?: string;
  url: string;
  isPrimary?: boolean;
  status?: "UPLOADING" | "PROCESSING" | "OPTIMIZING" | "COMPLETED" | "READY" | "FAILED";
  errorMessage?: string;
  localUri?: string;
  filename?: string;
  mimeType?: string;
}

interface MobileProductImageUploaderProps {
  images: MobileProductImage[];
  onChange: (images: MobileProductImage[]) => void;
  maxImages?: number; // Default 5
}

function resolveImageMimeType(filename: string, rawMime?: string): string {
  if (rawMime && rawMime.startsWith("image/")) {
    const clean = rawMime.toLowerCase();
    return clean === "image/jpg" ? "image/jpeg" : clean;
  }
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "image/jpeg";
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof btoa !== "undefined"
    ? btoa(binary)
    : (global as any).Buffer?.from(binary, "binary").toString("base64") || "";
}

export function MobileProductImageUploader({
  images,
  onChange,
  maxImages = 5,
}: MobileProductImageUploaderProps) {
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [activeUploading, setActiveUploading] = useState(false);

  // Helper to read local file to base64 DataURI
  const readAssetAsDataUri = async (
    localUri: string,
    rawBase64?: string | null,
    mimeType: string = "image/jpeg",
  ): Promise<string> => {
    let base64 = rawBase64 || "";
    if (!base64) {
      try {
        base64 = await FileSystem.readAsStringAsync(localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch {
        const response = await fetch(localUri);
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
          throw new Error(
            `Image exceeds 10 MB maximum limit (${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(1)} MB).`,
          );
        }
        base64 = arrayBufferToBase64(arrayBuffer);
      }
    }

    if (!base64) {
      throw new Error("Unable to read image binary from device filesystem.");
    }

    return base64.startsWith("data:")
      ? base64
      : `data:${mimeType};base64,${base64}`;
  };

  // Process a batch of picked assets sequentially one-by-one
  const processAssetBatch = async (
    newAssets: { uri: string; fileName?: string | null; mimeType?: string | null; base64?: string | null }[],
  ) => {
    if (newAssets.length === 0) return;
    setActiveUploading(true);

    const startIndex = images.length;
    // 1. Append placeholder items immediately for instant UI feedback
    const placeholders: MobileProductImage[] = newAssets.map((asset, idx) => ({
      assetId: "",
      url: asset.uri,
      localUri: asset.uri,
      filename: asset.fileName || `specimen_${Date.now()}_${idx}.jpg`,
      mimeType: resolveImageMimeType(asset.fileName || "specimen.jpg", asset.mimeType || undefined),
      isPrimary: startIndex === 0 && idx === 0,
      status: "UPLOADING",
    }));

    let workingList = [...images, ...placeholders];
    onChange(workingList);

    // 2. Upload sequentially one by one
    for (let i = 0; i < newAssets.length; i++) {
      const targetIndex = startIndex + i;
      const asset = newAssets[i];
      const filename = workingList[targetIndex]?.filename || `plant_${Date.now()}_${i}.jpg`;
      const mimeType = workingList[targetIndex]?.mimeType || "image/jpeg";

      try {
        // Update status to PROCESSING
        workingList = workingList.map((item, idx) =>
          idx === targetIndex ? { ...item, status: "PROCESSING" as const } : item,
        );
        onChange([...workingList]);

        // Convert to standard Data URI (identical to seller-web FileReader)
        const base64DataUri = await readAssetAsDataUri(asset.uri, asset.base64, mimeType);

        // Upload to Floria backend image engine
        const uploadRes = await api.uploadMediaDirect({
          filename,
          mimeType,
          base64Data: base64DataUri,
          profile: "PRODUCT",
        });

        if (!uploadRes.success || !uploadRes.data) {
          throw new Error(uploadRes.error?.message || "Backend image processing failed.");
        }

        const { assetId, variants, url } = uploadRes.data;
        const resolvedUrl =
          url ||
          variants?.medium ||
          variants?.large ||
          variants?.thumbnail;

        if (!resolvedUrl) {
          throw new Error("Backend did not return a valid public image URL.");
        }

        // Attach authoritative URL & assetId
        workingList = workingList.map((item, idx) =>
          idx === targetIndex
            ? {
                ...item,
                assetId,
                url: resolvedUrl,
                status: "COMPLETED" as const,
              }
            : item,
        );
        onChange([...workingList]);
      } catch (err: any) {
        console.warn(`[MobileProductImageUploader] Upload error for item ${targetIndex}:`, err?.message || err);
        workingList = workingList.map((item, idx) =>
          idx === targetIndex
            ? {
                ...item,
                status: "FAILED" as const,
                errorMessage: err?.message || "Upload failed",
              }
            : item,
        );
        onChange([...workingList]);
      }
    }

    setActiveUploading(false);
  };

  // Multiple selection from gallery with 4:3 aspect ratio
  const handlePickFromGallery = async () => {
    setPickerModalVisible(false);
    const availableSlots = maxImages - images.length;
    if (availableSlots <= 0) {
      Alert.alert("Limit Reached", `You can add a maximum of ${maxImages} images per product.`);
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant photo library access to upload plant pictures from your device.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: availableSlots,
        allowsEditing: availableSlots === 1,
        aspect: [4, 3],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAssets = result.assets.slice(0, availableSlots);
        await processAssetBatch(selectedAssets);
      }
    } catch (err: any) {
      setActiveUploading(false);
      Alert.alert("Gallery Error", err.message || "Failed to open device gallery.");
    }
  };

  // Camera capture with 4:3 crop box
  const handleTakePhoto = async () => {
    setPickerModalVisible(false);
    const availableSlots = maxImages - images.length;
    if (availableSlots <= 0) {
      Alert.alert("Limit Reached", `You can add a maximum of ${maxImages} images per product.`);
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant camera access to take botanical photos of your nursery stock.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAssetBatch([result.assets[0]]);
      }
    } catch (err: any) {
      setActiveUploading(false);
      Alert.alert("Camera Error", err.message || "Failed to open device camera.");
    }
  };

  // Retry upload for a failed single image
  const handleRetry = async (index: number) => {
    const item = images[index];
    if (!item || !item.localUri) return;

    try {
      const updated = images.map((img, idx) =>
        idx === index ? { ...img, status: "PROCESSING" as const } : img,
      );
      onChange(updated);

      const mimeType = item.mimeType || "image/jpeg";
      const base64DataUri = await readAssetAsDataUri(item.localUri, null, mimeType);

      const res = await api.uploadMediaDirect({
        filename: item.filename || "retry.jpg",
        mimeType,
        base64Data: base64DataUri,
        profile: "PRODUCT",
      });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || "Retry failed.");
      }

      const { assetId, variants, url } = res.data;
      const resolvedUrl = url || variants?.medium || variants?.large || variants?.thumbnail;

      const completed = images.map((img, idx) =>
        idx === index
          ? {
              ...img,
              assetId,
              url: resolvedUrl,
              status: "COMPLETED" as const,
              errorMessage: undefined,
            }
          : img,
      );
      onChange(completed);
    } catch (err: any) {
      const failed = images.map((img, idx) =>
        idx === index
          ? {
              ...img,
              status: "FAILED" as const,
              errorMessage: err?.message || "Retry failed",
            }
          : img,
      );
      onChange(failed);
    }
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    }));
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const filtered = images.filter((_, idx) => idx !== index);
    if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    onChange(filtered);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {/* Uploaded Images List */}
        {images.map((item, index) => {
          const isUploading = item.status === "UPLOADING";
          const isProcessing = item.status === "PROCESSING";
          const isOptimizing = item.status === "OPTIMIZING";
          const isInProgress = isUploading || isProcessing || isOptimizing;
          const isCompleted = item.status === "COMPLETED" || item.status === "READY";
          const isFailed = item.status === "FAILED";

          let statusLabel = "Uploading...";
          if (isProcessing) statusLabel = "Processing...";
          if (isOptimizing) statusLabel = "Optimizing...";

          return (
            <View key={index} style={styles.imageCard}>
              <Image
                source={{ uri: item.localUri || item.url }}
                style={styles.thumbnail}
                resizeMode="cover"
              />

              {/* Cover Badge */}
              {item.isPrimary && !isInProgress && (
                <View style={styles.primaryBadge}>
                  <Star size={10} color="#FFFFFF" weight="fill" />
                  <Text style={styles.primaryBadgeText}>Primary</Text>
                </View>
              )}

              {/* WebP Ready Badge */}
              {isCompleted && !item.isPrimary && (
                <View style={styles.readyBadge}>
                  <Check size={10} color="#FFFFFF" weight="bold" />
                  <Text style={styles.readyBadgeText}>WebP</Text>
                </View>
              )}

              {/* In Progress Overlay (Uploading / Processing / Optimizing) */}
              {isInProgress && (
                <View style={styles.overlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.overlayText}>{statusLabel}</Text>
                </View>
              )}

              {/* Failed Overlay with Retry */}
              {isFailed && (
                <View style={[styles.overlay, { backgroundColor: "rgba(220, 38, 38, 0.88)" }]}>
                  <WarningCircle size={18} color="#FFFFFF" weight="bold" />
                  <Text style={styles.overlayText}>Failed</Text>
                  {item.localUri && (
                    <TouchableOpacity
                      onPress={() => handleRetry(index)}
                      style={styles.retryBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              {!isInProgress && (
                <View style={styles.cardActions}>
                  {!item.isPrimary && !isFailed && (
                    <TouchableOpacity
                      onPress={() => handleSetPrimary(index)}
                      style={styles.actionCircle}
                      activeOpacity={0.8}
                    >
                      <Star size={14} color={Colors.forest} weight="regular" />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => handleRemove(index)}
                    style={[styles.actionCircle, { backgroundColor: "#FEE2E2" }]}
                    activeOpacity={0.8}
                  >
                    <Trash size={14} color={Colors.error} weight="regular" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {/* Add Photo Button Tile */}
        {images.length < maxImages && (
          <TouchableOpacity
            onPress={() => setPickerModalVisible(true)}
            style={styles.addTile}
            activeOpacity={0.7}
            disabled={activeUploading}
          >
            {activeUploading ? (
              <ActivityIndicator size="small" color={Colors.forest} />
            ) : (
              <>
                <View style={styles.plusIconWrap}>
                  <Camera size={22} color={Colors.forest} weight="regular" />
                </View>
                <Text style={styles.addTileText}>+ Add Photo</Text>
                <Text style={styles.addTileSub}>
                  {images.length}/{maxImages} (Max 10MB)
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Choose Source Modal ── */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Plant Photo</Text>
              <TouchableOpacity onPress={() => setPickerModalVisible(false)}>
                <X size={20} color={Colors.ink} weight="bold" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Select photos from your device. Images are cropped to 4:3 ratio and automatically converted to high-speed WebP on the backend (Max 5 photos, 10 MB each).
            </Text>

            {/* Option 1: Gallery (Supports multiple selection) */}
            <TouchableOpacity
              onPress={handlePickFromGallery}
              style={styles.optionRow}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: "#DCFCE7" }]}>
                <Images size={22} color={Colors.forest} weight="regular" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Select from Photo Gallery</Text>
                <Text style={styles.optionDesc}>
                  Pick up to {maxImages - images.length} photos at once from your phone
                </Text>
              </View>
              <CaretRight size={16} color={Colors.inkMuted} weight="bold" />
            </TouchableOpacity>

            {/* Option 2: Camera with 4:3 Crop Box */}
            <TouchableOpacity
              onPress={handleTakePhoto}
              style={styles.optionRow}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: "#E0F2FE" }]}>
                <Camera size={22} color="#0284C7" weight="regular" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Take Live Photo (4:3 Crop)</Text>
                <Text style={styles.optionDesc}>
                  Capture fresh specimen directly in your nursery with 4:3 crop box
                </Text>
              </View>
              <CaretRight size={16} color={Colors.inkMuted} weight="bold" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  scrollList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  imageCard: {
    width: 105,
    height: 105,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.page,
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  primaryBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: Colors.forest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  primaryBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  readyBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  readyBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "700",
  },
  retryBtn: {
    marginTop: 2,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  retryBtnText: {
    color: Colors.error,
    fontSize: 9,
    fontWeight: "700",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    gap: 4,
  },
  overlayText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  cardActions: {
    position: "absolute",
    bottom: 5,
    right: 5,
    flexDirection: "row",
    gap: 5,
  },
  actionCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addTile: {
    width: 105,
    height: 105,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.forest,
    borderStyle: "dashed",
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
  },
  plusIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  addTileText: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.forest,
  },
  addTileSub: {
    fontSize: 9,
    color: Colors.inkMuted,
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
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.forest,
  },
  modalSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  optionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  optionDesc: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
});
