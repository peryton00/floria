import { StyleSheet, Text, View } from "react-native";

// @floria/delivery-mobile — Architecture boundary placeholder
// Future: assigned deliveries, navigation, pickup, delivery status updates,
// customer contact, proof of delivery (photo), delivery history,
// push notifications, location tracking, offline resilience.
// All data: @floria/api-client → @floria/api → Supabase PostgreSQL.
// NOTE: Location and camera permissions are declared in app.json.
// Add expo-location and expo-camera when implementing those features.

export default function DeliveryHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Floria Delivery</Text>
      <Text style={styles.subtitle}>Delivery Partner App</Text>
      <Text style={styles.body}>
        Architecture boundary established.{"\n"}
        Feature development begins in the next phase.
      </Text>
      <Text style={styles.note}>
        @floria/delivery-mobile → @floria/api-client → @floria/api
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 24 },
  body: { fontSize: 14, textAlign: "center", marginBottom: 16, lineHeight: 22 },
  note: { fontSize: 11, color: "#999", fontFamily: "monospace" },
});
