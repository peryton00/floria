import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

export default function SellerInspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [seller, setSeller] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchSeller = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await api.getAdminSellerById(id);
      if (res.success && res.data) {
        setSeller(res.data);
      } else {
        setError(res.error?.message || "Failed to load seller profile.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to seller registry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSeller();
  }, [fetchSeller]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSeller();
  };

  const handleAction = async (
    actionType: "approve" | "reject" | "suspend" | "reactivate",
  ) => {
    if (!id) return;

    Alert.alert(
      `Confirm ${actionType.toUpperCase()}`,
      `Are you sure you want to ${actionType} this nursery partner?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style:
            actionType === "suspend" || actionType === "reject"
              ? "destructive"
              : "default",
          onPress: async () => {
            try {
              setProcessing(true);
              let res;
              if (actionType === "approve") res = await api.approveSeller(id);
              else if (actionType === "reject")
                res = await api.rejectSeller(id);
              else if (actionType === "suspend")
                res = await api.suspendSeller(id);
              else res = await api.reactivateSeller(id);

              if (res.success) {
                Alert.alert(
                  "Success",
                  `Seller status updated: ${actionType.toUpperCase()}`,
                );
                await fetchSeller();
              } else {
                Alert.alert(
                  "Error",
                  res.error?.message || `Failed to ${actionType} seller.`,
                );
              }
            } catch (e: any) {
              Alert.alert("Error", e.message || "Request failed.");
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    );
  };

  if (loading && !refreshing) {
    return <LoadingState message="Loading nursery dossier..." />;
  }

  if (error || !seller) {
    return (
      <ErrorState
        message={error || "Nursery record not found."}
        onRetry={fetchSeller}
      />
    );
  }

  const status = seller.verification_status || seller.status || "pending";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.forest]}
        />
      }
    >
      {/* Dossier Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={styles.partnerName}>
              {seller.business_name || seller.name || "Nursery Partner"}
            </Text>
            <Text style={styles.ownerText}>
              {seller.owner_name ||
                seller.contact_name ||
                "Authorized Representative"}
            </Text>
          </View>
          <StatusBadge status={status} />
        </View>
      </View>

      {/* Governance Controls */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Administrative Action</Text>
        <View style={styles.actionGrid}>
          {status === "pending" && (
            <>
              <Button
                label="Approve Nursery"
                variant="success"
                loading={processing}
                onPress={() => handleAction("approve")}
                style={styles.btn}
              />
              <Button
                label="Reject Application"
                variant="danger"
                disabled={processing}
                onPress={() => handleAction("reject")}
                style={styles.btn}
              />
            </>
          )}

          {status === "approved" && (
            <Button
              label="Suspend Nursery"
              variant="danger"
              loading={processing}
              onPress={() => handleAction("suspend")}
              style={styles.btn}
            />
          )}

          {status === "suspended" && (
            <Button
              label="Reactivate Nursery"
              variant="success"
              loading={processing}
              onPress={() => handleAction("reactivate")}
              style={styles.btn}
            />
          )}
        </View>
      </View>

      {/* Verification Details */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Nursery Location & Compliance</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>City / Zone</Text>
          <Text style={styles.infoVal}>{seller.city || "Bengaluru"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Primary Phone</Text>
          <Text style={styles.infoVal}>{seller.phone || "—"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoVal}>{seller.email || "—"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hyperlocal Dispatch</Text>
          <Text
            style={[
              styles.infoVal,
              { color: Colors.forest, fontWeight: "bold" },
            ]}
          >
            ACTIVE (4hr)
          </Text>
        </View>
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
  headerCard: {
    backgroundColor: Colors.forestDark,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  partnerName: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.white,
  },
  ownerText: {
    fontSize: 11,
    color: Colors.botanical,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    marginBottom: Spacing.xs,
  },
  actionGrid: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  btn: {
    width: "100%",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  infoLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
  },
  infoVal: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: "600",
    color: Colors.ink,
  },
});
