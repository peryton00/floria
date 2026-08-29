import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { EmptyState } from "../../components/ui/EmptyState";

export default function AddressManagementScreen() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Raipur");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  const [locating, setLocating] = useState(false);

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable location permissions to auto-detect your delivery address.",
        );
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
        const detectedStreet = [
          geocode.name,
          geocode.street,
          geocode.subregion,
        ]
          .filter(Boolean)
          .join(", ");
        if (detectedStreet) setStreet(detectedStreet);
        if (geocode.city || geocode.subregion) setCity(geocode.city || geocode.subregion || "Raipur");
        if (geocode.postalCode) setPincode(geocode.postalCode);
      }
    } catch (err: any) {
      Alert.alert(
        "Location Error",
        err.message || "Could not fetch current GPS location.",
      );
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

  const handleSaveAddress = async () => {
    if (!name || !street || !pincode) {
      Alert.alert(
        "Required Fields",
        "Please provide recipient name, street address, and pincode.",
      );
      return;
    }
    try {
      setSaving(true);
      const res = await api.createAddress({
        name,
        streetAddress: street,
        city,
        pincode,
        phone,
        isDefault: addresses.length === 0,
      });
      if (res.success) {
        setShowAddForm(false);
        setName("");
        setStreet("");
        setPincode("");
        setPhone("");
        await fetchAddresses();
      } else {
        Alert.alert("Error", res.error?.message || "Failed to save address.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Remove Address",
      "Are you sure you want to delete this delivery address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await api.deleteAddress(id);
            fetchAddresses();
          },
        },
      ],
    );
  };

  if (loading) {
    return <LoadingState message="Loading saved addresses..." />;
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
            onPress={() => setShowAddForm(true)}
          />
        )}
      </View>

      {showAddForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Delivery Address</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleUseCurrentLocation}
            disabled={locating}
            style={styles.gpsButton}
          >
            {locating ? (
              <Ionicons name="sync-outline" size={16} color={Colors.forest} />
            ) : (
              <Ionicons name="navigate-outline" size={16} color={Colors.forest} />
            )}
            <Text style={styles.gpsButtonText}>
              {locating ? "Detecting GPS Location..." : "Use Current Location (GPS Auto-Fill)"}
            </Text>
          </TouchableOpacity>

          <View style={styles.field}>
            <Text style={styles.label}>Recipient / Residence Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Home — Aditi Sharma"
              placeholderTextColor={Colors.inkSubtle}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Street Address / Apartment</Text>
            <TextInput
              style={styles.input}
              placeholder="Flat 402, Green Glen Layout, Bellandur"
              placeholderTextColor={Colors.inkSubtle}
              value={street}
              onChangeText={setStreet}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: Spacing.sm }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={styles.input}
                placeholder="560103"
                placeholderTextColor={Colors.inkSubtle}
                keyboardType="numeric"
                value={pincode}
                onChangeText={setPincode}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contact Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor={Colors.inkSubtle}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.formActions}>
            <Button
              label="Cancel"
              variant="outline"
              size="sm"
              onPress={() => setShowAddForm(false)}
              style={{ flex: 1, marginRight: Spacing.sm }}
            />
            <Button
              label="Save Address"
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
          onAction={() => setShowAddForm(true)}
        />
      ) : (
        addresses.map((a) => (
          <View key={a.id} style={styles.addressCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.addressName}>
                {a.name || a.full_name || "Primary Residence"}
              </Text>
              {a.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>DEFAULT</Text>
                </View>
              )}
            </View>
            <Text style={styles.addressStreet}>
              {a.street_address || a.address_line1}
            </Text>
            <Text style={styles.addressCity}>
              {a.city}, {a.pincode}
            </Text>
            {a.phone && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="call-outline" size={11} color={Colors.inkMuted} />
                <Text style={styles.phone}>{a.phone}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => handleDelete(a.id)}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteText}>Delete Address</Text>
            </TouchableOpacity>
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
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.base,
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
  },
  formTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: Spacing.sm,
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
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.page,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    fontSize: Typography.fontSizes.xs,
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
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  addressName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  defaultBadge: {
    backgroundColor: Colors.forest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  defaultText: {
    fontSize: 9,
    fontWeight: "bold",
    color: Colors.white,
  },
  addressStreet: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkLight,
    lineHeight: 16,
  },
  addressCity: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  phone: {
    fontSize: 10,
    color: Colors.sage,
    marginTop: 4,
    fontWeight: "600",
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.botanical,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gpsButtonText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    color: Colors.forest,
  },
  deleteBtn: {
    alignSelf: "flex-end",
    marginTop: Spacing.xs,
  },
  deleteText: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: "bold",
  },
});
