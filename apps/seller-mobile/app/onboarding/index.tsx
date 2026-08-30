import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { Button } from "../../components/ui/Button";

const ONBOARDING_STEPS = [
  { id: 1, title: "Business Details" },
  { id: 2, title: "Owner & Contact" },
  { id: 3, title: "Nursery Location" },
  { id: 4, title: "Settlement Setup" },
  { id: 5, title: "Review & Submit" },
];

export default function SellerOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller, refreshProfile } = useSellerAuth();
  const { showSuccess, showError } = useSellerFeedback();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Form Fields
  const [businessName, setBusinessName] = useState<string>("");
  const [businessDescription, setBusinessDescription] = useState<string>("");
  const [businessType, setBusinessType] = useState<string>("Botanical Nursery");

  const [ownerName, setOwnerName] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");

  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("Raipur");
  const [state, setState] = useState<string>("Chhattisgarh");
  const [postalCode, setPostalCode] = useState<string>("492001");

  const [bankAccount, setBankAccount] = useState<string>("");
  const [ifscCode, setIfscCode] = useState<string>("");
  const [accountHolderName, setAccountHolderName] = useState<string>("");

  // Pre-fill from existing seller state
  useEffect(() => {
    if (seller) {
      if (seller.businessName && seller.businessName !== "Nursery Partner" && seller.businessName !== "New Nursery") {
        setBusinessName(seller.businessName);
      }
      if (seller.businessDescription) setBusinessDescription(seller.businessDescription);
      if (seller.email) setContactEmail(seller.email);
      if (seller.phone) setContactPhone(seller.phone);
      if (seller.address) setAddress(seller.address);
      if (seller.city) setCity(seller.city);
      if (seller.state) setState(seller.state);
      if (seller.postalCode) setPostalCode(seller.postalCode);
    }
  }, [seller]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!businessName.trim()) {
        showError("Please enter your Nursery / Business name.");
        return;
      }
    } else if (currentStep === 2) {
      if (!contactPhone.trim()) {
        showError("Please enter a valid contact phone number.");
        return;
      }
    } else if (currentStep === 3) {
      if (!address.trim() || !postalCode.trim()) {
        showError("Please enter complete address and PIN code.");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(ONBOARDING_STEPS.length, prev + 1));
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmitApplication = async () => {
    try {
      setLoading(true);
      const payload = {
        business_name: businessName.trim(),
        business_description: businessDescription.trim() || "Registered Floria botanical nursery partner.",
        business_type: businessType,
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        settlement_account: {
          bank_account_number: bankAccount.trim() || undefined,
          ifsc_code: ifscCode.trim().toUpperCase() || undefined,
          account_holder_name: accountHolderName.trim() || undefined,
        },
      };

      const res = await api.submitSellerApplication(payload);
      if (res.success) {
        showSuccess("Nursery partner application submitted for review!");
        await refreshProfile();
        router.replace("/(tabs)" as any);
      } else {
        showError(res.error?.message || "Failed to submit application.");
      }
    } catch (err: any) {
      showError(err.message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Staged Header ── */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.forest} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Onboarding</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* ── Stepper Indicator ── */}
      <View style={styles.stepperWrap}>
        <View style={styles.stepperTrack}>
          {ONBOARDING_STEPS.map((s, idx) => {
            const isCompleted = idx + 1 < currentStep;
            const isCurrent = idx + 1 === currentStep;
            return (
              <React.Fragment key={s.id}>
                <View
                  style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCircleCompleted,
                    isCurrent && styles.stepCircleCurrent,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={12} color={Colors.white} />
                  ) : (
                    <Text
                      style={[
                        styles.stepNum,
                        isCurrent && styles.stepNumCurrent,
                      ]}
                    >
                      {s.id}
                    </Text>
                  )}
                </View>
                {idx < ONBOARDING_STEPS.length - 1 && (
                  <View
                    style={[
                      styles.stepConnector,
                      idx + 1 < currentStep && styles.stepConnectorActive,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
        <Text style={styles.stepTitleText}>
          Step {currentStep}: {ONBOARDING_STEPS[currentStep - 1].title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* ── STEP 1: Business Details ── */}
        {currentStep === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Nursery Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nursery / Business Name *</Text>
              <TextInput
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Green Leaf Botanical Nursery"
                placeholderTextColor={Colors.inkSubtle}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Type</Text>
              <TextInput
                value={businessType}
                onChangeText={setBusinessType}
                placeholder="Botanical Nursery"
                placeholderTextColor={Colors.inkSubtle}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>About Your Nursery</Text>
              <TextInput
                value={businessDescription}
                onChangeText={setBusinessDescription}
                placeholder="Specializing in indoor foliage, acclimated aroids, and exotic plants..."
                placeholderTextColor={Colors.inkSubtle}
                multiline
                numberOfLines={4}
                style={[styles.textInput, { height: 90, textAlignVertical: "top" }]}
              />
            </View>
          </View>
        )}

        {/* ── STEP 2: Owner & Contact ── */}
        {currentStep === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Responsible Contact Person</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Owner / Manager Full Name</Text>
              <TextInput
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="e.g. Ramesh Patel"
                placeholderTextColor={Colors.inkSubtle}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Operational Contact Phone *</Text>
              <TextInput
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="9876543210"
                placeholderTextColor={Colors.inkSubtle}
                keyboardType="phone-pad"
                style={styles.textInput}
              />
              <Text style={styles.inputHelp}>
                Courier dispatchers will call this number for order pickups.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Email</Text>
              <TextInput
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="nursery@floria.in"
                placeholderTextColor={Colors.inkSubtle}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>
          </View>
        )}

        {/* ── STEP 3: Location ── */}
        {currentStep === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Physical Nursery Address</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street / Area / Landmark *</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Plot 42, Botanical Garden Road, Sector 5"
                placeholderTextColor={Colors.inkSubtle}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Raipur"
                placeholderTextColor={Colors.inkSubtle}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  value={state}
                  onChangeText={setState}
                  placeholder="Chhattisgarh"
                  placeholderTextColor={Colors.inkSubtle}
                  style={styles.textInput}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>PIN Code *</Text>
                <TextInput
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="492001"
                  placeholderTextColor={Colors.inkSubtle}
                  keyboardType="number-pad"
                  style={styles.textInput}
                />
              </View>
            </View>
          </View>
        )}

        {/* ── STEP 4: Settlement Setup ── */}
        {currentStep === 4 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Cashfree Settlement Account</Text>
            <Text style={styles.cardSectionSubtitle}>
              Direct automated bank transfers for your completed plant orders.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name</Text>
              <TextInput
                value={accountHolderName}
                onChangeText={setAccountHolderName}
                placeholder="As per bank passbook"
                placeholderTextColor={Colors.inkSubtle}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Account Number</Text>
              <TextInput
                value={bankAccount}
                onChangeText={setBankAccount}
                placeholder="e.g. 5010023498123"
                placeholderTextColor={Colors.inkSubtle}
                keyboardType="number-pad"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IFSC Code</Text>
              <TextInput
                value={ifscCode}
                onChangeText={setIfscCode}
                placeholder="HDFC0001234"
                placeholderTextColor={Colors.inkSubtle}
                autoCapitalize="characters"
                style={styles.textInput}
              />
            </View>
          </View>
        )}

        {/* ── STEP 5: Review & Submit ── */}
        {currentStep === 5 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Review Your Partner Application</Text>

            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Business Name</Text>
              <Text style={styles.reviewValue}>{businessName}</Text>
            </View>

            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Contact Phone</Text>
              <Text style={styles.reviewValue}>{contactPhone}</Text>
            </View>

            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Location</Text>
              <Text style={styles.reviewValue}>
                {address}, {city}, {state} {postalCode}
              </Text>
            </View>

            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Settlement Account</Text>
              <Text style={styles.reviewValue}>
                {bankAccount ? `•••• ${bankAccount.slice(-4)} (${ifscCode})` : "Will configure later"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Fixed Bottom Actions ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {currentStep < ONBOARDING_STEPS.length ? (
          <Button
            label="Continue"
            variant="primary"
            size="lg"
            onPress={handleNext}
          />
        ) : (
          <Button
            label="Submit Application"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSubmitApplication}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.page,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.base,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.forest,
  },
  stepperWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.page,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepperTrack: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleCompleted: {
    backgroundColor: Colors.forest,
  },
  stepCircleCurrent: {
    backgroundColor: Colors.terracotta,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.inkMuted,
  },
  stepNumCurrent: {
    color: Colors.white,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  stepConnectorActive: {
    backgroundColor: Colors.forest,
  },
  stepTitleText: {
    textAlign: "center",
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.inkMuted,
    marginTop: 8,
    textTransform: "uppercase",
  },
  formContent: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 4,
  },
  cardSectionSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
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
  reviewItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reviewLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
  },
  reviewValue: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600",
    color: Colors.ink,
    marginTop: 2,
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
});
