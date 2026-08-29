import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../lib/theme";

function TabIcon({ name, color }: { name: string; color?: any }) {
  switch (name) {
    case "dashboard":  return <Ionicons name="grid-outline" size={22} color={color} />;
    case "orders":     return <Ionicons name="receipt-outline" size={22} color={color} />;
    case "inventory":  return <Ionicons name="stats-chart-outline" size={22} color={color} />;
    case "products":   return <Ionicons name="leaf-outline" size={22} color={color} />;
    case "profile":    return <Ionicons name="storefront-outline" size={22} color={color} />;
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
          title: "Radar Cockpit",
          tabBarLabel: "Radar",
          tabBarIcon: ({ color }) => <TabIcon name="dashboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders Queue",
          tabBarLabel: "Orders",
          tabBarIcon: ({ color }) => <TabIcon name="orders" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Rapid Stock",
          tabBarLabel: "Stock",
          tabBarIcon: ({ color }) => <TabIcon name="inventory" color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Specimen Catalog",
          tabBarLabel: "Plants",
          tabBarIcon: ({ color }) => <TabIcon name="products" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Nursery Store",
          tabBarLabel: "Nursery",
          tabBarIcon: ({ color }) => <TabIcon name="profile" color={color} />,
        }}
      />
    </Tabs>
  );
}
