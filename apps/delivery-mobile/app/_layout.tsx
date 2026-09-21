import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_400Regular_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  DeliveryAuthProvider,
  useDeliveryAuth,
} from "../lib/contexts/DeliveryAuthContext";
import { useDeliveryNotifications } from "../lib/notifications/useDeliveryNotifications";
import { theme } from "../lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

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
          backgroundColor: theme.colors.cream,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.forest} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <DeliveryAuthProvider>
      <AuthGate>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.forest,
            },
            headerTintColor: theme.colors.white,
            headerTitleStyle: {
              fontFamily: theme.typography.fontFamilies.sansSemiBold,
            },
            contentStyle: {
              backgroundColor: theme.colors.cream,
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
