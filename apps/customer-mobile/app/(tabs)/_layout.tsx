import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../lib/theme";
import { useCart } from "../../lib/contexts/CartContext";

function TabIcon({ name, color }: { name: string; color?: any }) {
  switch (name) {
    case "home":
      return <Ionicons name="leaf-outline" size={22} color={color} />;
    case "explore":
      return <Ionicons name="search-outline" size={22} color={color} />;
    case "wishlist":
      return <Ionicons name="heart-outline" size={22} color={color} />;
    case "cart":
      return <Ionicons name="bag-handle-outline" size={22} color={color} />;
    case "profile":
      return <Ionicons name="person-outline" size={22} color={color} />;
    default:
      return <Ionicons name="ellipse-outline" size={22} color={color} />;
  }
}

export default function TabLayout() {
  const { itemCount } = useCart();

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
          title: "Floria",
          tabBarLabel: "Discover",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore Botanical Catalog",
          tabBarLabel: "Search",
          tabBarIcon: ({ color }) => <TabIcon name="explore" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Saved Plants",
          tabBarLabel: "Wishlist",
          tabBarIcon: ({ color }) => <TabIcon name="wishlist" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Your Botanical Bag",
          tabBarLabel: "Cart",
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.terracotta,
            color: Colors.white,
            fontSize: 10,
            fontWeight: "bold",
          },
          tabBarIcon: ({ color }) => <TabIcon name="cart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "My Account",
          tabBarLabel: "Account",
          tabBarIcon: ({ color }) => <TabIcon name="profile" color={color} />,
        }}
      />
    </Tabs>
  );
}
