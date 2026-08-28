import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { CartItem } from "../../lib/contexts/CartContext";

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.nursery}>{item.nurseryName}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.price}>{formatINR(item.pricePaise)}</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.quantityStepper}>
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.quantity - 1)}
            style={styles.stepperButton}
          >
            <Text style={styles.stepperText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.quantity + 1)}
            style={styles.stepperButton}
          >
            <Text style={styles.stepperText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={18} color={Colors.inkMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  info: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  nursery: {
    fontSize: 10,
    color: Colors.sage,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 4,
  },
  price: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.forest,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  quantityStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.sand,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.ink,
  },
  quantityText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    paddingHorizontal: 8,
    color: Colors.ink,
  },
  removeButton: {
    padding: 6,
  },
  removeText: {
    color: Colors.inkMuted,
    fontSize: 14,
    fontWeight: "bold",
  },
});
