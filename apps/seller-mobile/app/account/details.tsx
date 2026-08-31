import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloriaIcon } from "@floria/icons";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { Button } from "../../components/ui/Button";

export default function NurseryDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller, refreshProfile } = useSellerAuth();
  const { showSuccess, showError } = useSellerFeedback();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [gstin, setGstin] = useState("");

  const populateForm = useCallback((data: any) => {
    if (!data) return;
    setBusinessName(data.businessName || data.business_name || "");
    setContactName(data.contactName || data.contact_name || "");
    setPhone(data.phone || data.contact_phone || "");
    setDescription(data.description || data.business_description || "");

    const addr = data.pickupAddress || data.pickup_address || {};
    setAddressLine1(addr.line1 || addr.address_line1 || data.address || "");
    setAddressLine2(addr.line2 || addr.address_line2 || "");
    setCity(addr.city || data.city || "");
    setState(addr.state || data.state || "");
    setPostalCode(addr.pincode || addr.postal_code || data.postal_code || "");

    setPanNumber(data.panNumber || data.pan_number || "");
    setGstin(data.gstin || data.gst_number || "");
  }, []);

  useEffect(() => {
    async function loadFreshDetails() {
      try {
        setLoading(true);
        const res = await api.getSellerProfile();
        if (res.success && res.data) {
          populateForm(res.data);
        } else if (seller) {
          populateForm(seller);
        }
      } catch (err) {
        console.warn("[NurseryDetailsScreen] Profile fetch error:", err);
        if (seller) populateForm(seller);
      } finally {
        setLoading(false);
      }
    }
    loadFreshDetails();
  }, [seller, populateForm]);

  const handleSave = async () => {
    if (!businessName.trim()) {
      showError("Nursery Name is required.");
      return;
    }
    if (!phone.trim()) {
      showError("Contact Phone is required.");
      return;
    }
    if (!addressLine1.trim() || !city.trim() || !postalCode.trim()) {
      showError("Please fill out complete nursery address details.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        business_name: businessName.trim(),
        contact_name: contactName.trim() || undefined,
        phone: phone.trim(),
        contact_phone: phone.trim(),
        description: description.trim() || undefined,
        business_description: description.trim() || undefined,
        pickup_address: {
          line1: addressLine1.trim(),
          line2: addressLine2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          pincode: postalCode.trim(),
        },
        address: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        pincode: postalCode.trim(),
        pan_number: panNumber.trim() || undefined,
        gst_number: gstin.trim() || undefined,
        gstin: gstin.trim() || undefined,
      };

      const res = await api.updateSellerProfile(payload);
      if (res.success) {
        showSuccess("Nursery details updated successfully.");
        await refreshProfile();
        router.back();
      } else {
        showError(res.error?.message || "Failed to update nursery details.");
      }
    } catch (err: any) {
      showError(err.message || "Failed to update nursery details.");
    } finally {
      setSaving(false);
    }
  };

  const isVerified =
    seller?.status === "approved" || seller?.status === "active";

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
          <FloriaIcon name="arrow_left" size={20} color={Colors.forest} />
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
                <FloriaIcon
                  name={isVerified ? "check_circle" : "clock"}
                  size={14}
                  color={isVerified ? Colors.forest : "#B45309"}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    isVerified ? styles.textVerified : styles.textPending,
                  ]}
                >
                  {isVerified ? "Verified Partner ✓" : "Pending Verification"}
                </Text>
              </View>

              {seller?.publicSellerId ? (
                <View style={styles.idWrap}>
                  <Text style={styles.idLabel}>ID:</Text>
                  <Text style={styles.idValue}>{seller.publicSellerId}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Section 1: Basic Nursery Information */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Basic Information</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Nursery / Business Name *</Text>
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Green Leaf Botanical Nursery"
                placeholderTextColor={Colors.inkLight}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Proprietor / Contact Person</Text>
              <TextInput
                style={styles.input}
                value={contactName}
                onChangeText={setContactName}
                placeholder="e.g. Ramesh Chandra"
                placeholderTextColor={Colors.inkLight}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contact Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={Colors.inkLight}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Botanical Nursery Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your nursery specialties, plant care, climate zones, etc."
                placeholderTextColor={Colors.inkLight}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Section 2: Nursery Pickup Address */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Pickup & Nursery Address</Text>
            <Text style={styles.sectionSub}>
              Courier partners will arrive at this physical location to pick up dispatched plant orders.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Address Line 1 *</Text>
              <TextInput
                style={styles.input}
                value={addressLine1}
                onChangeText={setAddressLine1}
                placeholder="Plot / Survey No., Street Name"
                placeholderTextColor={Colors.inkLight}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Address Line 2 (Optional)</Text>
              <TextInput
                style={styles.input}
                value={addressLine2}
                onChangeText={setAddressLine2}
                placeholder="Landmark, Area, Sector"
                placeholderTextColor={Colors.inkLight}
              />
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Bengaluru"
                  placeholderTextColor={Colors.inkLight}
                />
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>State *</Text>
                <TextInput
                  style={styles.input}
                  value={state}
                  onChangeText={setState}
                  placeholder="e.g. Karnataka"
                  placeholderTextColor={Colors.inkLight}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PIN / Postal Code *</Text>
              <TextInput
                style={styles.input}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="e.g. 560001"
                placeholderTextColor={Colors.inkLight}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Section 3: Tax & Legal Identifiers */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Tax & Compliance Identifiers</Text>

            <View style={styles.field}>
              <Text style={styles.label}>PAN Number</Text>
              <TextInput
                style={styles.input}
                value={panNumber}
                onChangeText={setPanNumber}
                placeholder="ABCDE1234F"
                placeholderTextColor={Colors.inkLight}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>GSTIN (Optional for small nurseries)</Text>
              <TextInput
                style={styles.input}
                value={gstin}
                onChangeText={setGstin}
                placeholder="29ABCDE1234F1Z5"
                placeholderTextColor={Colors.inkLight}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Save Action Button */}
          <Button
            label={saving ? "Saving Changes..." : "Save Nursery Details"}
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: Spacing.sm }}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  badgeCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusVerified: {
    backgroundColor: "#DCFCE7",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  textVerified: {
    color: Colors.forest,
  },
  textPending: {
    color: "#B45309",
  },
  idWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  idLabel: {
    fontSize: 11,
    color: Colors.inkLight,
  },
  idValue: {
    fontSize: 11,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.forest,
  },
  sectionCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeading: {
    fontFamily: "Georgia",
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.forest,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginBottom: Spacing.md,
  },
  field: {
    marginBottom: Spacing.md,
  },
  twoColRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.page,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
});
