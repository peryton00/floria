import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { useFeedback } from "../../lib/contexts/FloriaFeedbackContext";
import { haptics } from "../../lib/haptics";
import { Button } from "../../components/ui/Button";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { EmptyState } from "../../components/ui/EmptyState";

export default function AddressManagementScreen() {
  const { showSuccess, showError, showWarning, showConfirmSheet } = useFeedback();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Raipur");
  const [state, setState] = useState("Chhattisgarh");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  const [locating, setLocating] = useState(false);

  // Radar Animation for GPS auto-fill
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const animRef = useRef<{ spin?: Animated.CompositeAnimation; pulse?: Animated.CompositeAnimation }>({});

  useEffect(() => {
    if (locating) {
      spinValue.setValue(0);
      const spinAnim = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );

      pulseValue.setValue(1);
      const pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.08,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );

      animRef.current = { spin: spinAnim, pulse: pulseAnim };
      spinAnim.start();
      pulseAnim.start();
    } else {
      animRef.current.spin?.stop();
      animRef.current.pulse?.stop();
    }

    return () => {
      animRef.current.spin?.stop();
      animRef.current.pulse?.stop();
    };
  }, [locating, spinValue, pulseValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showWarning("Please enable location permissions in settings to auto-detect your address.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = position.coords;

      // Primary: High-accuracy OpenStreetMap reverse geocoding (same accurate engine as website)
      try {
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
          {
            headers: {
              "User-Agent": "FloriaMobile/1.0",
            },
          },
        );
        const osmData = await osmRes.json();

        if (osmData && osmData.address) {
          const addr = osmData.address;
          const road =
            addr.road ||
            addr.street ||
            addr.neighbourhood ||
            addr.suburb ||
            addr.residential ||
            "";
          const house = addr.house_number || addr.building || addr.amenity || "";
          const line1 =
            [house, road].filter(Boolean).join(", ") ||
            addr.suburb ||
            addr.neighbourhood ||
            osmData.display_name?.split(",")[0] ||
            "";
          const detectedCity =
            addr.city || addr.town || addr.village || addr.county || "Raipur";
          const detectedState = addr.state || "Chhattisgarh";
          const detectedPincode = addr.postcode || "";

          if (line1) setStreet(line1);
          if (detectedCity) setCity(detectedCity);
          if (detectedState) setState(detectedState);
          if (detectedPincode) setPincode(detectedPincode);
          showSuccess("Delivery address autofilled from GPS");
          return;
        }
      } catch {
        // Fallback to Expo reverse geocoding
      }

      // Fallback: Expo Reverse Geocoding with clean formatting
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocode) {
        const rawStreet = [geocode.name, geocode.street]
          .filter(Boolean)
          .filter((s) => !/^\d+\/\d+/.test(s || "")) // Clean internal municipal division numbers
          .join(", ");

        const cleanStreet =
          rawStreet || geocode.subregion || geocode.district || "";

        if (cleanStreet) setStreet(cleanStreet);
        if (geocode.city) setCity(geocode.city);
        if (geocode.region) setState(geocode.region);
        if (geocode.postalCode) setPincode(geocode.postalCode);
        showSuccess("Delivery address autofilled from GPS");
      }
    } catch (err: any) {
      showError(err.message || "Could not fetch current GPS location.");
    } finally {
      setLocating(false);
    }
  };

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getAddresses();
      if (res.success && res.data) {
        setAddresses(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleOpenAdd = () => {
    setEditingAddressId(null);
    setName("");
    setStreet("");
    setCity("Raipur");
    setState("Chhattisgarh");
    setPincode("");
    setPhone("");
    setShowAddForm(true);
  };

  const handleEditAddress = (a: any) => {
    setEditingAddressId(a.id);
    setName(a.full_name || a.name || a.label || "");
    setStreet(a.line1 || a.street_address || a.address_line1 || "");
    setCity(a.city || "Raipur");
    setState(a.state || "Chhattisgarh");
    setPincode(a.pincode || "");
    setPhone(a.phone || "");
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingAddressId(null);
  };

  const handleSaveAddress = async () => {
    if (!name.trim()) {
      showError("Please enter recipient / residence name.");
      return;
    }
    if (!street.trim()) {
      showError("Please enter street address / apartment.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      showError("Please provide a valid contact phone number (min 8 digits).");
      return;
    }
    if (!city.trim()) {
      showError("Please enter city.");
      return;
    }
    if (!state.trim()) {
      showError("Please enter state.");
      return;
    }
    if (!pincode.trim() || pincode.trim().length < 3) {
      showError("Please enter a valid pincode.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        full_name: name.trim(),
        phone: phone.trim(),
        line1: street.trim(),
        line2: "",
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        is_default: editingAddressId
          ? addresses.find((i) => i.id === editingAddressId)?.is_default || false
          : addresses.length === 0,
        label: name.trim(),
      };

      const res = editingAddressId
        ? await api.updateAddress(editingAddressId, payload)
        : await api.createAddress(payload);

      if (res.success) {
        haptics.success();
        showSuccess(
          editingAddressId
            ? "Address updated successfully"
            : "Address saved to delivery destinations",
        );
        setShowAddForm(false);
        setEditingAddressId(null);
        setName("");
        setStreet("");
        setPincode("");
        setPhone("");
        await fetchAddresses();
      } else {
        haptics.error();
        showError(res.error?.message || "Failed to save address.");
      }
    } catch (e: any) {
      haptics.error();
      showError(e.message || "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    showConfirmSheet({
      title: "Remove Delivery Address",
      message: "Are you sure you want to delete this address? This action cannot be undone.",
      confirmLabel: "Delete Address",
      isDestructive: true,
      icon: "trash-outline",
      onConfirm: async () => {
        const res = await api.deleteAddress(id);
        if (res.success) {
          haptics.light();
          showSuccess("Address removed");
          fetchAddresses();
        } else {
          haptics.error();
          showError("Could not delete address. Please try again.");
        }
      },
    });
  };

  if (loading && addresses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Delivery Destinations</Text>
        </View>
        <ListSkeleton count={3} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>
          Delivery Destinations ({addresses.length})
        </Text>
        {!showAddForm && (
          <Button
            label="+ Add Address"
            size="sm"
            onPress={handleOpenAdd}
          />
        )}
      </View>

      {showAddForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editingAddressId ? "Edit Delivery Address" : "New Delivery Address"}
          </Text>

          {/* Animated GPS Button */}
          <Animated.View style={{ transform: [{ scale: locating ? pulseValue : 1 }] }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleUseCurrentLocation}
              disabled={locating}
              style={[styles.gpsButton, locating && styles.gpsButtonActive]}
            >
              {locating ? (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="sync" size={17} color={Colors.forest} />
                </Animated.View>
              ) : (
                <Ionicons name="navigate" size={16} color={Colors.forest} />
              )}
              <Text style={styles.gpsButtonText}>
                {locating
                  ? "Pinpointing accurate coordinates…"
                  : "Use Current Location (GPS Auto-Fill)"}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.field}>
            <Text style={styles.label}>Recipient / Residence Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Aditi Sharma"
              placeholderTextColor={Colors.inkSubtle}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Street Address / Apartment *</Text>
            <TextInput
              style={styles.input}
              placeholder="Flat 402, Green Glen Layout, Raipur"
              placeholderTextColor={Colors.inkSubtle}
              value={street}
              onChangeText={setStreet}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: Spacing.sm }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: Spacing.sm }]}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                placeholder="492001"
                placeholderTextColor={Colors.inkSubtle}
                keyboardType="numeric"
                value={pincode}
                onChangeText={setPincode}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                placeholderTextColor={Colors.inkSubtle}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          <View style={styles.formActions}>
            <Button
              label="Cancel"
              variant="outline"
              size="sm"
              onPress={handleCancelForm}
              style={{ flex: 1, marginRight: Spacing.sm }}
            />
            <Button
              label={editingAddressId ? "Update Address" : "Save Address"}
              size="sm"
              loading={saving}
              onPress={handleSaveAddress}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      {addresses.length === 0 && !showAddForm ? (
        <EmptyState
          title="No Delivery Addresses"
          message="Save your home, sanctuary, or workplace address for rapid botanical delivery."
          actionLabel="+ Add New Address"
          onAction={handleOpenAdd}
        />
      ) : (
        addresses.map((a) => (
          <View key={a.id} style={styles.addressCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.addressName}>
                {a.full_name || a.name || a.label || "Primary Residence"}
              </Text>
              {a.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>DEFAULT</Text>
                </View>
              )}
            </View>
            <Text style={styles.addressStreet}>
              {a.line1 || a.street_address || a.address_line1}
            </Text>
            <Text style={styles.addressCity}>
              {a.city}{a.state ? `, ${a.state}` : ""}, {a.pincode}
            </Text>
            {a.phone && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Ionicons name="call-outline" size={11} color={Colors.inkMuted} />
                <Text style={styles.phone}>{a.phone}</Text>
              </View>
            )}

            {/* Actions: Edit and Delete */}
            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleEditAddress(a)}
                style={styles.actionPillBtn}
              >
                <Ionicons name="pencil" size={12} color={Colors.forest} />
                <Text style={styles.actionEditText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleDelete(a.id)}
                style={styles.actionPillBtn}
              >
                <Ionicons name="trash-outline" size={12} color={Colors.error} />
                <Text style={styles.actionDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  formCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  formTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "Georgia",
    marginBottom: Spacing.sm,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.page,
    borderWidth: 1.2,
    borderColor: Colors.forest,
    borderRadius: BorderRadius.md,
    paddingVertical: 11,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    justifyContent: "center",
  },
  gpsButtonActive: {
    backgroundColor: "#E8F0EB",
    borderColor: Colors.forest,
  },
  gpsButtonText: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.forest,
    fontWeight: "bold",
  },
  field: {
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: "row",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.inkLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.page,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSizes.sm,
    color: Colors.ink,
  },
  formActions: {
    flexDirection: "row",
    marginTop: Spacing.sm,
  },
  addressCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  addressName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
  },
  defaultBadge: {
    backgroundColor: Colors.forest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  defaultText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "bold",
  },
  addressStreet: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  addressCity: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
    marginTop: 2,
  },
  phone: {
    fontSize: 11,
    color: Colors.inkMuted,
  },
  cardActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionEditText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.forest,
    fontWeight: "bold",
  },
  actionDeleteText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.error,
    fontWeight: "bold",
  },
});
