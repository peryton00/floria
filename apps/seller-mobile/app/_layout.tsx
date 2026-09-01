import React from "react";
import { StatusBar } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SellerAuthProvider } from "../lib/contexts/SellerAuthContext";
import { SellerNotificationProvider } from "../lib/contexts/SellerNotificationContext";
import { SellerFeedbackProvider } from "../lib/contexts/SellerFeedbackContext";
import { Colors } from "../lib/theme";

export default function RootLayout() {
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
                  fontWeight: "bold",
                  fontFamily: "Georgia",
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
              options={{ title: "Edit Plant Listing" }}
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
