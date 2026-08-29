import React from "react";
import { StatusBar } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CustomerAuthProvider } from "../lib/contexts/CustomerAuthContext";
import { CartProvider } from "../lib/contexts/CartContext";
import { WishlistProvider } from "../lib/contexts/WishlistContext";
import { FloriaFeedbackProvider } from "../lib/contexts/FloriaFeedbackContext";
import { Colors } from "../lib/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CustomerAuthProvider>
        <FloriaFeedbackProvider>
          <CartProvider>
            <WishlistProvider>
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
                options={{ title: "Sign In", presentation: "modal" }}
              />
              <Stack.Screen
                name="(auth)/signup"
                options={{ title: "Create Account", presentation: "modal" }}
              />
              <Stack.Screen
                name="products/[id]"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="nurseries/[id]"
                options={{
                  title: "Botanical Collection",
                }}
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
      </FloriaFeedbackProvider>
    </CustomerAuthProvider>
  </SafeAreaProvider>
);
}
