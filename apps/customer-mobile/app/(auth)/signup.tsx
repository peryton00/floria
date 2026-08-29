import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { useCustomerAuth } from "../../lib/contexts/CustomerAuthContext";

export default function CustomerSignupScreen() {
  const router = useRouter();
  const { signUp, signInWithGoogle, isLoading } = useCustomerAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
      router.back();
    } catch (e: any) {
      Alert.alert("Google Sign-In Failed", e.message || "Could not sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      Alert.alert(
        "Required Fields",
        "Please complete all registration fields.",
      );
      return;
    }
    try {
      await signUp(email, password, fullName);
      router.back();
    } catch (e: any) {
      Alert.alert(
        "Registration Failed",
        e.message || "Could not register account.",
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Ionicons name="leaf" size={28} color={Colors.white} />
        </View>
        <Text style={styles.title}>Join Floria Marketplace</Text>
        <Text style={styles.subtitle}>
          Discover verified nurseries and exceptional plants
        </Text>
      </View>

      {/* Google Sign-Up — one-tap option */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleGoogle}
        disabled={googleLoading || isLoading}
        style={styles.googleButton}
      >
        <View style={styles.googleIconBox}>
          <Text style={styles.googleG}>G</Text>
        </View>
        <Text style={styles.googleButtonText}>
          {googleLoading ? "Opening Google…" : "Continue with Google"}
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or create account with email</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Aditi Sharma"
            placeholderTextColor={Colors.inkSubtle}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors.inkSubtle}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password (min 8 chars)</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Colors.inkSubtle}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <Button
          label="Create Account"
          onPress={handleSignup}
          loading={isLoading}
          style={styles.button}
        />

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            Already have an account?{" "}
            <Text style={styles.switchTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.page,
    padding: Spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  logoText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xxl,
    fontFamily: "Georgia",
    fontWeight: "bold",
  },
  title: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "Georgia",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
  },
  form: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  googleIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  googleG: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4285F4",
  },
  googleButtonText: {
    flex: 1,
    textAlign: "center",
    fontSize: Typography.fontSizes.base,
    fontWeight: "600",
    color: Colors.ink,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
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
    backgroundColor: Colors.page,
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
  },
  switchButton: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  switchText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
  },
  switchTextBold: {
    color: Colors.terracotta,
    fontWeight: "bold",
  },
});
