// Floria Delivery Mobile — Bottom Tabs Layout Shell with Phosphor Icons
import React from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { theme } from "../../lib/theme";
import { FloriaIcon } from "../../components/ui/FloriaIcon";

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
          minHeight: 44,
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
          title: "Home",
          tabBarLabel: "Today",
          headerTitle: "Today's Dispatch",
          tabBarAccessibilityLabel: "Today's Dispatch Overview",
          tabBarIcon: ({ color, focused }) => (
            <FloriaIcon
              name="home"
              size={22}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
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
          tabBarIcon: ({ color, focused }) => (
            <FloriaIcon
              name="package"
              size={22}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarLabel: "Earnings",
          headerTitle: "Courier Earnings",
          tabBarAccessibilityLabel: "Courier Earnings and Payouts",
          tabBarIcon: ({ color, focused }) => (
            <FloriaIcon
              name="wallet"
              size={22}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarLabel: "Account",
          headerTitle: "Courier Profile",
          tabBarAccessibilityLabel: "Courier Account and Settings",
          tabBarIcon: ({ color, focused }) => (
            <FloriaIcon
              name="account"
              size={22}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
