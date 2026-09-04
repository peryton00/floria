import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { theme } from "../../lib/theme";
import { FloriaIcon } from "../ui/FloriaIcon";
import { api } from "../../lib/api";
import type { DeliveryPartnerApplication } from "@floria/types";

interface ApplicationStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onProceedToLogin?: (email: string) => void;
}

export function ApplicationStatusModal({
  visible,
  onClose,
  onProceedToLogin,
}: ApplicationStatusModalProps) {
  const [emailOrId, setEmailOrId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeliveryPartnerApplication | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    if (!emailOrId.trim()) {
      setError("Please enter your email or Application ID.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await api.getDeliveryApplicationStatus(emailOrId.trim());
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error?.message || "No application found with this email.");
      }
    } catch (e: any) {
      setError(e.message || "Failed to check application status.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmailOrId("");
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleReset}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Application Status</Text>
              <Text style={styles.subtitle}>Check your courier onboarding progress</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleReset}>
              <FloriaIcon name="close" size={20} color={theme.colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          {!result ? (
            <View style={styles.content}>
              <Text style={styles.label}>EMAIL ADDRESS OR APPLICATION ID</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. driver@floria.in"
                placeholderTextColor={theme.colors.muted}
                value={emailOrId}
                onChangeText={setEmailOrId}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />

              {error && (
                <View style={styles.errorBox}>
                  <FloriaIcon name="alert_circle" size={16} color={theme.colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.actionBtn}
                onPress={handleCheckStatus}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.actionBtnText}>CHECK STATUS</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resultContainer}>
              <View
                style={[
                  styles.statusBadge,
                  result.status === "approved"
                    ? styles.statusApproved
                    : result.status === "rejected"
                    ? styles.statusRejected
                    : styles.statusPending,
                ]}
              >
                <FloriaIcon
                  name={
                    result.status === "approved"
                      ? "check_circle"
                      : result.status === "rejected"
                      ? "alert_circle"
                      : "clock"
                  }
                  size={20}
                  color={
                    result.status === "approved"
                      ? theme.colors.success
                      : result.status === "rejected"
                      ? theme.colors.error
                      : theme.colors.warning
                  }
                />
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        result.status === "approved"
                          ? theme.colors.success
                          : result.status === "rejected"
                          ? theme.colors.error
                          : theme.colors.warning,
                    },
                  ]}
                >
                  {result.status === "approved"
                    ? "APPLICATION APPROVED"
                    : result.status === "rejected"
                    ? "APPLICATION NOT APPROVED"
                    : "UNDER REVIEW (PENDING)"}
                </Text>
              </View>

              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Applicant:</Text>
                  <Text style={styles.detailValue}>{result.full_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City Hub:</Text>
                  <Text style={styles.detailValue}>{result.city}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vehicle:</Text>
                  <Text style={styles.detailValue}>{result.vehicle_number}</Text>
                </View>
                {result.rejection_reason && (
                  <View style={[styles.detailRow, { flexDirection: "column", alignItems: "flex-start", gap: 4 }]}>
                    <Text style={[styles.detailLabel, { color: theme.colors.error }]}>Reason:</Text>
                    <Text style={styles.detailValue}>{result.rejection_reason}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.explanationText}>
                {result.status === "approved"
                  ? "Your courier account is active. You can now log in using the email and password you created during registration."
                  : result.status === "rejected"
                  ? "Unfortunately, your application did not satisfy verification criteria. Please contact Floria Operations for assistance."
                  : "Your application is currently being verified by the regional operations team. Please allow 24-48 hours."}
              </Text>

              {result.status === "approved" ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.actionBtn}
                  onPress={() => {
                    handleReset();
                    onProceedToLogin?.(result.email);
                  }}
                >
                  <Text style={styles.actionBtnText}>PROCEED TO LOGIN</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.secondaryBtn}
                  onPress={() => setResult(null)}
                >
                  <Text style={styles.secondaryBtnText}>CHECK ANOTHER EMAIL</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(30, 58, 43, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  content: {
    gap: theme.spacing.md,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.charcoal,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: "rgba(148, 56, 40, 0.08)",
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    flex: 1,
  },
  actionBtn: {
    backgroundColor: theme.colors.forest,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.sm,
  },
  actionBtnText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  secondaryBtn: {
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.sm,
  },
  secondaryBtnText: {
    color: theme.colors.forest,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  resultContainer: {
    gap: theme.spacing.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  statusPending: {
    backgroundColor: "rgba(181, 101, 29, 0.12)",
  },
  statusApproved: {
    backgroundColor: "rgba(43, 110, 63, 0.12)",
  },
  statusRejected: {
    backgroundColor: "rgba(148, 56, 40, 0.12)",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  detailsCard: {
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.forest,
  },
  explanationText: {
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 18,
    textAlign: "center",
  },
});
