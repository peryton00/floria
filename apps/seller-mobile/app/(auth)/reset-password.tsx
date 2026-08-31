import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { FloriaIcon } from "@floria/icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";

export default function SellerResetPasswordScreen() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async () => {
    if (!token.trim()) {
      Alert.alert("Required", "Please enter the password reset token sent to your email.");
      return;
    }
    if (!password || password.length < 8) {
      Alert.alert("Password Requirements", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.confirmSellerPasswordReset(token.trim(), password);
      if (res.success) {
        setIsSuccess(true);
      } else {
        Alert.alert("Error", res.error?.message || "Invalid or expired token.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <FloriaIcon name="sparkles" size={28} color={Colors.white} />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Set a new secure password for your nursery account
          </Text>
        </View>

        <View style={styles.form}>
          {!isSuccess ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Reset Token</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Paste token from reset email"
                  placeholderTextColor={Colors.inkSubtle}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={token}
                  onChangeText={setToken}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>New Password (min 8 chars)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.inkSubtle}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.inkSubtle}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isSubmitting}
                />
              </View>

              <Button
                label={isSubmitting ? "Updating..." : "Update Password"}
                onPress={handleReset}
                loading={isSubmitting}
                style={styles.button}
              />
            </>
          ) : (
            <View style={styles.successBox}>
              <FloriaIcon name="check_circle" size={44} color={Colors.forest} style={styles.checkIcon} />
              <Text style={styles.successTitle}>Password Updated</Text>
              <Text style={styles.successText}>
                Your password has been changed successfully. You can now log in with your new credentials.
              </Text>
              <Button
                label="Back to Login"
                onPress={() => router.replace("/(auth)/login")}
                style={styles.button}
              />
            </View>
          )}

          {!isSuccess && (
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/login")}
              style={styles.backButton}
              disabled={isSubmitting}
            >
              <Text style={styles.backText}>← Back to Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.page },
  container: { flexGrow: 1, backgroundColor: Colors.page, padding: Spacing.xl, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: Spacing.xl },
  logo: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#2D5A3C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    color: "#1A2E22",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
    textAlign: "center",
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  field: { marginBottom: Spacing.md },
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
    paddingVertical: 12,
    fontSize: Typography.fontSizes.base,
    color: Colors.ink,
  },
  button: {
    marginTop: Spacing.sm,
    backgroundColor: "#2D5A3C",
    width: "100%",
  },
  successBox: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  checkIcon: {
    marginBottom: Spacing.sm,
  },
  successTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    color: "#1A2E22",
    marginBottom: Spacing.xs,
  },
  successText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  backButton: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    alignItems: "center",
  },
  backText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: "#2D5A3C",
  },
});
