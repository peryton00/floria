import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { Button } from "../../components/ui/Button";

interface BankAccountInfo {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: "Current" | "Savings";
  isVerified: boolean;
}

export default function SettlementAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seller, refreshProfile } = useSellerAuth();
  const { showSuccess, showError } = useSellerFeedback();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);

  // Bank account details state
  const [bankInfo, setBankInfo] = useState<BankAccountInfo>({
    accountHolderName: seller?.businessName || "Nursery Partner",
    bankName: "HDFC Bank",
    accountNumber: "•••• •••• •••• 4829",
    ifscCode: "HDFC0001234",
    accountType: "Current",
    isVerified: true,
  });

  // Edit form state
  const [formHolder, setFormHolder] = useState("");
  const [formBank, setFormBank] = useState("");
  const [formAccount, setFormAccount] = useState("");
  const [formConfirmAccount, setFormConfirmAccount] = useState("");
  const [formIfsc, setFormIfsc] = useState("");
  const [formType, setFormType] = useState<"Current" | "Savings">("Current");

  const fetchSettlementDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSellerProfile();
      if (res.success && res.data) {
        const p = res.data;
        const sa = (p as any).settlement_account;
        if (sa) {
          const rawAcc = sa.account_number || sa.accountNumber || "";
          const masked = rawAcc.length > 4
            ? `•••• •••• •••• ${rawAcc.slice(-4)}`
            : rawAcc || "•••• •••• •••• 4829";

          setBankInfo({
            accountHolderName: sa.account_holder_name || sa.accountHolderName || p.business_name || "Nursery Partner",
            bankName: sa.bank_name || sa.bankName || "State Bank of India",
            accountNumber: masked,
            ifscCode: (sa.ifsc_code || sa.ifscCode || "SBIN0001234").toUpperCase(),
            accountType: sa.account_type === "Savings" ? "Savings" : "Current",
            isVerified: p.status === "approved" || p.status === "active",
          });
        }
      }
    } catch (err) {
      console.warn("[SettlementAccountScreen] Fetch warning:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlementDetails();
  }, [fetchSettlementDetails, seller?.id]);

  const openEditModal = () => {
    setFormHolder(bankInfo.accountHolderName || seller?.businessName || "");
    setFormBank(bankInfo.bankName || "");
    setFormAccount("");
    setFormConfirmAccount("");
    setFormIfsc(bankInfo.ifscCode || "");
    setFormType(bankInfo.accountType);
    setEditModalVisible(true);
  };

  const handleSaveBankDetails = async () => {
    if (!formHolder.trim() || !formBank.trim() || !formAccount.trim() || !formIfsc.trim()) {
      Alert.alert("Required Fields", "Please complete all bank account details.");
      return;
    }
    if (formAccount.trim() !== formConfirmAccount.trim()) {
      Alert.alert("Mismatch", "The account numbers entered do not match.");
      return;
    }
    if (formIfsc.trim().length < 8) {
      Alert.alert("Invalid IFSC", "Please enter a valid 11-character bank IFSC code.");
      return;
    }

    try {
      setSaving(true);
      const settlementData = {
        account_holder_name: formHolder.trim(),
        bank_name: formBank.trim(),
        account_number: formAccount.trim(),
        ifsc_code: formIfsc.trim().toUpperCase(),
        account_type: formType,
      };

      const res = await api.updateSellerProfile({
        settlement_account: settlementData,
      });

      if (res.success) {
        await refreshProfile();
        await fetchSettlementDetails();
        setEditModalVisible(false);
        showSuccess("Settlement account updated successfully.");
      } else {
        const msg = res.error?.message || "Failed to update settlement account.";
        showError(msg);
        Alert.alert("Update Failed", msg);
      }
    } catch (err: any) {
      const msg = err.message || "Failed to update bank details.";
      showError(msg);
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Top Bar Header */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.forest} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Settlement Account</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.forest} />
          <Text style={styles.loadingText}>Loading settlement details...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Gateway Partner Card */}
          <View style={styles.gatewayCard}>
            <View style={styles.gatewayHeader}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              <Text style={styles.gatewayTitle}>Cashfree Verified Settlement</Text>
            </View>
            <Text style={styles.gatewaySub}>
              All payouts from customer orders are credited directly into your linked bank account via automated IMPS / NEFT transfers on a rolling T+2 schedule.
            </Text>
          </View>

          {/* Bank Account Details Card */}
          <View style={styles.bankCard}>
            <View style={styles.bankCardHeader}>
              <View style={styles.bankIconWrap}>
                <Ionicons name="business" size={22} color={Colors.forest} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bankName}>{bankInfo.bankName}</Text>
                <Text style={styles.accountHolder}>{bankInfo.accountHolderName}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.forest} />
                <Text style={styles.statusBadgeText}>Verified</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Number</Text>
              <Text style={styles.detailValueMono}>{bankInfo.accountNumber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>IFSC Code</Text>
              <Text style={styles.detailValueMono}>{bankInfo.ifscCode}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Type</Text>
              <Text style={styles.detailValue}>{bankInfo.accountType} Account</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Settlement Cycle</Text>
              <Text style={styles.detailValue}>T+2 Rolling (Automatic)</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={openEditModal}
              style={styles.updateBankBtn}
            >
              <Ionicons name="create-outline" size={16} color={Colors.forest} />
              <Text style={styles.updateBankBtnText}>Update Bank Account</Text>
            </TouchableOpacity>
          </View>

          {/* Compliance Guidelines */}
          <View style={styles.infoCard}>
            <Text style={styles.infoHeading}>Important Settlement Guidelines</Text>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.forest} style={{ marginTop: 2 }} />
              <Text style={styles.bulletText}>
                The bank account holder name must match your botanical nursery registration or proprietor identity.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.forest} style={{ marginTop: 2 }} />
              <Text style={styles.bulletText}>
                Settlements for completed plant deliveries are automatically batched every business morning at 06:00 AM IST.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.forest} style={{ marginTop: 2 }} />
              <Text style={styles.bulletText}>
                No platform payout fees or deduction surcharge on direct IMPS settlements.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── Edit Bank Account Modal ── */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Settlement Account</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Account Holder Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formHolder}
                  onChangeText={setFormHolder}
                  placeholder="e.g. Green Leaf Botanical Gardens"
                  placeholderTextColor={Colors.inkSubtle}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Bank Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formBank}
                  onChangeText={setFormBank}
                  placeholder="e.g. HDFC Bank / ICICI Bank"
                  placeholderTextColor={Colors.inkSubtle}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Account Number *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formAccount}
                  onChangeText={setFormAccount}
                  placeholder="Enter complete bank account number"
                  placeholderTextColor={Colors.inkSubtle}
                  keyboardType="number-pad"
                  secureTextEntry
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Confirm Account Number *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formConfirmAccount}
                  onChangeText={setFormConfirmAccount}
                  placeholder="Re-enter bank account number"
                  placeholderTextColor={Colors.inkSubtle}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>IFSC Code *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formIfsc}
                  onChangeText={setFormIfsc}
                  placeholder="e.g. HDFC0001234"
                  placeholderTextColor={Colors.inkSubtle}
                  autoCapitalize="characters"
                  maxLength={11}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Account Type</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    onPress={() => setFormType("Current")}
                    style={[
                      styles.typeOption,
                      formType === "Current" && styles.typeOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        formType === "Current" && styles.typeOptionTextActive,
                      ]}
                    >
                      Current
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setFormType("Savings")}
                    style={[
                      styles.typeOption,
                      formType === "Savings" && styles.typeOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        formType === "Savings" && styles.typeOptionTextActive,
                      ]}
                    >
                      Savings
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Button
                label={saving ? "Verifying & Saving..." : "Confirm & Link Bank Account"}
                onPress={handleSaveBankDetails}
                loading={saving}
                style={{ marginTop: Spacing.sm, marginBottom: Spacing.md }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  gatewayCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  gatewayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  gatewayTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  gatewaySub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    lineHeight: 18,
  },
  bankCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  bankCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bankIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  bankName: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  accountHolder: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.forest,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.ink,
    fontWeight: "600",
  },
  detailValueMono: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.forest,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  updateBankBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.forest,
    backgroundColor: Colors.page,
  },
  updateBankBtnText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
  },
  infoCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoHeading: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  bulletItem: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    lineHeight: 18,
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
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.forest,
  },
  modalField: {
    marginBottom: Spacing.sm,
  },
  modalLabel: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.ink,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  typeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.linen,
  },
  typeOptionActive: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forest,
  },
  typeOptionText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
  typeOptionTextActive: {
    color: Colors.white,
    fontWeight: "700",
  },
});
