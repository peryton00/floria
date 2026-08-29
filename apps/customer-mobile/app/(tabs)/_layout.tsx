import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../lib/theme";
import { useCart } from "../../lib/contexts/CartContext";
import { useWishlist } from "../../lib/contexts/WishlistContext";
import { LocationSelector } from "../../components/customer/LocationSelector";
import { haptics } from "../../lib/haptics";
import { MotionTokens } from "../../lib/motion";

// Floria brand logo & title for home tab (no tagline)
function HomeBrandHeader() {
  return (
    <View style={styles.wordmark}>
      <View style={styles.logoBox}>
        <Ionicons name="leaf" size={14} color="#ffffff" />
      </View>
      <Text style={styles.wordmarkTitle}>Floria</Text>
    </View>
  );
}

// Minimal Clean Tab Icon (Icon-only with Subtle Active Dot Indicator)
function TabItemIcon({
  name,
  focused,
  color,
}: {
  name: "home" | "explore" | "wishlist" | "cart" | "profile";
  focused: boolean;
  color?: any;
}) {
  const dotAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(dotAnim, {
      toValue: focused ? 1 : 0,
      duration: MotionTokens.duration.instant,
      easing: MotionTokens.easing.easeOut,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  let iconName: any = "ellipse-outline";
  switch (name) {
    case "home":
      iconName = focused ? "home" : "home-outline";
      break;
    case "explore":
      iconName = focused ? "grid" : "grid-outline";
      break;
    case "wishlist":
      iconName = focused ? "heart" : "heart-outline";
      break;
    case "cart":
      iconName = focused ? "bag-handle" : "bag-handle-outline";
      break;
    case "profile":
      iconName = focused ? "person" : "person-outline";
      break;
  }

  return (
    <View style={styles.tabIconWrapper}>
      <Ionicons name={iconName} size={24} color={color} />
      <Animated.View
        style={[
          styles.activeIndicatorDot,
          {
            opacity: dotAnim,
            transform: [{ scale: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          },
        ]}
      />
    </View>
  );
}

export default function TabLayout() {
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();
  const insets = useSafeAreaInsets();

  // Dynamic system bottom inset calculation for Android edge-to-edge
  const bottomInset = Math.max(insets.bottom, 0);
  const tabNavHeight = 56 + bottomInset;

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          haptics.selection();
        },
      }}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.page,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          // @ts-ignore — RN shadow reset
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
        tabBarShowLabel: false, // Icon-only bottom navbar
        tabBarStyle: {
          backgroundColor: Colors.linen,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: tabNavHeight,
          paddingTop: 6,
          paddingBottom: bottomInset > 0 ? bottomInset : 6,
          elevation: 0,
          shadowColor: "transparent",
        },
        tabBarItemStyle: {
          height: 48,
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarActiveTintColor: Colors.forest,
        tabBarInactiveTintColor: Colors.inkMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => <HomeBrandHeader />,
          headerTitleAlign: "left",
          headerRight: () => (
            <View style={styles.headerRightLocation}>
              <LocationSelector compact />
            </View>
          ),
          headerLeft: () => null,
          tabBarIcon: ({ focused, color }) => (
            <TabItemIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Botanical Categories",
          tabBarIcon: ({ focused, color }) => (
            <TabItemIcon name="explore" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Saved Wishlist",
          tabBarBadge: wishlist.length > 0 ? wishlist.length : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.terracotta,
            color: Colors.white,
            fontSize: 9,
            fontWeight: "bold",
            lineHeight: 12,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
          },
          tabBarIcon: ({ focused, color }) => (
            <TabItemIcon name="wishlist" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Your Botanical Bag",
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.terracotta,
            color: Colors.white,
            fontSize: 9,
            fontWeight: "bold",
            lineHeight: 12,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
          },
          tabBarIcon: ({ focused, color }) => (
            <TabItemIcon name="cart" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "My Account",
          tabBarIcon: ({ focused, color }) => (
            <TabItemIcon name="profile" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRightLocation: {
    marginRight: 14,
  },
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
    fontSize: 17,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.ink,
    lineHeight: 20,
  },
  tabIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: 34,
  },
  activeIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.forest,
    marginTop: 3,
  },
  inactiveDotSpace: {
    width: 4,
    height: 4,
    marginTop: 3,
  },
});
