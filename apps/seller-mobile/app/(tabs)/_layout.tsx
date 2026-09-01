import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Tabs, Redirect, useRouter } from "expo-router";
import {
  House,
  Receipt,
  Plant,
  ChartBar,
  Storefront,
  Bell,
} from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../lib/theme";
import { useSellerAuth } from "../../lib/contexts/SellerAuthContext";
import { useSellerNotifications } from "../../lib/contexts/SellerNotificationContext";
import { haptics } from "../../lib/haptics";
import { MotionTokens } from "../../lib/motion";

// Floria Nursery Partner Brand Header (No tagline, matches customer-mobile)
function NurseryBrandHeader({ businessName }: { businessName?: string }) {
  return (
    <View style={styles.wordmark}>
      <Image
        source={require("../../assets/images/floria_mark.png")}
        style={styles.headerLogo}
        resizeMode="contain"
      />
      <View>
        <Text style={styles.wordmarkTitle}>Floria</Text>
      </View>
    </View>
  );
}

// Notification Bell Icon for Header Right
function NotificationHeaderAction() {
  const router = useRouter();
  const { unreadCount } = useSellerNotifications();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push("/notifications" as any)}
      style={styles.notificationButton}
      accessibilityLabel="Notifications"
    >
      <Bell size={20} color={Colors.forest} weight="regular" />
      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Minimal Clean Tab Icon (Icon-only with Subtle Animated Active Dot Indicator)
function TabItemIcon({
  name,
  focused,
  color,
}: {
  name: "home" | "orders" | "products" | "analytics" | "account";
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

  const weight = focused ? "fill" : "regular";

  const renderIcon = () => {
    switch (name) {
      case "home":
        return <House size={24} color={color} weight={weight} />;
      case "orders":
        return <Receipt size={24} color={color} weight={weight} />;
      case "products":
        return <Plant size={24} color={color} weight={weight} />;
      case "analytics":
        return <ChartBar size={24} color={color} weight={weight} />;
      case "account":
        return <Storefront size={24} color={color} weight={weight} />;
    }
  };

  return (
    <View style={styles.tabIconWrapper}>
      {renderIcon()}
      <Animated.View
        style={[
          styles.activeIndicatorDot,
          {
            opacity: dotAnim,
            transform: [
              {
                scale: dotAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

export default function TabLayout() {
  const { seller, isAuthorizedSeller, isLoading } = useSellerAuth();
  const insets = useSafeAreaInsets();

  // Dynamic system bottom inset calculation for Android edge-to-edge
  const bottomInset = Math.max(insets.bottom, 0);
  const tabNavHeight = 56 + bottomInset;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.page,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={Colors.forest} />
      </View>
    );
  }

  if (!seller || !isAuthorizedSeller) {
    return <Redirect href="/(auth)/login" />;
  }

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
        tabBarShowLabel: false, // Icon-only bottom navbar matching customer-mobile
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
          headerTitle: () => (
            <NurseryBrandHeader businessName={seller?.businessName} />
          ),
          headerTitleAlign: "left",
          headerRight: () => <NotificationHeaderAction />,
          headerLeft: () => null,
          tabBarIcon: ({ focused, color }) => (
            <TabItemIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Order Fulfillment",
          tabBarIcon: ({ focused, color }) => (
            <TabItemIcon name="orders" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Botanical Catalog",
          tabBarIcon: ({ focused, color }) => (
            <TabItemIcon name="products" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Financial Analytics",
          tabBarIcon: ({ focused, color }) => (
            <TabItemIcon name="analytics" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Nursery Settings",
          tabBarIcon: ({ focused, color }) => (
            <TabItemIcon name="account" focused={focused} color={color} />
          ),
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
  headerLogo: {
    width: 24,
    height: 32,
  },
  wordmarkTitle: {
    fontSize: 17,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.ink,
    lineHeight: 20,
  },
  notificationButton: {
    padding: 8,
    marginRight: 12,
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.terracotta,
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  unreadBadgeText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: "bold",
    lineHeight: 10,
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
});
