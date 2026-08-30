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
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";

export default function SellerLoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useSellerAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [statusNotice, setStatusNotice] = useState<{
    type: "info" | "warning" | "error";
    title: string;
    message: string;
  } | null>(null);

  const handleLogin = async () => {
    setStatusNotice(null);
    if (!identifier.trim() || !password) {
      Alert.alert(
        "Required Fields",
        "Please enter your Gmail address or Seller ID and password.",
      );
      return;
    }

    const result = await signIn(identifier.trim(), password);
    if (result.success) {
      router.replace("/(tabs)");
    } else if (result.error) {
      if (result.error.includes("under review")) {
        setStatusNotice({
          type: "info",
          title: "Application Under Review",
          message: "Your seller application is currently being reviewed by our botanical onboarding team. You will be notified once approved.",
        });
      } else if (result.error.includes("correction")) {
        setStatusNotice({
          type: "warning",
          title: "Correction Required",
          message: result.error,
        });
      } else if (result.error.includes("unavailable") || result.error.includes("suspended")) {
        setStatusNotice({
          type: "error",
          title: "Account Unavailable",
          message: "Your seller account is currently unavailable. Please contact nursery support.",
        });
      } else {
        Alert.alert("Authentication Failed", result.error);
      }
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
            <Ionicons name="leaf" size={28} color={Colors.white} />
          </View>
          <Text style={styles.title}>Floria Nursery Portal</Text>
          <Text style={styles.subtitle}>
            Mobile operational control for partner growers
          </Text>
        </View>

        {statusNotice && (
          <View
            style={[
              styles.noticeBox,
              statusNotice.type === "info"
                ? styles.noticeInfo
                : statusNotice.type === "warning"
                  ? styles.noticeWarning
                  : styles.noticeError,
            ]}
          >
            <Text style={styles.noticeTitle}>
              {statusNotice.type === "info" ? "⏳ " : statusNotice.type === "warning" ? "⚠️ " : "🚫 "}
              {statusNotice.title}
            </Text>
            <Text style={styles.noticeMessage}>{statusNotice.message}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Gmail or Seller ID</Text>
            <TextInput
              style={styles.input}
              placeholder="hello@yournursery.in or FLR-SLR-XXXX"
              placeholderTextColor={Colors.inkSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              value={identifier}
              onChangeText={setIdentifier}
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password" as any)}
                disabled={isLoading}
              >
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.inkSubtle}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
          </View>

          <Button
            label="Login"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.button}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Want to sell on Floria? </Text>
            <TouchableOpacity onPress={() => router.push("/onboarding" as any)}>
              <Text style={styles.registerLink}>Become a Seller</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.page,
  },
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
  noticeBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  noticeInfo: {
    backgroundColor: "#F0F7F3",
    borderColor: "#B8DEC4",
  },
  noticeWarning: {
    backgroundColor: "#FEF8EC",
    borderColor: "#FBD38D",
  },
  noticeError: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  noticeTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: "#1E4D2B",
    marginBottom: 4,
  },
  noticeMessage: {
    fontSize: Typography.fontSizes.xs,
    color: "#374151",
    lineHeight: 18,
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
  field: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.inkLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  forgotLink: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: "#2D5A3C",
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
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  footerText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
  },
  registerLink: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: "#2D5A3C",
  },
});
