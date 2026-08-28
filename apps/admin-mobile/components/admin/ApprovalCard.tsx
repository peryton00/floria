import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { StatusBadge } from "../ui/StatusBadge";
import { Button } from "../ui/Button";

export function ApprovalCard({
  id,
  businessName,
  ownerName,
  city = "Bengaluru",
  phone,
  status,
  onApprove,
  onReject,
  processing = false,
}: {
  id: string;
  businessName: string;
  ownerName?: string;
  city?: string;
  phone?: string;
  status: string;
  onApprove?: () => void;
  onReject?: () => void;
  processing?: boolean;
}) {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/sellers/${id}` as any)}
        style={styles.header}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {businessName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {businessName}
          </Text>
          <Text style={styles.subtitle}>
            {ownerName ? `${ownerName} • ` : ""}📍 {city}
          </Text>
          {phone ? <Text style={styles.phone}>📞 {phone}</Text> : null}
        </View>
        <StatusBadge status={status} />
      </TouchableOpacity>

      {status === "pending" && onApprove && onReject && (
        <View style={styles.actionRow}>
          <Button
            label="Reject"
            variant="danger"
            size="sm"
            disabled={processing}
            onPress={onReject}
            style={styles.actionBtn}
          />
          <Button
            label="Approve Nursery"
            variant="success"
            size="sm"
            loading={processing}
            onPress={onApprove}
            style={styles.actionBtn}
          />
        </View>
      )}
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
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  avatarText: {
    color: Colors.white,
    fontWeight: "bold",
    fontSize: Typography.fontSizes.lg,
    fontFamily: "Georgia",
  },
  info: {
    flex: 1,
    paddingRight: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  phone: {
    fontSize: 10,
    color: Colors.sage,
    marginTop: 2,
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
