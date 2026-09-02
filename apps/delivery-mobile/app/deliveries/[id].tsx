// Floria Delivery Mobile — Delivery Detail & POD Completion Screen
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
  Linking,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
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
import { FloriaIcon } from "../../components/ui/FloriaIcon";
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
      const fileSize = blob.size || 1024 * 500;

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
          "Could not finalize proof of delivery. Please check network and retry.",
      );
    } finally {
      setUploadingPod(false);
      setUploadProgressText("");
    }
  };

  // 3. State Machine Transition Dispatcher
  const handleActionPress = async () => {
    if (!delivery) return;

    if (delivery.status === "assigned") {
      Alert.alert(
        "Confirm Nursery Pickup",
        "Confirm that you have arrived at the nursery, inspected botanical specimen packages, and safely loaded them for dispatch?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm Pickup",
            onPress: async () => {
              const res = await updateStatus("picked_up");
              if (!res.success) {
                Alert.alert(
                  "Status Update Failed",
                  res.error || "Server rejected pickup transition.",
                );
              }
            },
          },
        ],
      );
    } else if (delivery.status === "picked_up") {
      Alert.alert(
        "Depart for Customer",
        "Set order status to 'Out for Delivery' and notify customer of courier arrival?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Start Out for Delivery",
            onPress: async () => {
              const res = await updateStatus("out_for_delivery");
              if (!res.success) {
                Alert.alert(
                  "Status Update Failed",
                  res.error || "Server rejected transit transition.",
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

  // 4. View Saved POD Receipt
  const handleViewPodReceipt = async () => {
    try {
      setLoadingPodReceipt(true);
      const res = await getPod();
      if (res.success && res.data) {
        setPodDetails(res.data);
        setViewPodModalVisible(true);
      } else {
        Alert.alert(
          "Receipt Unavailable",
          res.error || "Could not retrieve proof of delivery asset metadata.",
        );
      }
    } catch (err: any) {
      Alert.alert("Receipt Error", err.message || "Failed to load receipt.");
    } finally {
      setLoadingPodReceipt(false);
    }
  };

  const handleNavigateAddress = (addressStr?: string) => {
    if (!addressStr) return;
    const query = encodeURIComponent(addressStr);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url).catch(() => {
      Alert.alert("Navigation Error", "Could not launch map application.");
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingState message="Loading stop details..." />
      </View>
    );
  }

  if (!delivery) {
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

  const assignedDate = new Date(
    delivery.assigned_at || (delivery as any).createdAt || Date.now(),
  ).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const orderId =
    delivery.order_id?.slice(0, 8).toUpperCase() ||
    (delivery as any).orderId?.slice(0, 8).toUpperCase() ||
    "DISPATCH";

  const pickupFullName =
    (delivery as any).pickupAddress?.fullName ||
    (delivery as any).pickup_address_snapshot?.full_name ||
    "Botanical Nursery Hub";

  const pickupLine1 =
    (delivery as any).pickupAddress?.addressLine1 ||
    (delivery as any).pickup_address_snapshot?.address_line1 ||
    "Nursery Dispatch Facility";

  const pickupCity =
    (delivery as any).pickupAddress?.city ||
    (delivery as any).pickup_address_snapshot?.city ||
    "";

  const dropoffFullName =
    (delivery as any).dropoffAddress?.fullName ||
    (delivery as any).dropoff_address_snapshot?.full_name ||
    "Customer Destination";

  const dropoffLine1 =
    (delivery as any).dropoffAddress?.addressLine1 ||
    (delivery as any).dropoff_address_snapshot?.address_line1 ||
    "Customer Delivery Address";

  const dropoffCity =
    (delivery as any).dropoffAddress?.city ||
    (delivery as any).dropoff_address_snapshot?.city ||
    "";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── 1. Primary Order Header Card ── */}
      <View style={styles.detailCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleGroup}>
            <FloriaIcon
              name="shipping"
              size={20}
              color={theme.colors.forest}
              weight="bold"
            />
            <Text style={styles.orderTitle}>Order #{orderId}</Text>
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
          <Text style={styles.infoLabel}>Assigned At</Text>
          <Text style={styles.infoValue}>{assignedDate}</Text>
        </View>

        {delivery.recipient_name && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Received By</Text>
            <Text style={styles.infoValue}>{delivery.recipient_name}</Text>
          </View>
        )}
      </View>

      {/* ── 2. Route Stops & Navigation ── */}
      {/* Pickup Nursery Card */}
      <View style={styles.stopCard}>
        <View style={styles.stopCardHeader}>
          <View style={styles.stopIconCircle}>
            <FloriaIcon name="hub" size={16} color={theme.colors.forest} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stopBadgeText}>ORIGIN: NURSERY PICKUP</Text>
            <Text style={styles.stopTitle}>{pickupFullName}</Text>
            <Text style={styles.stopSub}>
              {pickupLine1}
              {pickupCity ? `, ${pickupCity}` : ""}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.mapActionBtn}
          onPress={() => {
            const addr = `${pickupLine1}, ${pickupCity}`;
            handleNavigateAddress(addr);
          }}
        >
          <FloriaIcon name="navigation" size={16} color={theme.colors.forest} weight="bold" />
          <Text style={styles.mapActionBtnText}>NAVIGATE TO PICKUP</Text>
        </TouchableOpacity>
      </View>

      {/* Drop-off Customer Destination Card */}
      <View style={styles.stopCard}>
        <View style={styles.stopCardHeader}>
          <View style={[styles.stopIconCircle, { backgroundColor: theme.colors.botanicalGreen }]}>
            <FloriaIcon name="map_pin" size={16} color={theme.colors.forest} weight="fill" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stopBadgeText}>DESTINATION: CUSTOMER DROP-OFF</Text>
            <Text style={styles.stopTitle}>{dropoffFullName}</Text>
            <Text style={styles.stopSub}>
              {dropoffLine1}
              {dropoffCity ? `, ${dropoffCity}` : ""}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.mapActionBtn}
          onPress={() => {
            const addr = `${dropoffLine1}, ${dropoffCity}`;
            handleNavigateAddress(addr);
          }}
        >
          <FloriaIcon name="navigation" size={16} color={theme.colors.forest} weight="bold" />
          <Text style={styles.mapActionBtnText}>NAVIGATE TO CUSTOMER</Text>
        </TouchableOpacity>
      </View>

      {/* ── 3. State Machine Status Guidance & Primary Action ── */}
      <View style={styles.guidanceBox}>
        <FloriaIcon
          name={delivery.status === "delivered" ? "check_circle" : "info"}
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

      {/* State Action Buttons */}
      {delivery.status === "assigned" && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.primaryActionBtn}
          onPress={handleActionPress}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <>
              <FloriaIcon name="hub" size={18} color={theme.colors.white} />
              <Text style={styles.primaryActionBtnText}>CONFIRM NURSERY PICKUP</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {delivery.status === "picked_up" && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.primaryActionBtn}
          onPress={handleActionPress}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <>
              <FloriaIcon name="scooter" size={18} color={theme.colors.white} />
              <Text style={styles.primaryActionBtnText}>START OUT FOR DELIVERY</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {delivery.status === "out_for_delivery" && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.primaryActionBtn}
          onPress={handleActionPress}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <>
              <FloriaIcon name="camera" size={18} color={theme.colors.white} />
              <Text style={styles.primaryActionBtnText}>CAPTURE PROOF OF DELIVERY (POD)</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {delivery.status === "delivered" && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.receiptActionBtn}
          onPress={handleViewPodReceipt}
          disabled={loadingPodReceipt}
        >
          {loadingPodReceipt ? (
            <ActivityIndicator size="small" color={theme.colors.forest} />
          ) : (
            <>
              <FloriaIcon name="orders" size={18} color={theme.colors.forest} />
              <Text style={styles.receiptActionBtnText}>VIEW PROOF OF DELIVERY RECEIPT</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* ── MODAL 1: PROOF OF DELIVERY PREVIEW & CONFIRMATION ── */}
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
                  <FloriaIcon name="close" size={20} color={theme.colors.muted} />
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
                    <FloriaIcon name="camera" size={14} color={theme.colors.forest} />
                    <Text style={styles.retakeText}>RETAKE</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Recipient Preset Chips */}
              <Text style={styles.fieldLabel}>RECIPIENT / HAND-OFF TO</Text>
              <View style={styles.chipRow}>
                {RECIPIENT_PRESETS.map((preset) => {
                  const isSelected = recipientName === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => setRecipientName(preset)}
                      disabled={uploadingPod}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Or type recipient name..."
                placeholderTextColor={theme.colors.muted}
                value={recipientName}
                onChangeText={setRecipientName}
                editable={!uploadingPod}
              />

              {/* Optional Notes */}
              <Text style={[styles.fieldLabel, { marginTop: theme.spacing.md }]}>
                DELIVERY NOTES (OPTIONAL)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g. Left with building security gate, customer verified specimen..."
                placeholderTextColor={theme.colors.muted}
                multiline
                numberOfLines={3}
                value={deliveryNotes}
                onChangeText={setDeliveryNotes}
                editable={!uploadingPod}
              />

              {/* Upload Progress Indicator */}
              {uploadingPod && (
                <View style={styles.progressContainer}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.forest}
                  />
                  <Text style={styles.progressText}>
                    {uploadProgressText}
                  </Text>
                </View>
              )}

              {/* Confirmation CTA */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.primaryActionBtn,
                  { marginTop: theme.spacing.lg },
                  uploadingPod && { opacity: 0.7 },
                ]}
                onPress={handleConfirmAndCompleteDropoff}
                disabled={uploadingPod}
              >
                {uploadingPod ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <>
                    <FloriaIcon name="check_circle" size={18} color={theme.colors.white} />
                    <Text style={styles.primaryActionBtnText}>
                      SUBMIT PROOF & COMPLETE
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: VIEW PROOF OF DELIVERY RECEIPT ── */}
      <Modal
        visible={viewPodModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewPodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Proof of Delivery Record</Text>
              <TouchableOpacity
                onPress={() => setViewPodModalVisible(false)}
              >
                <FloriaIcon name="close" size={20} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            {podDetails && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {podDetails.signedUrl ? (
                  <Image
                    source={{ uri: podDetails.signedUrl }}
                    style={styles.podReceiptImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.receiptPlaceholder}>
                    <FloriaIcon
                      name="check_circle"
                      size={48}
                      color={theme.colors.success}
                    />
                    <Text style={styles.receiptPlaceholderText}>
                      Proof photo archived on Floria Media CDN
                    </Text>
                  </View>
                )}

                <View style={styles.receiptMetadata}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Status</Text>
                    <Text style={styles.receiptValueSuccess}>
                      VERIFIED DELIVERED
                    </Text>
                  </View>
                  <View style={styles.receiptDivider} />
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Recipient</Text>
                    <Text style={styles.receiptValue}>
                      {podDetails.recipientName || "Authorized Recipient"}
                    </Text>
                  </View>
                  <View style={styles.receiptDivider} />
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Timestamp</Text>
                    <Text style={styles.receiptValue}>
                      {new Date(podDetails.deliveredAt || Date.now()).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </Text>
                  </View>
                  {podDetails.notes ? (
                    <>
                      <View style={styles.receiptDivider} />
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Notes</Text>
                        <Text style={styles.receiptValue}>
                          {podDetails.notes}
                        </Text>
                      </View>
                    </>
                  ) : null}
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.primaryActionBtn, { marginTop: theme.spacing.lg }]}
                  onPress={() => setViewPodModalVisible(false)}
                >
                  <Text style={styles.primaryActionBtnText}>DONE</Text>
                </TouchableOpacity>
              </ScrollView>
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
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.charcoal,
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
    marginBottom: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: 13,
    color: theme.colors.muted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.charcoal,
  },
  stopCard: {
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    marginBottom: theme.spacing.md,
  },
  stopCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  stopIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.sand,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stopBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: theme.colors.forest,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  stopTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.charcoal,
  },
  stopSub: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  mapActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: theme.spacing.sm + 2,
    backgroundColor: theme.colors.sand,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.forest,
  },
  mapActionBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.forest,
    letterSpacing: 0.5,
  },
  guidanceBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.sand,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  guidanceText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 17,
  },
  primaryActionBtn: {
    backgroundColor: theme.colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },
  primaryActionBtnText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  receiptActionBtn: {
    backgroundColor: theme.colors.linen,
    borderWidth: 1,
    borderColor: theme.colors.forest,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },
  receiptActionBtnText: {
    color: theme.colors.forest,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30, 58, 43, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: theme.colors.linen,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.forest,
  },
  thumbnailWrapper: {
    position: "relative",
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.md,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: 180,
    backgroundColor: theme.colors.sand,
  },
  retakeFloatingBtn: {
    position: "absolute",
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  retakeText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.forest,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.forest,
    letterSpacing: 0.6,
    marginBottom: theme.spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.sand,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  chipSelected: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.charcoal,
  },
  chipTextSelected: {
    color: theme.colors.white,
  },
  input: {
    backgroundColor: theme.colors.sand,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    fontSize: 13,
    color: theme.colors.charcoal,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.sand,
    borderRadius: theme.radius.sm,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.forest,
    fontWeight: "600",
  },
  podReceiptImage: {
    width: "100%",
    height: 220,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
  },
  receiptPlaceholder: {
    height: 160,
    backgroundColor: theme.colors.sand,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  receiptPlaceholderText: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  receiptMetadata: {
    backgroundColor: theme.colors.sand,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  receiptLabel: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  receiptValue: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.charcoal,
  },
  receiptValueSuccess: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.success,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: 4,
  },
});
