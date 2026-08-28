// Floria Delivery Mobile — Delivery Detail & POD Completion Screen (Step 5B.3)
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useDeliveryDetail } from "../../lib/hooks/useDeliveries";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { theme } from "../../lib/theme";
import {
  Card,
  Button,
  StatusBadge,
  LoadingState,
  ErrorState,
} from "../../components/ui";
import type {
  DeliveryAssignmentStatus,
  DeliveryPodDetails,
} from "@floria/types";

const RECIPIENT_PRESETS = [
  "Customer",
  "Security / Guard",
  "Doorstep / Porch",
  "Family Member",
];

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    delivery,
    loading,
    updating,
    error,
    updateStatus,
    completeWithPod,
    getPod,
    refresh,
  } = useDeliveryDetail(id);

  // POD Capture & Confirmation Modal State
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [podModalVisible, setPodModalVisible] = useState(false);
  const [uploadingPod, setUploadingPod] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  // POD Receipt View Modal State
  const [viewPodModalVisible, setViewPodModalVisible] = useState(false);
  const [loadingPodReceipt, setLoadingPodReceipt] = useState(false);
  const [podDetails, setPodDetails] = useState<DeliveryPodDetails | null>(null);

  // 1. Camera Launch & Permission Handling
  const handleLaunchCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Floria Delivery requires camera access to capture photographic proof of delivery at customer drop-off.",
          [{ text: "OK" }],
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedPhotoUri(result.assets[0].uri);
        setPodModalVisible(true);
      }
    } catch (err: any) {
      Alert.alert(
        "Camera Error",
        err.message || "Failed to open device camera viewfinder.",
      );
    }
  };

  // 2. Upload POD Binary and Atomically Complete Delivery
  const handleConfirmAndCompleteDropoff = async () => {
    if (!capturedPhotoUri || !delivery || uploadingPod) return;

    try {
      setUploadingPod(true);
      setUploadProgressText("Preparing proof of delivery photo...");

      // A. Fetch local image binary
      const response = await fetch(capturedPhotoUri);
      const blob = await response.blob();
      const fileSize = blob.size || 1024 * 500; // fallback estimate

      // B. Create upload session in media-staging
      setUploadProgressText("Requesting secure upload session...");
      const sessionRes = await api.createUploadSession({
        profile: "DELIVERY_POD",
        filename: `pod_${delivery.id.substring(0, 8)}.jpg`,
        mimeType: "image/jpeg",
        sizeBytes: fileSize,
      });

      if (!sessionRes.success || !sessionRes.data) {
        throw new Error(
          sessionRes.error?.message || "Failed to create upload session",
        );
      }

      const { sessionId, stagingPath } = sessionRes.data;

      // C. Upload binary directly to Supabase Storage media-staging
      setUploadProgressText("Uploading proof of delivery to secure staging...");
      const { error: uploadError } = await supabase.storage
        .from("media-staging")
        .upload(stagingPath, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // D. Complete Upload Session (Triggers ImageEngine WebP conversion)
      setUploadProgressText("Verifying image & processing WebP transcode...");
      const completeRes = await api.completeUploadSession(sessionId);
      if (!completeRes.success || !completeRes.data) {
        throw new Error(
          completeRes.error?.message || "Media processing failed",
        );
      }

      const assetId = completeRes.data.assetId;

      // E. Atomically Finalize Delivery on Server
      setUploadProgressText("Finalizing delivery status on Floria network...");
      const finalizeRes = await completeWithPod({
        podAssetId: assetId,
        recipientName: recipientName.trim() || undefined,
        notes: deliveryNotes.trim() || undefined,
      });

      if (!finalizeRes.success) {
        throw new Error(
          finalizeRes.error || "Server rejected delivery completion",
        );
      }

      // F. Success cleanup
      setPodModalVisible(false);
      setCapturedPhotoUri(null);
      setRecipientName("");
      setDeliveryNotes("");

      Alert.alert(
        "Delivery Completed!",
        "Proof of delivery recorded and order finalized successfully.",
      );
    } catch (err: any) {
      Alert.alert(
        "Delivery Completion Failed",
        err.message ||
          "An unexpected error occurred while uploading POD. Tap Retry to try again without retaking the photo.",
        [{ text: "OK" }],
      );
    } finally {
      setUploadingPod(false);
      setUploadProgressText("");
    }
  };

  // 3. View POD Signed URL Receipt
  const handleViewPodReceipt = async () => {
    try {
      setLoadingPodReceipt(true);
      const res = await getPod();
      if (res.success && res.data) {
        setPodDetails(res.data);
        setViewPodModalVisible(true);
      } else {
        Alert.alert(
          "Error",
          res.error || "Could not load proof of delivery receipt.",
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Network error loading receipt.");
    } finally {
      setLoadingPodReceipt(false);
    }
  };

  // 4. Standard Intermediate Transitions (assigned -> picked_up -> out_for_delivery)
  const handleActionPress = () => {
    if (!delivery) return;

    if (delivery.status === "assigned") {
      Alert.alert(
        "Confirm Nursery Pickup",
        "Have you collected and verified all botanical items for this order from the nursery partner?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            onPress: async () => {
              const res = await updateStatus("picked_up");
              if (!res.success) {
                Alert.alert(
                  "Status Update Failed",
                  res.error || "Transition rejected",
                );
              }
            },
          },
        ],
      );
    } else if (delivery.status === "picked_up") {
      Alert.alert(
        "Start Delivery Transit",
        "Are you ready to depart for the customer's delivery destination?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            onPress: async () => {
              const res = await updateStatus("out_for_delivery");
              if (!res.success) {
                Alert.alert(
                  "Status Update Failed",
                  res.error || "Transition rejected",
                );
              }
            },
          },
        ],
      );
    } else if (delivery.status === "out_for_delivery") {
      handleLaunchCamera();
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingState message="Loading stop details..." />
      </View>
    );
  }

  if (error || !delivery) {
    return (
      <View style={styles.centerContainer}>
        <ErrorState
          title="Stop Not Found"
          message={
            error ||
            "Could not locate this delivery assignment in the active manifest."
          }
          onRetry={refresh}
        />
      </View>
    );
  }

  const assignedDate = new Date(delivery.assigned_at).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Primary Detail Card */}
      <Card style={styles.detailCard} variant="elevated">
        <View style={styles.cardHeader}>
          <View style={styles.titleGroup}>
            <MaterialIcons
              name="local-shipping"
              size={20}
              color={theme.colors.forest}
            />
            <Text style={styles.orderTitle}>Order #{delivery.order_id}</Text>
          </View>
          <StatusBadge status={delivery.status} />
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assignment ID</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {delivery.id}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Courier</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {delivery.assigned_to}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned At</Text>
          <Text style={styles.infoValue}>{assignedDate}</Text>
        </View>

        {delivery.picked_up_at && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Picked Up At</Text>
            <Text style={styles.infoValue}>
              {new Date(delivery.picked_up_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}

        {delivery.out_for_delivery_at && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>In Transit Since</Text>
            <Text style={styles.infoValue}>
              {new Date(delivery.out_for_delivery_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}

        {delivery.delivered_at && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivered At</Text>
            <Text style={styles.infoValue}>
              {new Date(delivery.delivered_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}

        {delivery.recipient_name && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Received By</Text>
            <Text style={styles.infoValue}>{delivery.recipient_name}</Text>
          </View>
        )}

        {delivery.pod_notes && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery Notes</Text>
            <Text style={styles.infoValue}>{delivery.pod_notes}</Text>
          </View>
        )}
      </Card>

      {/* State Machine Status Guidance */}
      <View style={styles.guidanceBox}>
        <MaterialIcons
          name={delivery.status === "delivered" ? "verified" : "info-outline"}
          size={18}
          color={
            delivery.status === "delivered"
              ? theme.colors.success
              : theme.colors.muted
          }
        />
        <Text style={styles.guidanceText}>
          {delivery.status === "assigned"
            ? "Next step: Visit the nursery partner to inspect and pick up the plant package."
            : delivery.status === "picked_up"
              ? "Package is verified. Tap below when departing for customer address."
              : delivery.status === "out_for_delivery"
                ? "You are en route. Take a Proof of Delivery photo to complete customer hand-off."
                : delivery.status === "delivered"
                  ? "This delivery is finalized with verified Proof of Delivery."
                  : "This assignment is closed."}
        </Text>
      </View>

      {/* Action Affordance */}
      {delivery.status === "assigned" && (
        <Button
          label="CONFIRM NURSERY PICKUP"
          onPress={handleActionPress}
          variant="primary"
          size="lg"
          loading={updating}
          disabled={updating}
          icon={
            <MaterialIcons
              name="storefront"
              size={18}
              color={theme.colors.white}
            />
          }
        />
      )}

      {delivery.status === "picked_up" && (
        <Button
          label="START OUT FOR DELIVERY"
          onPress={handleActionPress}
          variant="primary"
          size="lg"
          loading={updating}
          disabled={updating}
          icon={
            <MaterialIcons
              name="directions-bike"
              size={18}
              color={theme.colors.white}
            />
          }
        />
      )}

      {delivery.status === "out_for_delivery" && (
        <Button
          label="CAPTURE PROOF OF DELIVERY"
          onPress={handleActionPress}
          variant="primary"
          size="lg"
          loading={updating}
          disabled={updating}
          icon={
            <MaterialIcons
              name="photo-camera"
              size={18}
              color={theme.colors.white}
            />
          }
        />
      )}

      {delivery.status === "delivered" && delivery.pod_asset_id && (
        <Button
          label="VIEW PROOF OF DELIVERY RECEIPT"
          onPress={handleViewPodReceipt}
          variant="secondary"
          size="md"
          loading={loadingPodReceipt}
          disabled={loadingPodReceipt}
          icon={
            <MaterialIcons
              name="receipt-long"
              size={18}
              color={theme.colors.forest}
            />
          }
        />
      )}

      {/* ── MODAL 1: PROOF OF DELIVERY PREVIEW & CONFIRMATION ──────────────── */}
      <Modal
        visible={podModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !uploadingPod && setPodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Proof of Delivery</Text>
              {!uploadingPod && (
                <TouchableOpacity onPress={() => setPodModalVisible(false)}>
                  <MaterialIcons
                    name="close"
                    size={24}
                    color={theme.colors.muted}
                  />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo Thumbnail */}
              {capturedPhotoUri && (
                <View style={styles.thumbnailWrapper}>
                  <Image
                    source={{ uri: capturedPhotoUri }}
                    style={styles.thumbnail}
                  />
                  <TouchableOpacity
                    style={styles.retakeFloatingBtn}
                    onPress={handleLaunchCamera}
                    disabled={uploadingPod}
                  >
                    <MaterialIcons
                      name="refresh"
                      size={16}
                      color={theme.colors.forest}
                    />
                    <Text style={styles.retakeText}>RETAKE</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Recipient Preset Chips */}
              <Text style={styles.fieldLabel}>
                RECIPIENT / DROP-OFF LOCATION
              </Text>
              <View style={styles.presetRow}>
                {RECIPIENT_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetChip,
                      recipientName === preset && styles.presetChipActive,
                    ]}
                    onPress={() => setRecipientName(preset)}
                    disabled={uploadingPod}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        recipientName === preset && styles.presetChipTextActive,
                      ]}
                    >
                      {preset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Recipient Name Input */}
              <TextInput
                style={styles.textInput}
                placeholder="Or type custom recipient name..."
                placeholderTextColor={theme.colors.muted}
                value={recipientName}
                onChangeText={setRecipientName}
                editable={!uploadingPod}
              />

              {/* Delivery Notes */}
              <Text style={styles.fieldLabel}>DELIVERY NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="e.g. Left behind potted ficus by front porch gate..."
                placeholderTextColor={theme.colors.muted}
                value={deliveryNotes}
                onChangeText={setDeliveryNotes}
                multiline
                numberOfLines={3}
                editable={!uploadingPod}
              />

              {/* Uploading Activity Indicator */}
              {uploadingPod ? (
                <View style={styles.uploadProgressContainer}>
                  <ActivityIndicator size="small" color={theme.colors.forest} />
                  <Text style={styles.uploadProgressText}>
                    {uploadProgressText}
                  </Text>
                </View>
              ) : (
                <Button
                  label="CONFIRM & COMPLETE DROP-OFF"
                  onPress={handleConfirmAndCompleteDropoff}
                  variant="primary"
                  size="lg"
                  style={styles.submitDropoffBtn}
                  icon={
                    <MaterialIcons
                      name="check-circle"
                      size={18}
                      color={theme.colors.white}
                    />
                  }
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: VIEW PROOF OF DELIVERY RECEIPT ────────────────────────── */}
      <Modal
        visible={viewPodModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setViewPodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verified Proof of Delivery</Text>
              <TouchableOpacity onPress={() => setViewPodModalVisible(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.colors.muted}
                />
              </TouchableOpacity>
            </View>

            {podDetails?.signedUrl ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                  source={{ uri: podDetails.signedUrl }}
                  style={styles.receiptImage}
                  resizeMode="cover"
                />

                <View style={styles.receiptMetaBox}>
                  {podDetails.recipientName && (
                    <View style={styles.receiptMetaRow}>
                      <Text style={styles.receiptLabel}>Handed To:</Text>
                      <Text style={styles.receiptValue}>
                        {podDetails.recipientName}
                      </Text>
                    </View>
                  )}
                  {podDetails.deliveredAt && (
                    <View style={styles.receiptMetaRow}>
                      <Text style={styles.receiptLabel}>Completed At:</Text>
                      <Text style={styles.receiptValue}>
                        {new Date(podDetails.deliveredAt).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </Text>
                    </View>
                  )}
                  {podDetails.notes && (
                    <View style={styles.receiptMetaRow}>
                      <Text style={styles.receiptLabel}>Notes:</Text>
                      <Text style={styles.receiptValue}>
                        {podDetails.notes}
                      </Text>
                    </View>
                  )}
                  <View style={styles.receiptMetaRow}>
                    <Text style={styles.receiptLabel}>
                      Signed Token Expiry:
                    </Text>
                    <Text style={styles.receiptValue}>
                      {new Date(podDetails.expiresAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <LoadingState message="Loading POD photo..." />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.cream,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  detailCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orderTitle: {
    ...theme.typography.title,
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.xs + 2,
  },
  infoLabel: {
    ...theme.typography.caption,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.charcoal,
    maxWidth: 200,
  },
  guidanceBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  guidanceText: {
    flex: 1,
    ...theme.typography.caption,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.charcoal,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30, 58, 43, 0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: theme.colors.linen,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    maxHeight: "88%",
  },
  receiptCard: {
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    margin: theme.spacing.lg,
    maxHeight: "85%",
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    ...theme.typography.title,
    fontSize: 18,
  },
  thumbnailWrapper: {
    position: "relative",
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  thumbnail: {
    width: "100%",
    height: 220,
  },
  retakeFloatingBtn: {
    position: "absolute",
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radius.full,
    gap: 4,
    ...theme.shadows.sm,
  },
  retakeText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  fieldLabel: {
    ...theme.typography.sectionLabel,
    fontSize: 10,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  presetChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.inputSand,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  presetChipActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.charcoal,
  },
  presetChipTextActive: {
    color: theme.colors.white,
  },
  textInput: {
    backgroundColor: theme.colors.inputSand,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 13,
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.md,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
  uploadProgressContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  uploadProgressText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.forest,
  },
  submitDropoffBtn: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  receiptImage: {
    width: "100%",
    height: 240,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  receiptMetaBox: {
    backgroundColor: theme.colors.inputSand,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  receiptMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    ...theme.typography.caption,
    fontSize: 11,
    fontWeight: "600",
  },
  receiptValue: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.charcoal,
    maxWidth: 180,
  },
});
