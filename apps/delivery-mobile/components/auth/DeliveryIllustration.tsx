import React from "react";
import { View, Image, StyleSheet, useWindowDimensions } from "react-native";

interface DeliveryIllustrationProps {
  size?: number;
  height?: number;
}

export function DeliveryIllustration({
  size,
  height: propHeight,
}: DeliveryIllustrationProps) {
  const { width: windowWidth } = useWindowDimensions();

  // Aspect ratio of the user-provided courier header image: 1024 / 560 = 1.82857
  const displayWidth = size || windowWidth;
  const displayHeight =
    propHeight || Math.round(displayWidth * (560 / 1024));

  return (
    <View style={[styles.container, { width: displayWidth, height: displayHeight }]}>
      <Image
        source={require("../../assets/images/courier_login_header.png")}
        style={styles.image}
        resizeMode="contain"
        accessibilityLabel="Floria Courier Delivery Header"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
