import React from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Redirect } from "expo-router";
import { useSellerAuth } from "../lib/contexts/SellerAuthContext";

export default function Index() {
  const { isAuthenticated, isAuthorizedSeller, isLoading } = useSellerAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D5A3C" />
        <Text style={styles.loadingText}>Connecting to Floria Nursery...</Text>
      </View>
    );
  }

  if (isAuthenticated && isAuthorizedSeller) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FAF8F5",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#2D5A3C",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
