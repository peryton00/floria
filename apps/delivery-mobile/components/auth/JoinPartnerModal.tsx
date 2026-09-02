import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { theme } from "../../lib/theme";
import { FloriaIcon } from "../ui/FloriaIcon";

interface JoinPartnerModalProps {
  visible: boolean;
  onClose: () => void;
}

const VEHICLE_TYPES = [
  { id: "two_wheeler", label: "Two Wheeler (Bike / Scooter)", icon: "scooter" },
  { id: "ev", label: "Electric Vehicle (EV 2W)", icon: "scooter" },
  { id: "three_wheeler", label: "Three Wheeler / Cargo", icon: "truck" },
  { id: "four_wheeler", label: "Four Wheeler / Van", icon: "truck" },
];

export function JoinPartnerModal({ visible, onClose }: JoinPartnerModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [vehicleType, setVehicleType] = useState("two_wheeler");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim() || !phone.trim() || !email.trim()) {
        setError("Please enter your name, contact phone, and email.");
        return;
      }
      if (phone.trim().length < 10) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (!vehicleNumber.trim() || !drivingLicense.trim()) {
        setError("Please enter your vehicle registration and driving license number.");
        return;
      }
      setError(null);
      handleSubmitApplication();
    }
  };

  const handleSubmitApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      // Wait for dispatch registration payload processing
      await new Promise((r) => setTimeout(r, 900));
      setSubmitted(true);
      setStep(3);
    } catch (e: any) {
      setError(e.message || "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleResetAndClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Delivery Partner Onboarding</Text>
              <Text style={styles.sheetSubtitle}>Floria Botanical Logistics Network</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleResetAndClose}>
              <FloriaIcon name="close" size={20} color={theme.colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error && (
              <View style={styles.errorBox}>
                <FloriaIcon name="warning" size={16} color={theme.colors.terracotta} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {step === 1 && (
              <View>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>STEP 1 OF 2: PERSONAL & CONTACT</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>FULL LEGAL NAME *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={theme.colors.muted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>MOBILE NUMBER (FOR DISPATCH SMS) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor={theme.colors.muted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>EMAIL ADDRESS *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. rahul.sharma@example.com"
                    placeholderTextColor={theme.colors.muted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>OPERATING CITY / HUB *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Bangalore"
                    placeholderTextColor={theme.colors.muted}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.actionBtn}
                  onPress={handleNext}
                >
                  <Text style={styles.actionBtnText}>CONTINUE TO VEHICLE DETAILS</Text>
                  <FloriaIcon name="chevron_right" size={16} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>STEP 2 OF 2: VEHICLE & VERIFICATION</Text>
                </View>

                <Text style={styles.label}>SELECT VEHICLE TYPE *</Text>
                <View style={styles.vehicleOptions}>
                  {VEHICLE_TYPES.map((v) => {
                    const isSelected = vehicleType === v.id;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        activeOpacity={0.8}
                        onPress={() => setVehicleType(v.id)}
                        style={[
                          styles.vehicleCard,
                          isSelected && styles.vehicleCardSelected,
                        ]}
                      >
                        <FloriaIcon
                          name={v.icon}
                          size={20}
                          color={isSelected ? theme.colors.forest : theme.colors.muted}
                        />
                        <Text
                          style={[
                            styles.vehicleLabel,
                            isSelected && styles.vehicleLabelSelected,
                          ]}
                        >
                          {v.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>VEHICLE REGISTRATION NUMBER (RC) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. KA-01-AB-1234"
                    placeholderTextColor={theme.colors.muted}
                    value={vehicleNumber}
                    onChangeText={setVehicleNumber}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>DRIVING LICENSE NUMBER *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. DL-1420110012345"
                    placeholderTextColor={theme.colors.muted}
                    value={drivingLicense}
                    onChangeText={setDrivingLicense}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.backBtn}
                    onPress={() => setStep(1)}
                  >
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.actionBtn, { flex: 2 }]}
                    onPress={handleNext}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                      <Text style={styles.actionBtnText}>SUBMIT APPLICATION</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <FloriaIcon name="check_circle" size={44} color={theme.colors.success} />
                </View>

                <Text style={styles.successHeader}>Application Received!</Text>
                <Text style={styles.successMessage}>
                  Thank you, <Text style={{ fontWeight: "700" }}>{fullName}</Text>. Your application for Floria Delivery Partner has been submitted for Regional Hub verification.
                </Text>

                <View style={styles.infoSummary}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>City Hub:</Text>
                    <Text style={styles.infoVal}>{city}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Vehicle:</Text>
                    <Text style={styles.infoVal}>{vehicleNumber}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={[styles.infoVal, { color: theme.colors.warning }]}>Under Review (24-48h)</Text>
                  </View>
                </View>

                <Text style={styles.infoNote}>
                  Once authorized by Floria Operations Dispatch, your courier credentials will be activated and you can sign in directly.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.actionBtn}
                  onPress={handleResetAndClose}
                >
                  <Text style={styles.actionBtnText}>RETURN TO LOGIN</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(30, 58, 43, 0.55)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: theme.colors.linen,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.lg,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  sheetBody: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  stepBadge: {
    backgroundColor: theme.colors.botanicalGreen,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    alignSelf: "flex-start",
    marginBottom: theme.spacing.md,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.forest,
    letterSpacing: 0.8,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.forest,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.sand,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    fontSize: 14,
    color: theme.colors.charcoal,
  },
  vehicleOptions: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.sand,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  vehicleCardSelected: {
    backgroundColor: theme.colors.botanicalGreen,
    borderColor: theme.colors.forest,
  },
  vehicleLabel: {
    fontSize: 13,
    color: theme.colors.charcoal,
    fontWeight: "500",
  },
  vehicleLabelSelected: {
    color: theme.colors.forest,
    fontWeight: "700",
  },
  actionBtn: {
    backgroundColor: theme.colors.terracotta,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  actionBtnText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  btnRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  backBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.sand,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.charcoal,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF2F0",
    borderWidth: 1,
    borderColor: "#F5C2BC",
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.terracotta,
    flex: 1,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  successIconCircle: {
    marginBottom: theme.spacing.md,
  },
  successHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.forest,
    marginBottom: theme.spacing.xs,
  },
  successMessage: {
    fontSize: 13,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: theme.spacing.lg,
  },
  infoSummary: {
    width: "100%",
    backgroundColor: theme.colors.sand,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.charcoal,
  },
  infoNote: {
    fontSize: 11,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: theme.spacing.lg,
  },
});
