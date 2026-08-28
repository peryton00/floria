import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AdminAuthProvider } from "../lib/contexts/AdminAuthContext";
import { Colors } from "../lib/theme";

export default function RootLayout() {
  return (
    <AdminAuthProvider>
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
        <Stack.Screen
          name="(auth)/login"
          options={{ title: "Administrator Access", presentation: "modal" }}
        />
        <Stack.Screen
          name="sellers/[id]"
          options={{ title: "Nursery Inspection" }}
        />
        <Stack.Screen
          name="audit-logs/index"
          options={{ title: "System Audit Trail" }}
        />
      </Stack>
    </AdminAuthProvider>
  );
}
