// Floria Delivery Mobile — Bottom Tabs Layout Shell (Step 5B.2)
import React from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.forest,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.linen,
          borderTopColor: theme.colors.divider,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
          ...theme.shadows.md,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          minHeight: 44, // Minimum accessible touch target
        },
        headerStyle: {
          backgroundColor: theme.colors.forest,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
          letterSpacing: -0.2,
        },
        headerTitleAlign: "center",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarLabel: "Today",
          headerTitle: "Today's Dispatch",
          tabBarAccessibilityLabel: "Today's Dispatch Overview",
          tabBarIcon: ({ color, size }: { color?: any; size?: number }) => (
            <MaterialIcons name="today" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="deliveries"
        options={{
          title: "Deliveries",
          tabBarLabel: "Deliveries",
          headerTitle: "Delivery Queue",
          tabBarAccessibilityLabel: "All Deliveries Queue",
          tabBarIcon: ({ color, size }: { color?: any; size?: number }) => (
            <MaterialIcons name="local-shipping" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          headerTitle: "Courier Account",
          tabBarAccessibilityLabel: "Courier Account and Settings",
          tabBarIcon: ({ color, size }: { color?: any; size?: number }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
