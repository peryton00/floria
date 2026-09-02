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
import { supabase } from "../../lib/supabase";
import { theme } from "../../lib/theme";
import { FloriaIcon } from "../ui/FloriaIcon";

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export function ForgotPasswordModal({
  visible,
  onClose,
  initialEmail = "",
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Please enter your registered courier email.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: "floria-delivery://auth/reset-password",
        },
      );

      if (resetError) {
        setError(resetError.message || "Unable to send password reset request.");
      } else {
        setSubmitted(true);
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
            <FloriaIcon name="close" size={20} color={theme.colors.muted} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <FloriaIcon name="key" size={28} color={theme.colors.forest} />
          </View>

          <Text style={styles.title}>Reset Password</Text>

          {submitted ? (
            <View style={styles.successBox}>
              <FloriaIcon name="check_circle" size={24} color={theme.colors.success} />
              <Text style={styles.successTitle}>Instructions Sent</Text>
              <Text style={styles.successText}>
                If an authorized courier account exists for{" "}
                <Text style={{ fontWeight: "700" }}>{email}</Text>, password
                reset instructions have been sent to that address.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.doneBtn}
                onPress={handleDismiss}
              >
                <Text style={styles.doneBtnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.subtitle}>
                Enter your courier email address to receive secure dispatch
                password reset instructions.
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <FloriaIcon name="warning" size={16} color={theme.colors.terracotta} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>COURIER EMAIL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="courier@floria.in"
                  placeholderTextColor={theme.colors.muted}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (error) setError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.submitBtn}
                onPress={handleReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>SEND RESET LINK</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(30, 58, 43, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.lg,
  },
  closeBtn: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    padding: theme.spacing.xs,
    zIndex: 1,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.botanicalGreen,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.forest,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
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
  submitBtn: {
    backgroundColor: theme.colors.terracotta,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  successBox: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.forest,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  successText: {
    fontSize: 13,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: theme.spacing.lg,
  },
  doneBtn: {
    backgroundColor: theme.colors.forest,
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md,
  },
  doneBtnText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
