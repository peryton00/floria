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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Aspect ratio of the user-provided courier header image: 1024 / 560 = 1.82857
  const displayWidth = size || windowWidth;
  const displayHeight =
    propHeight || Math.min(Math.round(displayWidth * (560 / 1024)), 230);

  return (
    <View style={[styles.container, { width: displayWidth, height: displayHeight }]}>
      <Image
        source={require("../../assets/images/courier_login_header.png")}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel="Floria Courier Delivery Illustration"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-end",
    alignSelf: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
