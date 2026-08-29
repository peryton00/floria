import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { useFeedback } from "../../lib/contexts/FloriaFeedbackContext";

export interface LocationSelectorProps {
  currentLocation?: string;
  onLocationChange?: (location: string) => void;
  compact?: boolean;
}

export function LocationSelector({
  currentLocation = "Raipur, Chhattisgarh",
  onLocationChange,
  compact = false,
}: LocationSelectorProps) {
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useFeedback();
  const [selectedLocation, setSelectedLocation] = useState(currentLocation);
  const [modalVisible, setModalVisible] = useState(false);
  const [locating, setLocating] = useState(false);

  const POPULAR_CITIES = [
    "Raipur, Chhattisgarh",
    "Bengaluru, Karnataka",
    "Mumbai, Maharashtra",
    "Delhi NCR",
    "Pune, Maharashtra",
    "Hyderabad, Telangana",
  ];

  const handleSelectCity = (city: string) => {
    setSelectedLocation(city);
    onLocationChange?.(city);
    showSuccess(`Delivery location set to ${city}`);
    setModalVisible(false);
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showWarning("Please enable location permissions in settings to auto-detect your delivery address.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (geocode) {
        const city = geocode.city || geocode.subregion || geocode.district || "Raipur";
        const region = geocode.region || geocode.country || "Chhattisgarh";
        const detected = `${city}, ${region}`;
        setSelectedLocation(detected);
        onLocationChange?.(detected);
        showSuccess(`Delivery location set to ${detected}`);
        setModalVisible(false);
      }
    } catch (err: any) {
      showError(err.message || "Could not fetch current GPS location.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        style={compact ? styles.compactContainer : styles.container}
      >
        {compact ? (
          <View style={styles.compactIconPill}>
            <Ionicons name="location-sharp" size={13} color={Colors.forest} />
          </View>
        ) : (
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={14} color={Colors.white} />
          </View>
        )}
        <View style={styles.textColumn}>
          <Text style={compact ? styles.compactDeliveryLabel : styles.deliveryLabel}>Deliver to</Text>
          <View style={styles.locationRow}>
            <Text style={compact ? styles.compactLocationText : styles.locationText} numberOfLines={1}>
              {selectedLocation.split(",")[0]}
            </Text>
            <Ionicons name="chevron-down" size={compact ? 11 : 12} color={Colors.forest} />
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Delivery Location</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={Colors.inkLight} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleUseCurrentLocation}
              disabled={locating}
              style={styles.gpsButton}
            >
              {locating ? (
                <ActivityIndicator size="small" color={Colors.forest} />
              ) : (
                <Ionicons name="navigate-outline" size={18} color={Colors.forest} />
              )}
              <View style={styles.gpsTextCol}>
                <Text style={styles.gpsTitle}>Use Current Location</Text>
                <Text style={styles.gpsSub}>Enable device GPS for pinpoint accuracy</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setModalVisible(false);
                router.push("/addresses" as any);
              }}
              style={styles.manageAddressBtn}
            >
              <Ionicons name="home-outline" size={18} color={Colors.forest} />
              <View style={styles.gpsTextCol}>
                <Text style={styles.gpsTitle}>Manage Saved Addresses</Text>
                <Text style={styles.gpsSub}>Add, edit, or set default delivery addresses</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={Colors.forest} />
            </TouchableOpacity>

            <Text style={styles.sectionHeading}>Select City</Text>
            {POPULAR_CITIES.map((city) => {
              const isSelected = selectedLocation === city;
              return (
                <TouchableOpacity
                  key={city}
                  activeOpacity={0.7}
                  onPress={() => handleSelectCity(city)}
                  style={[
                    styles.cityRow,
                    isSelected && styles.cityRowSelected,
                  ]}
                >
                  <Ionicons
                    name={isSelected ? "location" : "location-outline"}
                    size={16}
                    color={isSelected ? Colors.forest : Colors.inkMuted}
                    style={{ marginRight: Spacing.sm }}
                  />
                  <Text
                    style={[
                      styles.cityName,
                      isSelected && styles.cityNameSelected,
                    ]}
                  >
                    {city}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={Colors.forest}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  compactIconPill: {
    alignItems: "center",
    justifyContent: "center",
  },
  textColumn: {
    justifyContent: "center",
  },
  deliveryLabel: {
    fontSize: 10,
    color: Colors.inkMuted,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  compactDeliveryLabel: {
    fontSize: 8,
    color: Colors.inkMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    lineHeight: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "700",
    color: Colors.ink,
    maxWidth: 160,
  },
  compactLocationText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
    maxWidth: 110,
    lineHeight: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.page,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  closeBtn: {
    padding: 4,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.botanical,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  manageAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.linen,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  gpsTextCol: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "700",
    color: Colors.forest,
  },
  gpsSub: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: Colors.inkLight,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityRowSelected: {
    backgroundColor: Colors.linen,
  },
  cityName: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  cityNameSelected: {
    fontWeight: "700",
    color: Colors.forest,
  },
});
