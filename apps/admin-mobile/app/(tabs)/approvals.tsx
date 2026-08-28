import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { api } from "../../lib/api";
import { Colors, Typography, Spacing, BorderRadius } from "../../lib/theme";
import { ApprovalCard } from "../../components/admin/ApprovalCard";
import { LoadingState } from "../../components/ui/LoadingState";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";

const FILTER_TABS = [
  { key: "pending", label: "Pending Review" },
  { key: "approved", label: "Approved Nurseries" },
  { key: "suspended", label: "Suspended" },
  { key: "all", label: "All Partners" },
];

export default function NurseryApprovalsScreen() {
  const [activeTab, setActiveTab] = useState("pending");
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchSellers = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getAdminSellers({
        status: activeTab !== "all" ? activeTab : undefined,
      });

      if (res.success && res.data) {
        setSellers(res.data);
      } else {
        setError(res.error?.message || "Failed to load seller applicants.");
      }
    } catch (err: any) {
      setError(
        err.message || "Failed to connect to seller governance gateway.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSellers();
  };

  const handleApprove = async (id: string) => {
    Alert.alert(
      "Confirm Approval",
      "Approve this nursery partner for live marketplace selling and hyperlocal dispatch?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve Nursery",
          onPress: async () => {
            try {
              setProcessingId(id);
              const res = await api.approveSeller(id);
              if (res.success) {
                Alert.alert("Approved", "Nursery partner has been activated.");
                await fetchSellers();
              } else {
                Alert.alert(
                  "Approval Error",
                  res.error?.message || "Could not approve partner.",
                );
              }
            } catch (e: any) {
              Alert.alert("Error", e.message || "Approval request failed.");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const handleReject = async (id: string) => {
    Alert.alert(
      "Confirm Rejection",
      "Reject this nursery application? This will notify the applicant.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject Application",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(id);
              const res = await api.rejectSeller(id);
              if (res.success) {
                Alert.alert("Rejected", "Application status updated.");
                await fetchSellers();
              } else {
                Alert.alert(
                  "Rejection Error",
                  res.error?.message || "Could not reject application.",
                );
              }
            } catch (e: any) {
              Alert.alert("Error", e.message || "Rejection request failed.");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsScroll}
          renderItem={({ item }) => {
            const isSelected = activeTab === item.key;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab(item.key)}
                style={[styles.tabChip, isSelected && styles.tabChipSelected]}
              >
                <Text
                  style={[styles.tabText, isSelected && styles.tabTextSelected]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <LoadingState message="Loading nursery compliance queue..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSellers} />
      ) : sellers.length === 0 ? (
        <EmptyState
          title="No Applicants in this Queue"
          message="New nursery registration requests will appear here for verification and licensing inspection."
          actionLabel="Refresh List"
          onAction={fetchSellers}
        />
      ) : (
        <FlatList
          data={sellers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.forest]}
            />
          }
          renderItem={({ item }) => (
            <ApprovalCard
              id={item.id}
              businessName={
                item.business_name || item.name || "Botanical Nursery"
              }
              ownerName={item.owner_name || item.contact_name}
              city={item.city || "Bengaluru"}
              phone={item.phone}
              status={item.verification_status || item.status || "pending"}
              processing={processingId === item.id}
              onApprove={() => handleApprove(item.id)}
              onReject={() => handleReject(item.id)}
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
  tabBar: {
    backgroundColor: Colors.linen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.xs,
  },
  tabsScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  tabChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.sand,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabChipSelected: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forestDark,
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabTextSelected: {
    color: Colors.white,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
});
