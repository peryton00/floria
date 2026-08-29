import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../lib/theme";
import { useCart } from "../../lib/contexts/CartContext";
import { useWishlist } from "../../lib/contexts/WishlistContext";

// Floria wordmark header — matches web sidebar/nav brand
function FloriaWordmark() {
  return (
    <View style={styles.wordmark}>
      <View style={styles.logoBox}>
        <Ionicons name="leaf" size={14} color="#ffffff" />
      </View>
      <View>
        <Text style={styles.wordmarkTitle}>Floria</Text>
        <Text style={styles.wordmarkSub}>Plant Marketplace</Text>
      </View>
    </View>
  );
}

function TabIcon({ name, color }: { name: string; color?: any }) {
  switch (name) {
    case "home":    return <Ionicons name="leaf-outline" size={22} color={color} />;
    case "explore": return <Ionicons name="search-outline" size={22} color={color} />;
    case "wishlist":return <Ionicons name="heart-outline" size={22} color={color} />;
    case "cart":    return <Ionicons name="bag-handle-outline" size={22} color={color} />;
    case "profile": return <Ionicons name="person-outline" size={22} color={color} />;
    default:        return <Ionicons name="ellipse-outline" size={22} color={color} />;
  }
}

export default function TabLayout() {
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.page,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          // @ts-ignore — RN shadow
          shadowColor: "transparent",
          elevation: 0,
        },
        headerTintColor: Colors.forest,
        headerTitleStyle: {
          fontFamily: "Georgia",
          fontWeight: "bold",
          fontSize: 17,
          color: Colors.ink,
        },
        tabBarStyle: {
          backgroundColor: Colors.linen,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
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
          headerTitle: () => <FloriaWordmark />,
          headerLeft: () => null,
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Botanical Categories",
          tabBarLabel: "Categories",
          tabBarIcon: ({ color }) => <TabIcon name="explore" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Saved Wishlist",
          tabBarLabel: "Wishlist",
          tabBarBadge: wishlist.length > 0 ? wishlist.length : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.terracotta,
            color: Colors.white,
            fontSize: 10,
            fontWeight: "bold",
          },
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

const styles = StyleSheet.create({
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmarkTitle: {
    fontSize: 15,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.ink,
    lineHeight: 18,
  },
  wordmarkSub: {
    fontSize: 8,
    fontWeight: "700",
    color: Colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    lineHeight: 10,
  },
});
