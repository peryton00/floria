import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { formatDate } from "../../lib/format";

export function AuditLogItem({
  action,
  entityType,
  entityId,
  actorEmail,
  timestamp,
}: {
  action: string;
  entityType: string;
  entityId?: string;
  actorEmail?: string;
  timestamp: string;
}) {
  return (
    <View style={styles.item}>
      <View style={styles.dot} />
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.action}>
            {action.replace(/_/g, " ").toUpperCase()}
          </Text>
          <Text style={styles.time}>{formatDate(timestamp)}</Text>
        </View>
        <Text style={styles.entity}>
          Entity: <Text style={styles.highlight}>{entityType}</Text>{" "}
          {entityId ? `(#${entityId.substring(0, 8)})` : ""}
        </Text>
        {actorEmail ? (
          <Text style={styles.actor}>Actor: {actorEmail}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.forest,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  action: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    color: Colors.ink,
  },
  time: {
    fontSize: 10,
    color: Colors.inkMuted,
  },
  entity: {
    fontSize: 11,
    color: Colors.inkLight,
    marginTop: 2,
  },
  highlight: {
    fontWeight: "bold",
    color: Colors.forestDark,
  },
  actor: {
    fontSize: 10,
    color: Colors.sage,
    marginTop: 2,
  },
});
