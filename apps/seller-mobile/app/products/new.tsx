import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { Button } from "../../components/ui/Button";

export default function NewProductScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [botanicalName, setBotanicalName] = useState("");
  const [description, setDescription] = useState("");
  const [priceRupees, setPriceRupees] = useState("1299");
  const [stockQuantity, setStockQuantity] = useState("10");
  const [careLevel, setCareLevel] = useState("EASY");
  const [creating, setCreating] = useState(false);

  const handleCreateProduct = async () => {
    if (!name.trim()) {
      Alert.alert("Required Field", "Please enter the plant specimen name.");
      return;
    }

    const price = parseFloat(priceRupees);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price in INR.");
      return;
    }

    const stock = parseInt(stockQuantity, 10);
    if (isNaN(stock) || stock < 0) {
      Alert.alert("Invalid Stock", "Please enter a valid stock quantity.");
      return;
    }

    try {
      setCreating(true);
      const res = await api.createSellerProduct({
        name: name.trim(),
        botanical_name: botanicalName.trim() || undefined,
        description: description.trim() || undefined,
        price_paise: Math.round(price * 100),
        stock_quantity: stock,
        care_level: careLevel,
      });

      if (res.success) {
        Alert.alert(
          "Specimen Created",
          "Plant listing created and added to nursery catalog.",
          [{ text: "Done", onPress: () => router.back() }],
        );
      } else {
        Alert.alert(
          "Creation Error",
          res.error?.message || "Failed to create product listing.",
        );
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not publish plant specimen.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <Text style={styles.title}>Publish Botanical Specimen</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Common Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ficus Lyrata (Fiddle Leaf Fig)"
            placeholderTextColor={Colors.inkSubtle}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Botanical / Scientific Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ficus lyrata Warb."
            placeholderTextColor={Colors.inkSubtle}
            value={botanicalName}
            onChangeText={setBotanicalName}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.label}>Selling Price (₹ INR) *</Text>
            <TextInput
              style={styles.input}
              placeholder="1299"
              placeholderTextColor={Colors.inkSubtle}
              keyboardType="numeric"
              value={priceRupees}
              onChangeText={setPriceRupees}
            />
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Stock Quantity *</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor={Colors.inkSubtle}
              keyboardType="numeric"
              value={stockQuantity}
              onChangeText={setStockQuantity}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Care Level</Text>
          <View style={styles.careButtons}>
            {["EASY", "MODERATE", "EXPERT"].map((lvl) => {
              const isSelected = careLevel === lvl;
              return (
                <Button
                  key={lvl}
                  label={lvl}
                  size="sm"
                  variant={isSelected ? "primary" : "outline"}
                  onPress={() => setCareLevel(lvl)}
                  style={{ flex: 1, marginHorizontal: 2 }}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Botanical Description & Care</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe foliage characteristics, watering requirements, and ideal lighting conditions..."
            placeholderTextColor={Colors.inkSubtle}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <Button
          label="Publish to Floria Marketplace"
          loading={creating}
          onPress={handleCreateProduct}
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
  careButtons: {
    flexDirection: "row",
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
});
