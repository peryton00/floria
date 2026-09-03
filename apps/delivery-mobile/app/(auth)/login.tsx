// Floria Delivery Mobile — Single-Screen Login with Courier Header Artwork
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
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useDeliveryAuth } from "../../lib/contexts/DeliveryAuthContext";
import { theme } from "../../lib/theme";
import { FloriaIcon } from "../../components/ui/FloriaIcon";
import { ForgotPasswordModal } from "../../components/auth/ForgotPasswordModal";
import { JoinPartnerModal } from "../../components/auth/JoinPartnerModal";
import { DeliveryIllustration } from "../../components/auth/DeliveryIllustration";

export default function CourierLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const { signIn } = useDeliveryAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);

  // Determine scaling based on screen height so all content fits on the first screen without scrolling
  const isCompact = screenHeight < 760;
  const isVeryCompact = screenHeight < 680;

  // Header image height scaled proportionally to screen height budget (aspect ratio: 1024 x 560 = 1.82857)
  const headerHeight = isVeryCompact
    ? 125
    : isCompact
    ? 150
    : Math.min(Math.round(screenWidth * (560 / 1024)), 255);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your email or courier ID and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await signIn(identifier.trim(), password);
      if (res.success) {
        router.replace("/(tabs)");
      } else {
        setError(
          res.error ||
            "Invalid courier credentials. Please verify your email/ID and password.",
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
    <View style={styles.screenContainer}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 6),
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
          scrollEnabled={isVeryCompact}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── 1. Top Header: User-Provided Courier Delivery Header (1024x560) ── */}
          <View style={styles.headerWrapper}>
            <DeliveryIllustration
              size={screenWidth}
              height={headerHeight}
            />
          </View>

          {/* ── 2. Main Login Card ── */}
          <View style={[styles.brandCard, isCompact && styles.brandCardCompact]}>
            {/* Top Row: Logistics Pill Badge & Leaf Mark */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.logisticsBadge}>
                <FloriaIcon
                  name="truck"
                  size={13}
                  color="#8C4A32"
                  weight="fill"
                />
                <Text style={styles.logisticsBadgeText}>FLORIA LOGISTICS</Text>
              </View>

              <Image
                source={require("../../assets/images/icon.png")}
                style={styles.cardLeafMark}
                resizeMode="contain"
              />
            </View>

            {/* Headings */}
            <Text style={[styles.title, isCompact && styles.titleCompact]}>
              Welcome, Courier!
            </Text>
            <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
              Sign in to access your deliveries, routes, and earnings.
            </Text>

            {/* Error Alert */}
            {error && (
              <View style={styles.errorBox} accessibilityRole="alert">
                <FloriaIcon
                  name="warning"
                  size={14}
                  color={theme.colors.terracotta}
                />
                <Text style={styles.errorText} numberOfLines={2}>
                  {error}
                </Text>
              </View>
            )}

            {/* 40px Spacing Above Email / Courier ID Input */}
            <View style={{ height: 80 }} />

            {/* Email / Courier ID Input */}
            <View style={[styles.inputGroup, isCompact && styles.inputGroupCompact]}>
              <Text style={styles.label}>EMAIL / COURIER ID</Text>
              <View style={[styles.inputWrapper, isCompact && styles.inputWrapperCompact]}>
                <FloriaIcon
                  name="mail"
                  size={16}
                  color="#8A908D"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email or courier ID"
                  placeholderTextColor="#8A908D"
                  value={identifier}
                  onChangeText={(text) => {
                    setIdentifier(text);
                    if (error) setError(null);
                  }}
                  autoCapitalize="none"
                  autoComplete="username"
                  accessibilityLabel="Email or Courier ID"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={[styles.inputGroup, isCompact && styles.inputGroupCompact]}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={[styles.inputWrapper, isCompact && styles.inputWrapperCompact]}>
                <FloriaIcon
                  name="lock"
                  size={16}
                  color="#8A908D"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#8A908D"
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
                  <FloriaIcon
                    name={showPassword ? "eye_off" : "eye"}
                    size={16}
                    color="#5A625E"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me & Forgot Password Row */}
            <View style={[styles.optionsRow, isCompact && styles.optionsRowCompact]}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.rememberMeWrap}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && (
                    <FloriaIcon
                      name="check"
                      size={11}
                      color={theme.colors.white}
                      weight="bold"
                    />
                  )}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setForgotModalVisible(true)}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Primary Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.submitBtn,
                isCompact && styles.submitBtnCompact,
                loading && styles.submitBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>SIGN IN TO DISPATCH</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── 3. New to Floria Logistics? Join Box (Outside Login Form) ── */}
          <View style={[styles.joinContainer, isCompact && styles.joinContainerCompact]}>
            <View style={styles.joinAvatar}>
              <FloriaIcon
                name="user_plus"
                size={16}
                color="#2E5B42"
                weight="bold"
              />
            </View>

            <View style={styles.joinTextGroup}>
              <Text style={styles.joinTitle}>New to Floria Logistics?</Text>
              <Text style={styles.joinSubtitle} numberOfLines={1}>
                Join our delivery network and start earning.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.joinNowBtn}
              onPress={() => setJoinModalVisible(true)}
            >
              <Text style={styles.joinNowText}>JOIN NOW</Text>
            </TouchableOpacity>
          </View>

          {/* ── 4. Trust & Compliance Footer ── */}
          <View style={[styles.footer, isCompact && styles.footerCompact]}>
            <View style={styles.trustBadge}>
              <FloriaIcon
                name="shield_outline"
                size={14}
                color="#2E5B42"
                weight="bold"
              />
              <Text style={styles.trustText}>
                Secure & trusted by Floria Logistics
              </Text>
            </View>

            <Text style={styles.footerDisclaimer}>
              Courier accounts are strictly provided by Floria Operations Dispatch.{"\n"}
              For onboarding or password resets, contact your regional hub manager.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <ForgotPasswordModal
        visible={forgotModalVisible}
        onClose={() => setForgotModalVisible(false)}
        initialEmail={identifier.includes("@") ? identifier : ""}
      />

      <JoinPartnerModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#FFFCF6",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  headerWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  brandCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#EAE5DF",
    marginHorizontal: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: -50, // Hover 20px over the top header illustration
    zIndex: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  brandCardCompact: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: -20,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logisticsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5EBE1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  logisticsBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8C4A32",
    letterSpacing: 0.6,
  },
  cardLeafMark: {
    width: 34,
    height: 34,
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#151917",
    marginTop: 8,
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: 19,
    marginTop: 6,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12.5,
    color: "#6D7571",
    lineHeight: 17,
    marginBottom: 12,
  },
  subtitleCompact: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF2F0",
    borderWidth: 1,
    borderColor: "#F5C2BC",
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    gap: 6,
  },
  errorText: {
    fontSize: 11.5,
    color: theme.colors.terracotta,
    flex: 1,
    lineHeight: 15,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFDAD4",
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  compactButton: {
    paddingVertical: 8,
  },
  googleButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#151917",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  dividerCompact: {
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E0DA",
  },
  dividerText: {
    marginHorizontal: 8,
    fontSize: 11,
    color: "#7C8380",
  },
  inputGroup: {
    marginBottom: 9,
  },
  inputGroupCompact: {
    marginBottom: 7,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#151917",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFDAD4",
    borderRadius: 9,
    paddingHorizontal: 10,
    height: 42,
  },
  inputWrapperCompact: {
    height: 38,
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: "#151917",
    paddingVertical: 6,
  },
  eyeBtn: {
    padding: 4,
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
    marginBottom: 11,
  },
  optionsRowCompact: {
    marginBottom: 9,
  },
  rememberMeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#7C8380",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#1E3A2B",
    borderColor: "#1E3A2B",
  },
  rememberMeText: {
    fontSize: 12,
    color: "#565E5A",
  },
  forgotText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#151917",
  },
  submitBtn: {
    backgroundColor: "#8F3523",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnCompact: {
    paddingVertical: 10,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  joinContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4EF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E3EAE1",
    padding: 10,
    marginTop: 12,
    marginHorizontal: 16,
    gap: 8,
  },
  joinContainerCompact: {
    padding: 8,
    marginTop: 10,
    marginHorizontal: 16,
  },
  joinAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DFE8DD",
    alignItems: "center",
    justifyContent: "center",
  },
  joinTextGroup: {
    flex: 1,
  },
  joinTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#151917",
  },
  joinSubtitle: {
    fontSize: 10.5,
    color: "#616A66",
    marginTop: 1,
  },
  joinNowBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2E5B42",
    backgroundColor: "#FFFFFF",
  },
  joinNowText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#2E5B42",
    letterSpacing: 0.4,
  },
  footer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  footerCompact: {
    marginTop: 6,
    marginBottom: 4,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  trustText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2E5B42",
  },
  footerDisclaimer: {
    fontSize: 9.5,
    color: "#7C8380",
    textAlign: "center",
    lineHeight: 13,
  },
});
