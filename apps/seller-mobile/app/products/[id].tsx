import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [botanicalName, setBotanicalName] = useState("");
  const [priceRupees, setPriceRupees] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [description, setDescription] = useState("");

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSellerProductById(id);
      if (res.success && res.data) {
        const prod = res.data.product || res.data;
        const inv = res.data.inventory || {};
        setName(prod.name || "");
        setBotanicalName(prod.botanical_name || "");
        setPriceRupees(
          String(
            Math.round((inv.price_paise || prod.price_paise || 129900) / 100),
          ),
        );
        setStockQuantity(
          String(inv.stock_quantity ?? prod.stock_quantity ?? 10),
        );
        setDescription(prod.description || "");
      } else {
        setError(res.error?.message || "Failed to load product details.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load product.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleUpdate = async () => {
    if (!id) return;
    const price = parseFloat(priceRupees);
    const stock = parseInt(stockQuantity, 10);

    if (isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
      Alert.alert(
        "Invalid Input",
        "Please enter valid price and stock quantity.",
      );
      return;
    }

    try {
      setSaving(true);
      const res = await api.updateSellerProduct(id, {
        name: name.trim(),
        botanical_name: botanicalName.trim() || undefined,
        description: description.trim() || undefined,
        price_paise: Math.round(price * 100),
        stock_quantity: stock,
      });

      if (res.success) {
        Alert.alert("Changes Saved", "Specimen listing updated successfully.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", res.error?.message || "Failed to update listing.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not save updates.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading specimen configuration..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchProduct} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <Text style={styles.title}>Edit Specimen Details</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Common Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Botanical Name</Text>
          <TextInput
            style={styles.input}
            value={botanicalName}
            onChangeText={setBotanicalName}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.label}>Price (₹ INR)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={priceRupees}
              onChangeText={setPriceRupees}
            />
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Stock Quantity</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={stockQuantity}
              onChangeText={setStockQuantity}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Botanical Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <Button
          label="Save Specimen Updates"
          loading={saving}
          onPress={handleUpdate}
          style={styles.submitBtn}
        />
      </View>
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
  formCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSizes.base,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: Spacing.md,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
});
