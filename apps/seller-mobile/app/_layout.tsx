import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SellerAuthProvider } from "../lib/contexts/SellerAuthContext";
import { Colors } from "../lib/theme";

export default function RootLayout() {
  return (
    <SellerAuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.page,
          },
          headerTintColor: Colors.forest,
          headerTitleStyle: {
            fontWeight: "bold",
            fontFamily: "Georgia",
          },
          contentStyle: {
            backgroundColor: Colors.page,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)/login"
          options={{ title: "Nursery Sign In", presentation: "modal" }}
        />
        <Stack.Screen
          name="orders/[id]"
          options={{ title: "Order Fulfillment" }}
        />
        <Stack.Screen
          name="products/new"
          options={{ title: "New Botanical Specimen" }}
        />
        <Stack.Screen
          name="products/[id]"
          options={{ title: "Edit Specimen" }}
        />
      </Stack>
    </SellerAuthProvider>
  );
}
