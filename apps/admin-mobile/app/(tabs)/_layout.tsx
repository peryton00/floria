import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../lib/theme";

function TabIcon({ name, color }: { name: string; color?: any }) {
  switch (name) {
    case "dashboard":  return <Ionicons name="pulse-outline" size={22} color={color} />;
    case "approvals":  return <Ionicons name="storefront-outline" size={22} color={color} />;
    case "moderation": return <Ionicons name="leaf-outline" size={22} color={color} />;
    case "operations": return <Ionicons name="car-outline" size={22} color={color} />;
    case "profile":    return <Ionicons name="shield-checkmark-outline" size={22} color={color} />;
    default:           return <Ionicons name="ellipse-outline" size={22} color={color} />;
  }
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.page,
        },
        headerTintColor: Colors.forest,
        headerTitleStyle: {
          fontFamily: "Georgia",
          fontWeight: "bold",
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: Colors.linen,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.forest,
        tabBarInactiveTintColor: Colors.inkMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Governance Radar",
          tabBarLabel: "Radar",
          tabBarIcon: ({ color }) => <TabIcon name="dashboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: "Nursery Approvals",
          tabBarLabel: "Nurseries",
          tabBarIcon: ({ color }) => <TabIcon name="approvals" color={color} />,
        }}
      />
      <Tabs.Screen
        name="moderation"
        options={{
          title: "Catalog Moderation",
          tabBarLabel: "Catalog",
          tabBarIcon: ({ color }) => (
            <TabIcon name="moderation" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: "Operations Oversight",
          tabBarLabel: "Dispatch",
          tabBarIcon: ({ color }) => (
            <TabIcon name="operations" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Governance & Audit",
          tabBarLabel: "Audit",
          tabBarIcon: ({ color }) => <TabIcon name="profile" color={color} />,
        }}
      />
    </Tabs>
  );
}
