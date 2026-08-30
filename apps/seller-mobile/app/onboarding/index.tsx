import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { Button } from "../../components/ui/Button";

const ONBOARDING_STEPS = [
  { id: 1, title: "Account & Credentials" },
  { id: 2, title: "Nursery Details" },
  { id: 3, title: "Location" },
  { id: 4, title: "Settlement Setup" },
  { id: 5, title: "Review & Submit" },
];

export default function SellerOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assignedId, setAssignedId] = useState<string | null>(null);

  // Form Fields
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [businessName, setBusinessName] = useState<string>("");
  const [businessDescription, setBusinessDescription] = useState<string>("");
  const [businessType, setBusinessType] = useState<string>("Botanical Nursery");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [gstNumber, setGstNumber] = useState<string>("");

  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("Raipur");
  const [state, setState] = useState<string>("Chhattisgarh");
  const [postalCode, setPostalCode] = useState<string>("492001");

  const [bankAccount, setBankAccount] = useState<string>("");
  const [ifscCode, setIfscCode] = useState<string>("");
  const [accountHolderName, setAccountHolderName] = useState<string>("");

  const handleNext = () => {
    setErrorMessage(null);

    if (currentStep === 1) {
      if (!username.trim() || username.length < 3) {
        setErrorMessage("Username / Seller ID must be at least 3 characters.");
        return;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErrorMessage("Valid Gmail/email address is required.");
        return;
      }
      if (!password || password.length < 8) {
        setErrorMessage("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
    } else if (currentStep === 2) {
      if (!businessName.trim() || businessName.trim() === "Nursery Partner" || businessName.trim() === "New Nursery") {
        setErrorMessage("Valid nursery business name is required.");
        return;
      }
      const cleanPhone = contactPhone.replace(/[\s\-+()\u00a0]/g, "").replace(/^91/, "");
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        setErrorMessage("Enter a valid 10-digit Indian phone number.");
        return;
      }
    } else if (currentStep === 3) {
      if (!address.trim() || !city.trim() || !state.trim() || !/^\d{6}$/.test(postalCode.trim())) {
        setErrorMessage("Please enter a complete address, city, state, and 6-digit PIN code.");
        return;
      }
    }

    setCurrentStep((prev) => Math.min(ONBOARDING_STEPS.length, prev + 1));
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmitApplication = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const cleanPhone = contactPhone.replace(/[\s\-+()\u00a0]/g, "").replace(/^91/, "");

      const payload = {
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
        business_name: businessName.trim(),
        business_description: businessDescription.trim() || "Registered Floria botanical nursery partner.",
        business_type: businessType,
        contact_phone: cleanPhone,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        gst_number: gstNumber.trim().toUpperCase() || undefined,
        settlement_account: {
          bank_account_number: bankAccount.trim() || undefined,
          ifsc_code: ifscCode.trim().toUpperCase() || undefined,
          account_holder_name: accountHolderName.trim() || undefined,
        },
      };

      const res = await api.submitSellerApplication(payload);
      if (res.success) {
        setAssignedId(res.data?.publicSellerId || null);
        setIsSubmitted(true);
      } else {
        setErrorMessage(res.error?.message || "Failed to submit application.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  // ── UNDER REVIEW STATE ──
  if (isSubmitted) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, justifyContent: "center" }]}>
        <View style={styles.reviewCard}>
          <View style={styles.reviewIconCircle}>
            <Ionicons name="hourglass" size={36} color="#2D5A3C" />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>● UNDER REVIEW</Text>
          </View>
          <Text style={styles.reviewTitle}>Application Submitted</Text>
          <Text style={styles.reviewText}>
            We&apos;re reviewing your seller application. Our team will verify your nursery and documents.
          </Text>

          {assignedId && (
            <View style={styles.idBox}>
              <Text style={styles.idLabel}>Assigned Seller ID:</Text>
              <Text style={styles.idVal}>{assignedId}</Text>
            </View>
          )}

          <View style={styles.infoNotice}>
            <Text style={styles.infoNoticeText}>
              Once approved, your account will become active and you can sign in using your credentials.
            </Text>
          </View>

          <Button
            label="Back to Login"
            onPress={() => router.replace("/(auth)/login")}
            style={styles.buttonPrimary}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.forest} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Become a Seller</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Stepper */}
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
                      <Text style={[styles.stepNum, isCurrent && styles.stepNumCurrent]}>
                        {s.id}
                      </Text>
                    )}
                  </View>
                  {idx < ONBOARDING_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        isCompleted && styles.stepLineCompleted,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
          <Text style={styles.stepTitle}>
            Step {currentStep}: {ONBOARDING_STEPS[currentStep - 1].title}
          </Text>
        </View>

        {/* Form Body */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Step 1: Credentials */}
          {currentStep === 1 && (
            <View style={styles.formCard}>
              <Text style={styles.sectionHeader}>Login & Identity</Text>
              <View style={styles.field}>
                <Text style={styles.label}>Username / Seller ID *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. green-roots-raipur"
                  placeholderTextColor={Colors.inkSubtle}
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Gmail / Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="hello@yournursery.in"
                  placeholderTextColor={Colors.inkSubtle}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Password * (min 8 chars)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.inkSubtle}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.inkSubtle}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>
          )}

          {/* Step 2: Nursery Details */}
          {currentStep === 2 && (
            <View style={styles.formCard}>
              <Text style={styles.sectionHeader}>Nursery Information</Text>
              <View style={styles.field}>
                <Text style={styles.label}>Nursery / Business Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Green Earth Botanical"
                  placeholderTextColor={Colors.inkSubtle}
                  value={businessName}
                  onChangeText={setBusinessName}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Contact Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  placeholderTextColor={Colors.inkSubtle}
                  keyboardType="phone-pad"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>GST Number (GSTIN)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="22AAAAA0000A1Z5"
                  placeholderTextColor={Colors.inkSubtle}
                  autoCapitalize="characters"
                  value={gstNumber}
                  onChangeText={setGstNumber}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Description / Botanical Specialties</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Aroids, Bonsai, Indoor plants, rare acclimated..."
                  placeholderTextColor={Colors.inkSubtle}
                  multiline
                  numberOfLines={3}
                  value={businessDescription}
                  onChangeText={setBusinessDescription}
                />
              </View>
            </View>
          )}

          {/* Step 3: Location */}
          {currentStep === 3 && (
            <View style={styles.formCard}>
              <Text style={styles.sectionHeader}>Nursery Physical Address</Text>
              <View style={styles.field}>
                <Text style={styles.label}>Street Address *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Plot 12, Nursery Lane, Sector 4"
                  placeholderTextColor={Colors.inkSubtle}
                  multiline
                  numberOfLines={2}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Raipur"
                  placeholderTextColor={Colors.inkSubtle}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>State *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Chhattisgarh"
                  placeholderTextColor={Colors.inkSubtle}
                  value={state}
                  onChangeText={setState}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>PIN Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="492001"
                  placeholderTextColor={Colors.inkSubtle}
                  keyboardType="numeric"
                  maxLength={6}
                  value={postalCode}
                  onChangeText={setPostalCode}
                />
              </View>
            </View>
          )}

          {/* Step 4: Settlement */}
          {currentStep === 4 && (
            <View style={styles.formCard}>
              <Text style={styles.sectionHeader}>Settlement Account Setup</Text>
              <View style={styles.field}>
                <Text style={styles.label}>Bank Account Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Account Number"
                  placeholderTextColor={Colors.inkSubtle}
                  keyboardType="numeric"
                  value={bankAccount}
                  onChangeText={setBankAccount}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>IFSC Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HDFC0001234"
                  placeholderTextColor={Colors.inkSubtle}
                  autoCapitalize="characters"
                  value={ifscCode}
                  onChangeText={setIfscCode}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Account Holder Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full Legal Name"
                  placeholderTextColor={Colors.inkSubtle}
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                />
              </View>
            </View>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <View style={styles.formCard}>
              <Text style={styles.sectionHeader}>Review Application</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Username:</Text>
                <Text style={styles.summaryVal}>{username}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Email:</Text>
                <Text style={styles.summaryVal}>{email}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Nursery:</Text>
                <Text style={styles.summaryVal}>{businessName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phone:</Text>
                <Text style={styles.summaryVal}>{contactPhone}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Location:</Text>
                <Text style={styles.summaryVal}>{city}, {state} - {postalCode}</Text>
              </View>
              {gstNumber ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GSTIN:</Text>
                  <Text style={styles.summaryVal}>{gstNumber}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            {currentStep < 5 ? (
              <Button
                label="Continue"
                onPress={handleNext}
                style={styles.buttonPrimary}
              />
            ) : (
              <Button
                label={loading ? "Submitting..." : "Submit Partner Application"}
                onPress={handleSubmitApplication}
                loading={loading}
                style={styles.buttonPrimary}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAF8F5" },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: "#1A2E22",
  },
  stepperWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: "center",
  },
  stepperTrack: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleCurrent: {
    backgroundColor: "#2D5A3C",
  },
  stepCircleCompleted: {
    backgroundColor: "#2D5A3C",
  },
  stepNum: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6B7280",
  },
  stepNumCurrent: {
    color: "#FFFFFF",
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  stepLineCompleted: {
    backgroundColor: "#2D5A3C",
  },
  stepTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: "#2D5A3C",
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.fontSizes.xs,
    color: "#991B1B",
    fontWeight: "600",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: "#1A2E22",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  field: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.inkLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: "#FAFAF9",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  summaryLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
  },
  summaryVal: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.ink,
  },
  bottomActions: {
    marginTop: Spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: "#2D5A3C",
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    margin: Spacing.xl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  reviewIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EAF2EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  badge: {
    backgroundColor: "#EAF2EC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0E2D4",
    marginBottom: Spacing.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#2D5A3C",
    letterSpacing: 0.5,
  },
  reviewTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    color: "#1A2E22",
    marginBottom: Spacing.xs,
  },
  reviewText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  idBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#F9FAFB",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: Spacing.md,
  },
  idLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
  },
  idVal: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.ink,
  },
  infoNotice: {
    backgroundColor: "#FEF8EC",
    borderColor: "#FBD38D",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: "100%",
    marginBottom: Spacing.lg,
  },
  infoNoticeText: {
    fontSize: Typography.fontSizes.xs,
    color: "#8C5E06",
    lineHeight: 18,
  },
});
