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
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { FloriaIcon } from "@floria/icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { ContactFloriaModal } from "../../components/seller/ContactFloriaModal";

export default function SellerLoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useSellerAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [contactModalVisible, setContactModalVisible] = useState(false);
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
        "Please enter your username or Gmail address and password.",
      );
      return;
    }

    const result = await signIn(identifier.trim(), password);
    if (result.success) {
      router.replace("/(tabs)");
    } else if (result.error) {
      if (result.error.includes("under review") || result.error.includes("SELLER_UNDER_REVIEW")) {
        setStatusNotice({
          type: "info",
          title: "Verification Pending",
          message:
            "Floria care will contact you soon. Your botanical nursery verification is currently being reviewed by our horticulture onboarding team.",
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
          message: "Your seller account is currently unavailable. Please contact Floria care.",
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
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Image
              source={require("../../assets/images/floria_mark_white.png")}
              style={{ width: 24, height: 32 }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Floria Nursery Portal</Text>
          <Text style={styles.subtitle}>
            Mobile operational control for botanical partners
          </Text>
        </View>

        {/* ── Top Dual Mode Option Switcher ── */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.segmentTab, styles.segmentTabActive]}
          >
            <FloriaIcon name="login" size={16} color={Colors.forest} />
            <Text style={styles.segmentTextActive}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/onboarding" as any)}
            style={styles.segmentTab}
          >
            <FloriaIcon name="sparkles" size={16} color={Colors.inkMuted} />
            <Text style={styles.segmentText}>Become a Seller</Text>
          </TouchableOpacity>
        </View>

        {/* Pending / Review Status Notification */}
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
            <View style={styles.noticeHeader}>
              <Text style={styles.noticeTitle}>
                {statusNotice.type === "info" ? "⏳ " : statusNotice.type === "warning" ? "⚠️ " : "🚫 "}
                {statusNotice.title}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.noticeContactBtn}
                onPress={() => setContactModalVisible(true)}
              >
                <FloriaIcon name="phone" size={13} color={Colors.white} />
                <Text style={styles.noticeContactBtnText}>Contact Floria</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.noticeMessage}>{statusNotice.message}</Text>
          </View>
        )}

        {/* Form Container */}
        <View style={styles.form}>
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
            label="Sign In to Nursery"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.button}
          />

          {/* Become a Seller Action Card */}
          <View style={styles.becomeSellerCard}>
            <View style={styles.becomeSellerIconCircle}>
              <FloriaIcon name="storefront" size={20} color={Colors.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.becomeSellerTitle}>New Botanical Partner?</Text>
              <Text style={styles.becomeSellerSub}>
                Join Floria as a verified nursery seller in 5 simple steps.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.becomeSellerButton}
              onPress={() => router.push("/onboarding" as any)}
            >
              <Text style={styles.becomeSellerButtonText}>Apply Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ContactFloriaModal
          visible={contactModalVisible}
          onClose={() => setContactModalVisible(false)}
        />
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
    padding: Spacing.lg,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#2D5A3C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: "bold",
    color: "#1A2E22",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    textAlign: "center",
  },

  // Segment Switcher
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: BorderRadius.lg,
    padding: 3,
    marginBottom: Spacing.lg,
  },
  segmentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  segmentTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  segmentTextActive: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D5A3C",
  },

  // Notice Box
  noticeBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  noticeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  noticeInfo: {
    backgroundColor: "#FEF8EC",
    borderColor: "#FBD38D",
  },
  noticeWarning: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FDBA74",
  },
  noticeError: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#78350F",
  },
  noticeMessage: {
    fontSize: 12,
    color: "#92400E",
    lineHeight: 18,
  },
  noticeContactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2D5A3C",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  noticeContactBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Form Fields
  form: {
    gap: Spacing.md,
  },
  field: {
    gap: Spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.ink,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  forgotLink: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.forest,
    fontWeight: "600",
  },
  input: {
    height: 48,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  button: {
    marginTop: Spacing.xs,
  },

  // Become a seller card
  becomeSellerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#DCE5DF",
    borderRadius: BorderRadius.lg,
    padding: 12,
    marginTop: Spacing.sm,
    gap: 10,
  },
  becomeSellerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EAF2EC",
    alignItems: "center",
    justifyContent: "center",
  },
  becomeSellerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  becomeSellerSub: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  becomeSellerButton: {
    backgroundColor: "#2D5A3C",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  becomeSellerButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
});
