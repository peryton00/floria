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
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

export interface MobileProductImage {
  id?: string;
  assetId?: string;
  url: string;
  isPrimary?: boolean;
  status?: "READY" | "UPLOADING" | "PROCESSING" | "FAILED";
  errorMessage?: string;
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

  // Single file upload worker with Backend Image Engine WebP Transcoding
  const uploadSingleAsset = async (
    localUri: string,
    filename: string,
    rawMime: string | undefined,
    rawBase64: string | undefined | null,
    currentImagesRef: MobileProductImage[],
    indexInBatch: number,
  ) => {
    const mimeType = resolveImageMimeType(filename, rawMime);
    const isFirst = currentImagesRef.length === 0 && indexInBatch === 0;

    const tempItem: MobileProductImage = {
      assetId: "",
      url: localUri,
      isPrimary: isFirst,
      status: "UPLOADING",
    };

    currentImagesRef.push(tempItem);
    onChange([...currentImagesRef]);

    try {
      // 1. Prepare Base64 payload
      let base64Data = rawBase64 || "";
      if (!base64Data) {
        const response = await fetch(localUri);
        const arrayBuffer = await response.arrayBuffer();

        if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
          throw new Error(
            `Image exceeds 10 MB maximum limit (${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(1)} MB).`,
          );
        }

        base64Data = arrayBufferToBase64(arrayBuffer);
      }

      if (!base64Data) {
        throw new Error("Unable to read image data from device.");
      }

      tempItem.status = "PROCESSING";
      onChange([...currentImagesRef]);

      // 2. Transcode & Upload via Floria Backend Image Engine (Sharp WebP Pipeline)
      const cleanFilename = filename || `plant_${Date.now()}.jpg`;
      const res = await api.uploadMediaDirect({
        filename: cleanFilename,
        mimeType: mimeType,
        base64Data: base64Data,
        profile: "PRODUCT",
      });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || "Image engine processing failed on backend.");
      }

      // 3. Attach authoritative backend WebP variant URL
      const { assetId, variants, url } = res.data;
      const resolvedWebpUrl =
        url ||
        variants?.medium ||
        variants?.large ||
        variants?.thumbnail ||
        localUri;

      tempItem.assetId = assetId;
      tempItem.url = resolvedWebpUrl;
      tempItem.status = "READY";
      onChange([...currentImagesRef]);
    } catch (err: any) {
      console.warn("[MobileProductImageUploader] Upload error:", err);
      tempItem.status = "FAILED";
      tempItem.errorMessage = err.message || "Upload failed";
      onChange([...currentImagesRef]);
      Alert.alert("Upload Error", err.message || "Image processing error.");
    }
  };

  // Multiple selection from gallery with 4:3 aspect ratio and 5 image limit
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
        aspect: [4, 3], // 4:3 Botanical ratio
        quality: 0.85,
        base64: true, // Direct base64 for instant backend upload
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setActiveUploading(true);
        const currentList = [...images];
        const selectedAssets = result.assets.slice(0, availableSlots);

        // Upload selected images concurrently
        await Promise.all(
          selectedAssets.map((asset, idx) =>
            uploadSingleAsset(
              asset.uri,
              asset.fileName || `plant_${Date.now()}_${idx}.jpg`,
              asset.mimeType || "image/jpeg",
              asset.base64,
              currentList,
              idx,
            ),
          ),
        );
        setActiveUploading(false);
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
        allowsEditing: true, // Crop option with exact 4:3 dimension
        aspect: [4, 3], // Perfect 4:3 ratio matching Floria product card specs
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setActiveUploading(true);
        const currentList = [...images];
        const asset = result.assets[0];
        await uploadSingleAsset(
          asset.uri,
          `camera_plant_${Date.now()}.jpg`,
          asset.mimeType || "image/jpeg",
          asset.base64,
          currentList,
          0,
        );
        setActiveUploading(false);
      }
    } catch (err: any) {
      setActiveUploading(false);
      Alert.alert("Camera Error", err.message || "Failed to open device camera.");
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
          const isProcessing = item.status === "UPLOADING" || item.status === "PROCESSING";
          const isFailed = item.status === "FAILED";

          return (
            <View key={index} style={styles.imageCard}>
              <Image source={{ uri: item.url }} style={styles.thumbnail} />

              {/* Cover Badge */}
              {item.isPrimary && !isProcessing && (
                <View style={styles.primaryBadge}>
                  <Ionicons name="star" size={10} color="#FFFFFF" />
                  <Text style={styles.primaryBadgeText}>Cover</Text>
                </View>
              )}

              {/* Uploading/Processing Overlay */}
              {isProcessing && (
                <View style={styles.overlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.overlayText}>
                    {item.status === "UPLOADING" ? "Uploading..." : "Converting WebP..."}
                  </Text>
                </View>
              )}

              {/* Failed Overlay */}
              {isFailed && (
                <View style={[styles.overlay, { backgroundColor: "rgba(220, 38, 38, 0.85)" }]}>
                  <Ionicons name="alert-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.overlayText}>Failed</Text>
                </View>
              )}

              {/* Action Buttons */}
              {!isProcessing && (
                <View style={styles.cardActions}>
                  {!item.isPrimary && !isFailed && (
                    <TouchableOpacity
                      onPress={() => handleSetPrimary(index)}
                      style={styles.actionCircle}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="star-outline" size={14} color={Colors.forest} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => handleRemove(index)}
                    style={[styles.actionCircle, { backgroundColor: "#FEE2E2" }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={14} color={Colors.error} />
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
                  <Ionicons name="camera" size={22} color={Colors.forest} />
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
                <Ionicons name="close" size={24} color={Colors.ink} />
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
                <Ionicons name="images" size={22} color={Colors.forest} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Select from Photo Gallery</Text>
                <Text style={styles.optionDesc}>
                  Pick up to {maxImages - images.length} photos at once from your phone
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
            </TouchableOpacity>

            {/* Option 2: Camera with 4:3 Crop Box */}
            <TouchableOpacity
              onPress={handleTakePhoto}
              style={styles.optionRow}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: "#E0F2FE" }]}>
                <Ionicons name="camera" size={22} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Take Live Photo (4:3 Crop)</Text>
                <Text style={styles.optionDesc}>
                  Capture fresh specimen directly in your nursery with 4:3 crop box
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.inkMuted} />
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
