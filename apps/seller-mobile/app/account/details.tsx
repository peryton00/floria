import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";

export default function NurseryDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller, refreshProfile } = useSellerAuth();
  const { showSuccess, showError } = useSellerFeedback();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State initialized with existing seller profile
  const [businessName, setBusinessName] = useState(seller?.businessName || "");
  const [phone, setPhone] = useState(seller?.phone || "");
  const [address, setAddress] = useState(seller?.address || "");
  const [city, setCity] = useState(seller?.city || "");
  const [stateName, setStateName] = useState(seller?.state || "");
  const [postalCode, setPostalCode] = useState(seller?.postalCode || "");
  const [gstNumber, setGstNumber] = useState(seller?.gstNumber || "");
  const [businessDescription, setBusinessDescription] = useState(
    seller?.businessDescription || "",
  );

  // Fetch fresh profile on mount to ensure latest details are populated
  useEffect(() => {
    async function loadFreshDetails() {
      try {
        setLoading(true);
        const res = await api.getSellerProfile();
        if (res.success && res.data) {
          const p = res.data;
          if (p.business_name) setBusinessName(p.business_name);
          if (p.contact_phone) setPhone(p.contact_phone);
          if (p.address) setAddress(p.address);
          if (p.city) setCity(p.city);
          if (p.state) setStateName(p.state);
          if (p.pincode || p.postal_code) setPostalCode(p.pincode || p.postal_code || "");
          if (p.gst_number) setGstNumber(p.gst_number);
          if (p.business_description) setBusinessDescription(p.business_description);
        }
      } catch (err) {
        console.warn("[NurseryDetailsScreen] Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFreshDetails();
  }, []);

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert("Required", "Please enter your nursery or business name.");
      return;
    }

    try {
      setSaving(true);
      const updates = {
        business_name: businessName.trim(),
        contact_phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: postalCode.trim(),
        postal_code: postalCode.trim(),
        gst_number: gstNumber.trim() || undefined,
        business_description: businessDescription.trim(),
      };

      const res = await api.updateSellerProfile(updates);
      if (res.success) {
        await refreshProfile();
        showSuccess("Nursery details updated successfully.");
        router.back();
      } else {
        const msg = res.error?.message || "Failed to update nursery details.";
        showError(msg);
        Alert.alert("Update Failed", msg);
      }
    } catch (err: any) {
      const msg = err.message || "Failed to save profile changes.";
      showError(msg);
      Alert.alert("Update Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const isVerified = seller?.status === "approved" || seller?.status === "active";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.forest} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Nursery Details</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.forest} />
          <Text style={styles.loadingText}>Loading nursery profile...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Status & ID Badge Card */}
          <View style={styles.badgeCard}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.statusPill,
                  isVerified ? styles.statusVerified : styles.statusPending,
                ]}
              >
                <Ionicons
                  name={isVerified ? "shield-checkmark" : "time-outline"}
                  size={14}
                  color={isVerified ? Colors.forest : "#B45309"}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    isVerified ? styles.textVerified : styles.textPending,
                  ]}
                >
                  {isVerified ? "Verified Nursery" : "Verification Pending"}
                </Text>
              </View>

              {seller?.publicSellerId && (
                <View style={styles.idBadge}>
                  <Text style={styles.idBadgeLabel}>SELLER ID</Text>
                  <Text style={styles.idBadgeValue}>{seller.publicSellerId}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Section 1: Business Identity ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Business Identity</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Nursery / Business Name *</Text>
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Green Leaf Botanical Gardens"
                placeholderTextColor={Colors.inkSubtle}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>About / Nursery Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={businessDescription}
                onChangeText={setBusinessDescription}
                placeholder="Specializing in indoor exotics, hardy succulents, and organic nursery saplings..."
                placeholderTextColor={Colors.inkSubtle}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* ── Section 2: Contact & Account Details ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Contact & Communication</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Registered Account Email</Text>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={seller?.email || ""}
                editable={false}
              />
              <Text style={styles.helperText}>
                Primary login credential. Managed via Floria Partner Support.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contact Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={Colors.inkSubtle}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* ── Section 3: Nursery Location & Dispatch ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Nursery Address & Dispatch</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="12, Nursery Lane, Botanical Zone"
                placeholderTextColor={Colors.inkSubtle}
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Raipur"
                  placeholderTextColor={Colors.inkSubtle}
                />
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={stateName}
                  onChangeText={setStateName}
                  placeholder="Chhattisgarh"
                  placeholderTextColor={Colors.inkSubtle}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Postal PIN Code</Text>
              <TextInput
                style={styles.input}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="492001"
                placeholderTextColor={Colors.inkSubtle}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          {/* ── Section 4: Tax & Compliance ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Tax & Compliance</Text>

            <View style={styles.field}>
              <Text style={styles.label}>GSTIN (Optional)</Text>
              <TextInput
                style={styles.input}
                value={gstNumber}
                onChangeText={setGstNumber}
                placeholder="22AAAAA0000A1Z5"
                placeholderTextColor={Colors.inkSubtle}
                autoCapitalize="characters"
              />
              <Text style={styles.helperText}>
                Optional for agricultural growers exempt under GST guidelines.
              </Text>
            </View>
          </View>

          {/* Save Action */}
          <Button
            label={saving ? "Saving Changes..." : "Save Nursery Details"}
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
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
  topBarTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.forest,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  badgeCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  statusVerified: {
    backgroundColor: "#DCFCE7",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusPillText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
  },
  textVerified: {
    color: Colors.forest,
  },
  textPending: {
    color: "#B45309",
  },
  idBadge: {
    alignItems: "flex-end",
  },
  idBadgeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.inkMuted,
    letterSpacing: 0.5,
  },
  idBadgeValue: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.forest,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  sectionCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "700",
    color: Colors.forest,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
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
  readOnlyInput: {
    backgroundColor: "#F1F5F9",
    color: Colors.inkMuted,
    borderColor: "#E2E8F0",
  },
  helperText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkSubtle,
    marginTop: 4,
  },
  saveButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
});
