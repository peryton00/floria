import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSellerFeedback } from "../../lib/contexts/SellerFeedbackContext";
import { Colors, Typography, BorderRadius, Spacing } from "../../lib/theme";
import { Button } from "../../components/ui/Button";

interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const INITIAL_SCHEDULE: DaySchedule[] = [
  { day: "Monday", isOpen: true, openTime: "08:00 AM", closeTime: "07:00 PM" },
  { day: "Tuesday", isOpen: true, openTime: "08:00 AM", closeTime: "07:00 PM" },
  { day: "Wednesday", isOpen: true, openTime: "08:00 AM", closeTime: "07:00 PM" },
  { day: "Thursday", isOpen: true, openTime: "08:00 AM", closeTime: "07:00 PM" },
  { day: "Friday", isOpen: true, openTime: "08:00 AM", closeTime: "07:00 PM" },
  { day: "Saturday", isOpen: true, openTime: "08:00 AM", closeTime: "08:00 PM" },
  { day: "Sunday", isOpen: true, openTime: "09:00 AM", closeTime: "06:00 PM" },
];

export default function OperatingHoursScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess } = useSellerFeedback();

  const [schedule, setSchedule] = useState<DaySchedule[]>(INITIAL_SCHEDULE);
  const [saving, setSaving] = useState<boolean>(false);

  const toggleDay = (index: number) => {
    setSchedule((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, isOpen: !item.isOpen } : item,
      ),
    );
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showSuccess("Nursery operating hours saved.");
      router.back();
    }, 400);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
      >
        <Text style={styles.headerSubtitle}>
          Set the hours when your nursery is open for customer order preparation and courier pickup.
        </Text>

        <View style={styles.scheduleCard}>
          {schedule.map((item, index) => (
            <View
              key={item.day}
              style={[
                styles.dayRow,
                index === schedule.length - 1 && styles.lastDayRow,
              ]}
            >
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{item.day}</Text>
                <Text style={styles.timeText}>
                  {item.isOpen ? `${item.openTime} – ${item.closeTime}` : "Closed"}
                </Text>
              </View>

              <Switch
                value={item.isOpen}
                onValueChange={() => toggleDay(index)}
                trackColor={{ false: Colors.sand, true: Colors.forest }}
                thumbColor={Colors.white}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label="Save Hours"
          variant="primary"
          size="lg"
          loading={saving}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.page,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  headerSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  scheduleCard: {
    backgroundColor: Colors.linen,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastDayRow: {
    borderBottomWidth: 0,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.ink,
  },
  timeText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.inkMuted,
    marginTop: 2,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.linen,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
});
