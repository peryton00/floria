import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";

interface ContactFloriaModalProps {
  visible: boolean;
  onClose: () => void;
  sellerName?: string;
  sellerId?: string;
}

export function ContactFloriaModal({
  visible,
  onClose,
  sellerName,
  sellerId,
}: ContactFloriaModalProps) {
  const handleCall = async () => {
    const phoneNumber = "tel:+918001234567";
    try {
      const supported = await Linking.canOpenURL(phoneNumber);
      if (supported) {
        await Linking.openURL(phoneNumber);
      } else {
        Alert.alert("Partner Care Hotline", "Call us directly at: +91 800 123 4567");
      }
    } catch {
      Alert.alert("Partner Care Hotline", "Call us directly at: +91 800 123 4567");
    }
  };

  const handleWhatsApp = async () => {
    const message = encodeURIComponent(
      `Hello Floria Care, I am checking the status of my nursery application (${sellerName || "Nursery Partner"}${sellerId ? ` ID: ${sellerId}` : ""}).`,
    );
    const whatsappUrl = `https://wa.me/918001234567?text=${message}`;
    try {
      await Linking.openURL(whatsappUrl);
    } catch {
      Alert.alert("WhatsApp Support", "Please message +91 800 123 4567 on WhatsApp.");
    }
  };

  const handleEmail = async () => {
    const subject = encodeURIComponent(
      `Nursery Partner Verification Support: ${sellerName || "Application"}${sellerId ? ` [${sellerId}]` : ""}`,
    );
    const emailUrl = `mailto:care@floria.in?subject=${subject}`;
    try {
      await Linking.openURL(emailUrl);
    } catch {
      Alert.alert("Partner Email Support", "Email us at: care@floria.in");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="headset" size={24} color="#2D5A3C" />
            </View>
            <Text style={styles.title}>Floria Partner Care</Text>
            <Text style={styles.subtitle}>
              Our dedicated nursery onboarding desk is available to assist you with verification, compliance, and catalog onboarding.
            </Text>
          </View>

          {/* Action Options */}
          <View style={styles.actionsList}>
            {/* Phone Call */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.actionItem}
              onPress={handleCall}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: "#EAF2EC" }]}>
                <Ionicons name="call" size={20} color="#2D5A3C" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Call Partner Desk</Text>
                <Text style={styles.actionSub}>+91 800 123 4567 • Mon-Sat, 9am - 7pm</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* WhatsApp */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.actionItem}
              onPress={handleWhatsApp}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: "#E6F7ED" }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Chat on WhatsApp</Text>
                <Text style={styles.actionSub}>Instant support & document assistance</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.actionItem}
              onPress={handleEmail}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: "#F1F5F9" }]}>
                <Ionicons name="mail" size={20} color="#475569" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Email Partner Support</Text>
                <Text style={styles.actionSub}>care@floria.in • Response in 2-4 hrs</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    color: "#0F172A",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  actionsList: {
    gap: 10,
    marginBottom: Spacing.lg,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: BorderRadius.lg,
    padding: 12,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  actionSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  closeButton: {
    paddingVertical: 12,
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
