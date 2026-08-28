// Floria Delivery Mobile — Courier Authentication Screen (Step 5B.2)
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useDeliveryAuth } from "../../lib/contexts/DeliveryAuthContext";
import { theme } from "../../lib/theme";
import { Button } from "../../components/ui/Button";

export default function CourierLoginScreen() {
  const router = useRouter();
  const { signIn, isAuthorizedCourier } = useDeliveryAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your courier email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await signIn(email.trim(), password);
      if (res.success) {
        // Router navigation will be handled by AuthGate or immediate replace
        router.replace("/(tabs)");
      } else {
        setError(
          res.error ||
            "Invalid courier credentials. Please verify and try again.",
        );
      }
    } catch (e: any) {
      setError(
        e.message || "Failed to sign in. Please check your network connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Floria Brand Card */}
        <View style={styles.brandCard}>
          {/* Botanical Badge */}
          <View style={styles.badge}>
            <MaterialIcons
              name="local-shipping"
              size={14}
              color={theme.colors.forest}
            />
            <Text style={styles.badgeText}>FLORIA LOGISTICS</Text>
          </View>

          <Text style={styles.title}>Field Dispatch</Text>
          <Text style={styles.subtitle}>
            Sign in to access your assigned nursery pickups, optimized route,
            and customer drop-offs.
          </Text>

          {/* Error Message */}
          {error && (
            <View style={styles.errorBox} accessibilityRole="alert">
              <MaterialIcons
                name="error-outline"
                size={18}
                color={theme.colors.terracotta}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>COURIER EMAIL</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="mail-outline"
                size={18}
                color={theme.colors.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="courier@floria.in"
                placeholderTextColor={theme.colors.muted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                accessibilityLabel="Courier Email"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="lock-outline"
                size={18}
                color={theme.colors.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={theme.colors.muted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                accessibilityLabel="Password"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                <MaterialIcons
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={18}
                  color={theme.colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <Button
            label="SIGN IN TO DISPATCH"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            variant="primary"
            size="md"
            style={styles.submitBtn}
          />
        </View>

        {/* Informational Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            Courier accounts are strictly provisioned by Floria Operations
            Dispatch. For onboarding or password resets, contact your regional
            hub manager.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  brandCard: {
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: theme.spacing.xxl,
    ...theme.shadows.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.botanicalGreen,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.xs,
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  badgeText: {
    color: theme.colors.forest,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  title: {
    ...theme.typography.title,
    fontSize: 26,
    color: theme.colors.forest,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.subtitle,
    color: theme.colors.muted,
    lineHeight: 19,
    marginBottom: theme.spacing.xl,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF2F0",
    borderWidth: 1,
    borderColor: "#F5C6CB",
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.terracotta,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.sectionLabel,
    fontSize: 10,
    marginBottom: theme.spacing.xs + 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.inputSand,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.radius.sm,
    height: 48,
    paddingHorizontal: theme.spacing.md,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: theme.colors.charcoal,
  },
  eyeBtn: {
    padding: theme.spacing.xs,
  },
  submitBtn: {
    marginTop: theme.spacing.sm,
  },
  footer: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
  },
  footerNote: {
    ...theme.typography.caption,
    textAlign: "center",
    color: theme.colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
});
