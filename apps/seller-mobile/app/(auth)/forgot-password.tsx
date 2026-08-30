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
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";

export default function SellerForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!identifier.trim()) {
      Alert.alert("Required", "Please enter your username or Gmail address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.requestSellerPasswordReset(identifier.trim());
      if (res.success) {
        setIsSubmitted(true);
      } else {
        Alert.alert("Error", res.error?.message || "Failed to request password reset.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to request password reset.");
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
            <Ionicons name="key" size={28} color={Colors.white} />
          </View>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your credentials to recover your nursery account
          </Text>
        </View>

        <View style={styles.form}>
          {!isSubmitted ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Username or Gmail Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="username or you@gmail.com"
                  placeholderTextColor={Colors.inkSubtle}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={identifier}
                  onChangeText={setIdentifier}
                  editable={!isSubmitting}
                />
              </View>

              <Button
                label={isSubmitting ? "Sending..." : "Send Reset Instructions"}
                onPress={handleSubmit}
                loading={isSubmitting}
                style={styles.button}
              />
            </>
          ) : (
            <View style={styles.successBox}>
              <Ionicons name="mail-open" size={40} color="#2D5A3C" style={styles.mailIcon} />
              <Text style={styles.successTitle}>Check Your Inbox</Text>
              <Text style={styles.successText}>
                If an eligible account exists for {identifier}, we have sent password reset instructions.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/reset-password" as any)}
                style={styles.tokenPrompt}
              >
                <Text style={styles.tokenPromptText}>
                  Have a reset token? <Text style={styles.linkBold}>Enter it here</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            disabled={isSubmitting}
          >
            <Text style={styles.backText}>← Back to Login</Text>
          </TouchableOpacity>
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
  },
  successBox: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  mailIcon: {
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
    marginBottom: Spacing.md,
  },
  tokenPrompt: {
    padding: Spacing.sm,
    backgroundColor: "#F9FAFB",
    borderRadius: BorderRadius.md,
    width: "100%",
    alignItems: "center",
  },
  tokenPromptText: {
    fontSize: Typography.fontSizes.xs,
    color: "#4B5563",
  },
  linkBold: {
    fontWeight: "bold",
    color: "#2D5A3C",
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
