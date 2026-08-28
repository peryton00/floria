import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR } from "../../lib/format";

export function InventoryStockRow({
  productId,
  name,
  sku,
  pricePaise,
  stockQuantity,
  lowStockThreshold = 5,
  onUpdateStock,
}: {
  productId: string;
  name: string;
  sku?: string;
  pricePaise: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  onUpdateStock: (newStock: number) => void;
}) {
  const isLowStock = stockQuantity > 0 && stockQuantity <= lowStockThreshold;
  const isOutOfStock = stockQuantity <= 0;

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.price}>{formatINR(pricePaise)}</Text>
          {sku ? <Text style={styles.sku}>SKU: {sku}</Text> : null}
        </View>

        <View style={styles.badgeRow}>
          {isOutOfStock ? (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
            </View>
          ) : isLowStock ? (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>
                LOW STOCK ({stockQuantity})
              </Text>
            </View>
          ) : (
            <View style={styles.inStockBadge}>
              <Text style={styles.inStockText}>IN STOCK</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.stepperContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onUpdateStock(Math.max(0, stockQuantity - 1))}
          style={styles.stepperBtn}
        >
          <Text style={styles.stepperBtnText}>−</Text>
        </TouchableOpacity>

        <Text style={styles.quantityVal}>{stockQuantity}</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onUpdateStock(stockQuantity + 1)}
          style={styles.stepperBtn}
        >
          <Text style={styles.stepperBtnText}>+</Text>
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
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  info: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  name: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 2,
  },
  price: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.forest,
  },
  sku: {
    fontSize: 10,
    color: Colors.inkMuted,
  },
  badgeRow: {
    marginTop: 4,
  },
  inStockBadge: {
    backgroundColor: Colors.botanical,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  inStockText: {
    fontSize: 9,
    fontWeight: "bold",
    color: Colors.forestDark,
  },
  lowStockBadge: {
    backgroundColor: Colors.warningBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  lowStockText: {
    fontSize: 9,
    fontWeight: "bold",
    color: Colors.warning,
  },
  outOfStockBadge: {
    backgroundColor: Colors.errorBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  outOfStockText: {
    fontSize: 9,
    fontWeight: "bold",
    color: Colors.error,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.sand,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.ink,
  },
  quantityVal: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    paddingHorizontal: 8,
    color: Colors.ink,
    minWidth: 28,
    textAlign: "center",
  },
});
