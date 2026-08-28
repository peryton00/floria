// Floria Delivery Mobile — ScreenContainer Primitive
import React from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import { theme } from "../../lib/theme";

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  safeArea?: boolean;
}

export function ScreenContainer({
  children,
  style,
  safeArea = true,
}: ScreenContainerProps) {
  if (safeArea) {
    return (
      <SafeAreaView style={[styles.safeArea, style]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.forest}
        />
        <View style={styles.container}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.forest}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.cream,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
});
