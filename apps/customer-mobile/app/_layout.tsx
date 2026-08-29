import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CustomerAuthProvider } from "../lib/contexts/CustomerAuthContext";
import { CartProvider } from "../lib/contexts/CartContext";
import { WishlistProvider } from "../lib/contexts/WishlistContext";
import { Colors } from "../lib/theme";

export default function RootLayout() {
  return (
    <CustomerAuthProvider>
      <CartProvider>
        <WishlistProvider>
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
              options={{ title: "Sign In", presentation: "modal" }}
            />
            <Stack.Screen
              name="(auth)/signup"
              options={{ title: "Create Account", presentation: "modal" }}
            />
            <Stack.Screen
              name="products/[id]"
              options={{ title: "Botanical Specimen" }}
            />
            <Stack.Screen
              name="nurseries/[id]"
              options={{ title: "Nursery Partner" }}
            />
            <Stack.Screen
              name="checkout/index"
              options={{ title: "Secure Checkout" }}
            />
            <Stack.Screen
              name="orders/index"
              options={{ title: "Order History" }}
            />
            <Stack.Screen
              name="orders/[id]"
              options={{ title: "Order Tracking" }}
            />
            <Stack.Screen
              name="addresses/index"
              options={{ title: "Delivery Addresses" }}
            />
          </Stack>
        </WishlistProvider>
      </CartProvider>
    </CustomerAuthProvider>
  );
}
