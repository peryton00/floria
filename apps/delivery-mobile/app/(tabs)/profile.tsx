// Floria Delivery Mobile — Courier Profile & Account Screen
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeliveryAuth } from "../../lib/contexts/DeliveryAuthContext";
import { theme } from "../../lib/theme";
import { FloriaIcon } from "../../components/ui/FloriaIcon";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, role, signOut } = useDeliveryAuth();
  const [onDuty, setOnDuty] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Support Modal State
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [supportTopic, setSupportTopic] = useState("Route / Navigation Issue");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  const courierName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Authorized Courier";

  const courierId = user?.id
    ? `FLR-DRV-${user.id.slice(0, 6).toUpperCase()}`
    : "FLR-DRV-008241";

  const initial = (courierName[0] || "C").toUpperCase();

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out of Dispatch",
      "Are you sure you want to sign out? You will stop receiving operational route notifications until you log in again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              setSigningOut(true);
              await signOut();
              router.replace("/(auth)/login");
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to sign out.");
            } finally {
              setSigningOut(false);
            }
          },
        },
      ],
    );
  };

  const handleSendSupport = () => {
    if (!supportMessage.trim()) {
      Alert.alert("Required", "Please describe the issue for Floria Dispatch.");
      return;
    }
    setSupportSubmitted(true);
    setTimeout(() => {
      setSupportSubmitted(false);
      setSupportMessage("");
      setSupportModalVisible(false);
      Alert.alert(
        "Ticket Logged",
        "Floria Operations Dispatch has received your ticket. A dispatch lead will contact you.",
      );
    }, 600);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Driver Identity Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          <Text style={styles.userName}>{courierName}</Text>
          <Text style={styles.courierIdText}>{courierId}</Text>
          <Text style={styles.userEmail}>{user?.email || "courier@floria.in"}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <FloriaIcon
                name="shield"
                size={12}
                color={theme.colors.forest}
                weight="fill"
              />
              <Text style={styles.roleText}>
                {(role || "COURIER").toUpperCase()} PARTNER
              </Text>
            </View>

            <View style={styles.verifiedBadge}>
              <FloriaIcon
                name="check_circle"
                size={12}
                color={theme.colors.forest}
                weight="bold"
              />
              <Text style={styles.verifiedText}>VERIFIED</Text>
            </View>
          </View>
        </View>

        {/* ── 2. Dispatch Operational Status ── */}
        <Text style={styles.sectionTitle}>OPERATIONAL STATUS</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Dispatch Availability</Text>
              <Text style={styles.settingSubtitle}>
                {onDuty
                  ? "Active — Available for nursery pickups & drop-offs"
                  : "Paused — Not receiving new delivery assignments"}
              </Text>
            </View>
            <Switch
              value={onDuty}
              onValueChange={setOnDuty}
              trackColor={{
                false: theme.colors.divider,
                true: theme.colors.forest,
              }}
              thumbColor={theme.colors.white}
              accessibilityLabel="Toggle dispatch duty status"
            />
          </View>
        </View>

        {/* ── 3. Partner Logistics Information ── */}
        <Text style={styles.sectionTitle}>LOGISTICS ASSIGNMENT</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Regional Hub</Text>
            <Text style={styles.infoValue}>Bengaluru South Botanical Cluster</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle Classification</Text>
            <Text style={styles.infoValue}>Two Wheeler (Cargo Box)</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Compensation Model</Text>
            <Text style={styles.infoValue}>Weekly Direct Deposit (Tue)</Text>
          </View>
        </View>

        {/* ── 4. Quick Actions & Support ── */}
        <Text style={styles.sectionTitle}>SUPPORT & DISPATCH HELP</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.75}
            onPress={() => setSupportModalVisible(true)}
          >
            <View style={styles.actionLeft}>
              <FloriaIcon name="chat" size={18} color={theme.colors.forest} />
              <Text style={styles.actionLabel}>Report Dispatch / Route Issue</Text>
            </View>
            <FloriaIcon name="chevron_right" size={16} color={theme.colors.muted} />
          </TouchableOpacity>

          <View style={styles.infoDivider} />

          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.75}
            onPress={() =>
              Alert.alert(
                "Floria Logistics Support",
                "Operations Helpline: 1800-FLORIA-DELIVERY\nAvailable 7:00 AM - 9:00 PM IST daily.",
              )
            }
          >
            <View style={styles.actionLeft}>
              <FloriaIcon name="phone" size={18} color={theme.colors.forest} />
              <Text style={styles.actionLabel}>Contact Regional Hub Lead</Text>
            </View>
            <FloriaIcon name="chevron_right" size={16} color={theme.colors.muted} />
          </TouchableOpacity>
        </View>

        {/* ── 5. Sign Out Button ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          <FloriaIcon name="logout" size={16} color={theme.colors.terracotta} />
          <Text style={styles.signOutText}>
            {signingOut ? "SIGNING OUT…" : "SIGN OUT OF DISPATCH"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Support Modal */}
      <Modal
        visible={supportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Dispatch Issue</Text>
              <TouchableOpacity onPress={() => setSupportModalVisible(false)}>
                <FloriaIcon name="close" size={20} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Select the issue category and describe the situation for regional dispatch.
            </Text>

            <View style={styles.categoryRow}>
              {[
                "Route / Navigation",
                "Nursery Pickup Delay",
                "Customer Unavailable",
                "Vehicle / Other",
              ].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSupportTopic(cat)}
                  style={[
                    styles.catChip,
                    supportTopic === cat && styles.catChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      supportTopic === cat && styles.catChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.textArea}
              placeholder="Provide details (e.g. Order #, landmark, problem description)..."
              placeholderTextColor={theme.colors.muted}
              multiline
              numberOfLines={4}
              value={supportMessage}
              onChangeText={setSupportMessage}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.modalSubmitBtn}
              onPress={handleSendSupport}
            >
              <Text style={styles.modalSubmitBtnText}>SUBMIT TO DISPATCH</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  content: {
    padding: theme.spacing.lg,
  },
  profileCard: {
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.md,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.forest,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 28,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.forest,
    marginBottom: 2,
  },
  courierIdText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.terracotta,
    letterSpacing: 0.6,
    marginBottom: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  userEmail: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
  },
  badgeRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.botanicalGreen,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    gap: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.forest,
    letterSpacing: 0.6,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.sand,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.forest,
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.muted,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.linen,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingTextGroup: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.charcoal,
  },
  settingSubtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.xs + 2,
  },
  infoLabel: {
    fontSize: 13,
    color: theme.colors.muted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.charcoal,
  },
  infoDivider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: 4,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.charcoal,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FDF2F0",
    borderWidth: 1,
    borderColor: "#F5C2BC",
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.terracotta,
    letterSpacing: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30, 58, 43, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: theme.colors.linen,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  modalSub: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  catChip: {
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.sand,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  catChipActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.muted,
  },
  catChipTextActive: {
    color: theme.colors.white,
  },
  textArea: {
    backgroundColor: theme.colors.sand,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: 13,
    color: theme.colors.charcoal,
    textAlignVertical: "top",
    minHeight: 90,
    marginBottom: theme.spacing.lg,
  },
  modalSubmitBtn: {
    backgroundColor: theme.colors.terracotta,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  modalSubmitBtnText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
});
