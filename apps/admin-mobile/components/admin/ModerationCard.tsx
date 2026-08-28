import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatINR } from "../../lib/format";
import { StatusBadge } from "../ui/StatusBadge";
import { Button } from "../ui/Button";

export function ModerationCard({
  id,
  name,
  botanicalName,
  sellerName,
  pricePaise,
  status,
  onPublish,
  onFlag,
  processing = false,
}: {
  id: string;
  name: string;
  botanicalName?: string;
  sellerName?: string;
  pricePaise: number;
  status: string;
  onPublish?: () => void;
  onFlag?: () => void;
  processing?: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {botanicalName ? (
            <Text style={styles.botanical}>{botanicalName}</Text>
          ) : null}
          <Text style={styles.meta}>
            Nursery: {sellerName || "Partner"} • {formatINR(pricePaise)}
          </Text>
        </View>
        <StatusBadge status={status} />
      </View>

      <View style={styles.actionRow}>
        {status !== "published" && onPublish && (
          <Button
            label="Approve & Publish"
            variant="success"
            size="sm"
            loading={processing}
            onPress={onPublish}
            style={styles.actionBtn}
          />
        )}
        {status !== "flagged" && onFlag && (
          <Button
            label="Flag Specimen"
            variant="terracotta"
            size="sm"
            disabled={processing}
            onPress={onFlag}
            style={styles.actionBtn}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  botanical: {
    fontSize: 11,
    fontStyle: "italic",
    color: Colors.sage,
    marginTop: 2,
  },
  meta: {
    fontSize: 10,
    color: Colors.inkMuted,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
