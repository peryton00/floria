import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
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
  const [modalVisible, setModalVisible] = useState(false);
  const [editQty, setEditQty] = useState(String(stockQuantity));

  const isLowStock = stockQuantity > 0 && stockQuantity <= lowStockThreshold;
  const isOutOfStock = stockQuantity <= 0;

  const handleOpenModal = () => {
    setEditQty(String(stockQuantity));
    setModalVisible(true);
  };

  const handleSaveModal = () => {
    const val = parseInt(editQty, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateStock(val);
    }
    setModalVisible(false);
  };

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

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpenModal}
          style={styles.qtyTouchWrap}
        >
          <Text style={styles.quantityVal}>{stockQuantity}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onUpdateStock(stockQuantity + 1)}
          style={styles.stepperBtn}
        >
          <Text style={styles.stepperBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Direct Stock Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Stock Quantity</Text>
            <Text style={styles.modalSubtitle} numberOfLines={1}>
              {name}
            </Text>

            <TextInput
              value={editQty}
              onChangeText={setEditQty}
              keyboardType="number-pad"
              style={styles.modalInput}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveModal}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveText}>Save Stock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  qtyTouchWrap: {
    minWidth: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  quantityVal: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: "bold",
    color: Colors.ink,
  },
  modalSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 2,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.ink,
    textAlign: "center",
    backgroundColor: Colors.sand,
    marginBottom: Spacing.md,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.linen,
  },
  modalCancelText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkMuted,
    fontWeight: "600",
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.forest,
  },
  modalSaveText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.white,
    fontWeight: "bold",
  },
});
