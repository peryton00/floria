import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { Stack } from "expo-router";
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
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SellerAuthProvider } from "../lib/contexts/SellerAuthContext";
import { SellerNotificationProvider } from "../lib/contexts/SellerNotificationContext";
import { SellerFeedbackProvider } from "../lib/contexts/SellerFeedbackContext";
import { Colors, Typography } from "../lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

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
    <SafeAreaProvider>
      <SellerAuthProvider>
        <SellerNotificationProvider>
          <SellerFeedbackProvider>
            <StatusBar
              backgroundColor={Colors.page}
              barStyle="dark-content"
              translucent={false}
            />
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: Colors.page,
                },
                headerTintColor: Colors.forest,
                headerTitleStyle: {
                  fontFamily: Typography.fontFamilies.serif,
                  fontSize: 17,
                  color: Colors.ink,
                },
                headerShadowVisible: false,
                contentStyle: {
                  backgroundColor: Colors.page,
                },
              }}
            >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
            <Stack.Screen
              name="(auth)/login"
              options={{ title: "Nursery Partner Sign In", headerShown: false }}
            />
            <Stack.Screen
              name="orders/[id]"
              options={{ title: "Order Fulfillment" }}
            />
            <Stack.Screen
              name="products/new"
              options={{ title: "Add Plant to Catalog" }}
            />
            <Stack.Screen
              name="products/[id]"
              options={{ title: "Edit Plant Listing" , headerShown: true}}
            />
            <Stack.Screen
              name="inventory/index"
              options={{ title: "Inventory Management" }}
            />
            <Stack.Screen
              name="notifications/index"
              options={{ title: "Notifications" }}
            />
            <Stack.Screen
              name="onboarding/index"
              options={{ title: "Seller Partner Setup", headerShown: false }}
            />
            <Stack.Screen
              name="account/details"
              options={{ title: "Nursery Details" }}
            />
            <Stack.Screen
              name="account/hours"
              options={{ title: "Operating Hours" }}
            />
            <Stack.Screen
              name="account/settlements"
              options={{ title: "Settlement Account" }}
            />
            <Stack.Screen
              name="account/transactions"
              options={{ title: "Transaction History" }}
            />
            <Stack.Screen
              name="account/notifications"
              options={{ title: "Notification Preferences" }}
            />
          </Stack>
        </SellerFeedbackProvider>
      </SellerNotificationProvider>
    </SellerAuthProvider>
  </SafeAreaProvider>
  );
}
