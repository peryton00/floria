import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import {
  DeliveryAuthProvider,
  useDeliveryAuth,
} from "../lib/contexts/DeliveryAuthContext";

import { useDeliveryNotifications } from "../lib/notifications/useDeliveryNotifications";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, isAuthorizedCourier } = useDeliveryAuth();
  const segments = useSegments();
  const router = useRouter();

  // Register push notifications when authenticated
  useDeliveryNotifications();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session || !isAuthorizedCourier) {
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    } else if (inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, loading, isAuthorizedCourier, segments, router]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F9F8F3",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#1E3A2B" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <DeliveryAuthProvider>
      <AuthGate>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: "#1E3A2B", // Floria Forest Green
            },
            headerTintColor: "#FFFFFF",
            headerTitleStyle: {
              fontWeight: "600",
            },
            contentStyle: {
              backgroundColor: "#F9F8F3", // Floria Warm Cream
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
          <Stack.Screen
            name="(auth)/login"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="deliveries/[id]"
            options={{ title: "Delivery Details" }}
          />
        </Stack>
        <StatusBar style="light" />
      </AuthGate>
    </DeliveryAuthProvider>
  );
}
