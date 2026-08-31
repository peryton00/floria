import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { FloriaIcon } from "@floria/icons";
import { Colors } from "../../lib/theme";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";

function TabIcon({
  name,
  focused,
  color,
}: {
  name: "home" | "orders" | "products" | "analytics" | "account";
  focused: boolean;
  color?: any;
}) {
  const iconNameMap = {
    home: "home" as const,
    orders: "orders" as const,
    products: "leaf" as const,
    analytics: "analytics" as const,
    account: "storefront" as const,
  };

  return (
    <FloriaIcon
      name={iconNameMap[name]}
      size={22}
      color={color || (focused ? Colors.forest : Colors.inkMuted)}
      weight={focused ? "fill" : "regular"}
    />
  );
}

export default function TabLayout() {
  const { seller, isAuthorizedSeller, isLoading } = useSellerAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.page, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.forest} />
      </View>
    );
  }

  if (!seller || !isAuthorizedSeller) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarLabel: "Orders",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="orders" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarLabel: "Products",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="products" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarLabel: "Analytics",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="analytics" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarLabel: "Account",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="account" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
