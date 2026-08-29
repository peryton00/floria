import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { AuditLogItem } from "../../components/admin/AuditLogItem";
import { LoadingState } from "../../components/ui/LoadingState";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";

export default function AuditLogsScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getAuditLogs({ limit: 50 });
      if (res.success && res.data) {
        setLogs(res.data);
      } else {
        setError(res.error?.message || "Failed to load audit trail.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to audit repository.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.notice, { flexDirection: "row", alignItems: "center", gap: 6 }]}>
        <Ionicons name="lock-closed-outline" size={13} color={Colors.inkMuted} />
        <Text style={styles.noticeText}>
          Cryptographically logged administrative mutations & security events.
        </Text>
      </View>

      {loading && !refreshing ? (
        <LoadingState message="Loading immutable audit trail..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No Audit Logs Recorded"
          message="Administrative approvals, status changes, and logins are recorded here."
          actionLabel="Refresh Logs"
          onAction={fetchLogs}
        />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item, idx) => item.id || String(idx)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.forest]}
            />
          }
          renderItem={({ item }) => (
            <AuditLogItem
              action={item.action || "MUTATION"}
              entityType={item.entity_type || item.resource || "SYSTEM"}
              entityId={item.entity_id || item.target_id}
              actorEmail={item.actor_email || item.actor_id}
              timestamp={item.created_at || new Date().toISOString()}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  notice: {
    backgroundColor: Colors.sand,
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  noticeText: {
    fontSize: 11,
    color: Colors.inkLight,
    fontWeight: "600",
    textAlign: "center",
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
});
