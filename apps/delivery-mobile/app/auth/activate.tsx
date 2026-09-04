import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { theme } from "../../lib/theme";
import { FloriaIcon } from "../../components/ui/FloriaIcon";
import { api } from "../../lib/api";

export default function ActivateCourierScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    if (!token.trim()) {
      setError("Please provide the activation token from your dispatch email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.activateDeliveryPartner({
        token: token.trim(),
        password,
      });

      if (res.success) {
        setSuccess(true);
      } else {
        throw new Error(res.error?.message || "Failed to activate account");
      }
    } catch (e: any) {
      setError(e.message || "Failed to activate account. Please check token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Branding header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <FloriaIcon name="truck" size={32} color={theme.colors.forest} />
          </View>
          <Text style={styles.brandTitle}>FLORIA COURIER</Text>
          <Text style={styles.brandSubtitle}>Account Activation & Password Setup</Text>
        </View>

        {success ? (
          <View style={styles.card}>
            <View style={styles.successIconCircle}>
              <FloriaIcon name="check_circle" size={48} color={theme.colors.success} />
            </View>
            <Text style={styles.successTitle}>Account Activated!</Text>
            <Text style={styles.successMessage}>
              Your courier account has been successfully verified and activated. You can now sign in to your delivery dashboard.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryBtn}
              onPress={() => router.replace("/(auth)/login")}
            >
              <Text style={styles.primaryBtnText}>SIGN IN TO DASHBOARD</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Set Your Secure Password</Text>
            <Text style={styles.cardSubtitle}>
              Create a secure dispatch password to start receiving order delivery assignments.
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <FloriaIcon name="warning" size={16} color={theme.colors.terracotta} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Activation Token</Text>
              <TextInput
                value={token}
                onChangeText={setToken}
                placeholder="Paste 64-character activation token"
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Create Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={theme.colors.muted}
                secureTextEntry
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat your password"
                placeholderTextColor={theme.colors.muted}
                secureTextEntry
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryBtn}
              onPress={handleActivate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>ACTIVATE ACCOUNT</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace("/(auth)/login")}
              style={styles.backLink}
            >
              <Text style={styles.backLinkText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: "center",
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.colors.botanicalGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.forest,
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.charcoal,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: theme.spacing.lg,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FDF3F1",
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.terracotta,
    flex: 1,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: theme.colors.charcoal,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.inputSand,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.charcoal,
  },
  primaryBtn: {
    backgroundColor: theme.colors.forest,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  primaryBtnText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  backLink: {
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  backLinkText: {
    fontSize: 12,
    color: theme.colors.forest,
    fontWeight: "600",
  },
  successIconCircle: {
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.forest,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  successMessage: {
    fontSize: 13,
    color: theme.colors.charcoal,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: theme.spacing.xl,
  },
});
