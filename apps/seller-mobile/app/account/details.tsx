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
import { FloriaIcon } from "../../components/ui/FloriaIcon";
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
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [gstin, setGstin] = useState("");
  const [description, setDescription] = useState("");
  const [specialties, setSpecialties] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSellerProfile();
      if (res.success && res.data) {
        const s = res.data;
        setBusinessName(s.businessName || s.business_name || "");
        setContactName(s.contactName || s.contact_name || "");
        setPhone(s.phone || "");
        setEmail(s.email || "");
        setAddressLine1(s.addressLine1 || s.address_line1 || "");
        setAddressLine2(s.addressLine2 || s.address_line2 || "");
        setCity(s.city || "");
        setStateVal(s.state || "");
        setPostalCode(s.postalCode || s.postal_code || "");
        setPanNumber(s.panNumber || s.pan_number || "");
        setGstin(s.gstin || s.gstNumber || s.gst_number || "");
        setDescription(s.description || "");
        setSpecialties(
          Array.isArray(s.specialties)
            ? s.specialties.join(", ")
            : s.specialties || "",
        );
      }
    } catch (err) {
      console.warn("[NurseryDetails] Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!businessName.trim()) {
      showError("Nursery/Business name is required.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        business_name: businessName.trim(),
        contact_name: contactName.trim(),
        phone: phone.trim(),
        address_line1: addressLine1.trim(),
        city: city.trim(),
        state: stateVal.trim(),
        postal_code: postalCode.trim(),
        description: description.trim(),
        specialties: specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
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
      showError(err.message || "An unexpected error occurred.");
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
                  value={stateVal}
                  onChangeText={setStateVal}
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
