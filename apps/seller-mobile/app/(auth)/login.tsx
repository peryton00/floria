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
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";

export default function SellerLoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useSellerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        "Required Fields",
        "Please provide nursery partner email and password.",
      );
      return;
    }
    try {
      await signIn(email, password);
      router.back();
    } catch (e: any) {
      Alert.alert(
        "Authentication Failed",
        e.message || "Invalid nursery credentials.",
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>🌱</Text>
        </View>
        <Text style={styles.title}>Floria Nursery Portal</Text>
        <Text style={styles.subtitle}>
          Mobile operational control for partner growers
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Nursery Partner Email</Text>
          <TextInput
            style={styles.input}
            placeholder="nursery@floria.in"
            placeholderTextColor={Colors.inkSubtle}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
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
          label="Access Operational Portal"
          onPress={handleLogin}
          loading={isLoading}
          style={styles.button}
        />
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
    fontSize: 28,
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
    textAlign: "center",
  },
  form: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
});
