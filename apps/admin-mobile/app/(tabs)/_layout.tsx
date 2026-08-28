import React from "react";
import { Tabs } from "expo-router";
import { Text } from "react-native";
import { Colors } from "../../lib/theme";

function TabIcon({ name, color }: { name: string; color?: any }) {
  const getIcon = () => {
    switch (name) {
      case "dashboard":
        return "⚡";
      case "approvals":
        return "🏪";
      case "moderation":
        return "🌿";
      case "operations":
        return "🚚";
      case "profile":
        return "🛡️";
      default:
        return "•";
    }
  };

  return <Text style={{ fontSize: 18, color }}>{getIcon()}</Text>;
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
