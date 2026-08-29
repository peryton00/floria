import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { useCustomerAuth } from "../../lib/contexts/CustomerAuthContext";
import { useFeedback } from "../../lib/contexts/FloriaFeedbackContext";

export default function CustomerSignupScreen() {
  const router = useRouter();
  const { signUp, signInWithGoogle, isLoading } = useCustomerAuth();
  const { showError, showSuccess } = useFeedback();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
      showSuccess("Account created with Google");
      router.back();
    } catch (e: any) {
      showError(e.message || "Could not complete Google registration.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      showError("Please enter your full name, email address, and password.");
      return;
    }
    if (password.length < 6) {
      showError("Password must be at least 6 characters long.");
      return;
    }
    try {
      await signUp(email.trim(), password, fullName.trim());
      showSuccess("Welcome to Floria! Account created successfully");
      router.back();
    } catch (e: any) {
      showError(e.message || "Could not register account.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="leaf" size={26} color={Colors.white} />
          </View>
          <Text style={styles.title}>Join Floria</Text>
          <Text style={styles.subtitle}>
            Connect directly with premier local nurseries & botanical growers
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* 1. Google One-Tap */}
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleGoogle}
            disabled={googleLoading || isLoading}
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={Colors.forest} style={{ marginRight: 8 }} />
            ) : (
              <View style={styles.googleIconCircle}>
                <Ionicons name="logo-google" size={16} color="#4285F4" />
              </View>
            )}
            <Text style={styles.googleButtonText}>
              {googleLoading ? "Connecting to Google…" : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          {/* 2. Visual Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or register with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 3. Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={18}
                color={Colors.forest}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Aditi Sharma"
                placeholderTextColor={Colors.inkSubtle}
                autoCapitalize="words"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* 4. Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={Colors.forest}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.inkSubtle}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* 5. Password with Eye Toggle */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password (min 6 chars)</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={Colors.forest}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.inkSubtle}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeToggleBtn}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={19}
                  color={showPassword ? Colors.forest : Colors.inkMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* 6. Submit Button */}
          <Button
            label="Create Account"
            onPress={handleSignup}
            loading={isLoading}
            style={styles.submitBtn}
          />
        </View>

        {/* 7. Switch to Sign In */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.switchRow}
        >
          <Text style={styles.switchText}>
            Already have an account?{" "}
            <Text style={styles.switchTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.page,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "Georgia",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.inkMuted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1.2,
    borderColor: Colors.border,
    height: 48,
    paddingHorizontal: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  googleIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F0F4F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  googleButtonText: {
    fontSize: Typography.fontSizes.sm + 1,
    fontWeight: "600",
    color: Colors.ink,
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginHorizontal: Spacing.sm,
    fontWeight: "500",
    textTransform: "lowercase",
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.inkLight,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.page,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    height: 46,
    paddingHorizontal: Spacing.sm + 2,
  },
  inputIcon: {
    marginRight: Spacing.xs + 2,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSizes.base,
    color: Colors.ink,
    paddingVertical: 0,
  },
  eyeToggleBtn: {
    padding: 6,
    marginLeft: 4,
  },
  submitBtn: {
    marginTop: Spacing.xs,
    height: 48,
    borderRadius: BorderRadius.md,
  },
  switchRow: {
    marginTop: Spacing.lg,
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  switchText: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.inkMuted,
  },
  switchTextBold: {
    color: Colors.terracotta,
    fontWeight: "bold",
  },
});
