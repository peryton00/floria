import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  ActivityIndicator,
  BackHandler,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";
import { MotionTokens } from "../motion";

export type FeedbackType = "success" | "error" | "warning" | "info";

export interface SnackbarAction {
  label: string;
  onPress: () => void;
}

export interface SnackbarOptions {
  message: string;
  subMessage?: string;
  type?: FeedbackType;
  action?: SnackbarAction;
  duration?: number;
  bottomOffset?: number;
}

export interface ConfirmSheetOptions {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface FloriaFeedbackContextType {
  showSnackbar: (options: SnackbarOptions | string, type?: FeedbackType) => void;
  showSuccess: (message: string, action?: SnackbarAction) => void;
  showError: (message: string, action?: SnackbarAction) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  showConfirmSheet: (options: ConfirmSheetOptions) => void;
  hideSnackbar: () => void;
  hideConfirmSheet: () => void;
}

const FloriaFeedbackContext = createContext<FloriaFeedbackContextType | undefined>(
  undefined,
);

export function FloriaFeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  // Snackbar State
  const [snackbar, setSnackbar] = useState<SnackbarOptions | null>(null);
  const snackbarTimeoutRef = useRef<any>(null);
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Confirm Sheet State
  const [confirmSheet, setConfirmSheet] = useState<ConfirmSheetOptions | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(300)).current;
  const sheetBackdropOpacity = useRef(new Animated.Value(0)).current;

  // --- Snackbar Animations ---
  const hideSnackbar = useCallback(() => {
    if (snackbarTimeoutRef.current) {
      clearTimeout(snackbarTimeoutRef.current);
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 80,
        duration: MotionTokens.duration.short,
        easing: MotionTokens.easing.accelerate,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: MotionTokens.duration.short,
        easing: MotionTokens.easing.accelerate,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSnackbar(null);
    });
  }, [translateY, opacity]);

  const showSnackbar = useCallback(
    (options: SnackbarOptions | string, type: FeedbackType = "info") => {
      if (snackbarTimeoutRef.current) {
        clearTimeout(snackbarTimeoutRef.current);
      }

      const opts: SnackbarOptions =
        typeof options === "string"
          ? { message: options, type }
          : { type: "info", ...options };

      setSnackbar(opts);

      // Animate In cleanly without bounce
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: MotionTokens.duration.short,
          easing: MotionTokens.easing.decelerate,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: MotionTokens.duration.short,
          easing: MotionTokens.easing.decelerate,
          useNativeDriver: true,
        }),
      ]).start();

      const autoDismissDuration = opts.duration || (opts.action ? 4000 : 3200);
      snackbarTimeoutRef.current = setTimeout(() => {
        hideSnackbar();
      }, autoDismissDuration);
    },
    [hideSnackbar, translateY, opacity],
  );

  const showSuccess = useCallback(
    (message: string, action?: SnackbarAction) => {
      showSnackbar({ message, type: "success", action });
    },
    [showSnackbar],
  );

  const showError = useCallback(
    (message: string, action?: SnackbarAction) => {
      showSnackbar({ message, type: "error", action });
    },
    [showSnackbar],
  );

  const showWarning = useCallback(
    (message: string) => {
      showSnackbar({ message, type: "warning" });
    },
    [showSnackbar],
  );

  const showInfo = useCallback(
    (message: string) => {
      showSnackbar({ message, type: "info" });
    },
    [showSnackbar],
  );

  // --- Confirm Sheet Animations ---
  const hideConfirmSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 300,
        duration: MotionTokens.duration.short,
        easing: MotionTokens.easing.accelerate,
        useNativeDriver: true,
      }),
      Animated.timing(sheetBackdropOpacity, {
        toValue: 0,
        duration: MotionTokens.duration.short,
        easing: MotionTokens.easing.accelerate,
        useNativeDriver: true,
      }),
    ]).start(() => {
      confirmSheet?.onCancel?.();
      setConfirmSheet(null);
      setConfirmLoading(false);
    });
  }, [sheetTranslateY, sheetBackdropOpacity, confirmSheet]);

  const showConfirmSheet = useCallback(
    (options: ConfirmSheetOptions) => {
      setConfirmSheet(options);
      setConfirmLoading(false);

      Animated.parallel([
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: MotionTokens.duration.standard,
          easing: MotionTokens.easing.decelerate,
          useNativeDriver: true,
        }),
        Animated.timing(sheetBackdropOpacity, {
          toValue: 1,
          duration: MotionTokens.duration.standard,
          easing: MotionTokens.easing.decelerate,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [sheetTranslateY, sheetBackdropOpacity],
  );

  const handleConfirmAction = async () => {
    if (!confirmSheet) return;
    try {
      setConfirmLoading(true);
      await confirmSheet.onConfirm();
    } finally {
      hideConfirmSheet();
    }
  };

  // Android Back button handler for confirm sheet
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const onBackPress = () => {
      if (confirmSheet) {
        hideConfirmSheet();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [confirmSheet, hideConfirmSheet]);

  // Icon and theme resolution for Snackbar
  const getSnackbarIcon = (type: FeedbackType = "info") => {
    switch (type) {
      case "success":
        return { name: "checkmark" as const, color: Colors.white, bg: Colors.forestLight };
      case "error":
        return { name: "alert-circle-outline" as const, color: Colors.white, bg: Colors.error };
      case "warning":
        return { name: "warning-outline" as const, color: Colors.ink, bg: Colors.warning };
      case "info":
      default:
        return { name: "leaf-outline" as const, color: Colors.white, bg: Colors.forestLight };
    }
  };

  const snackbarIcon = getSnackbarIcon(snackbar?.type);
  const bottomPosition =
    (snackbar?.bottomOffset !== undefined
      ? snackbar.bottomOffset
      : Math.max(insets.bottom, 0) + 68);

  return (
    <FloriaFeedbackContext.Provider
      value={{
        showSnackbar,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirmSheet,
        hideSnackbar,
        hideConfirmSheet,
      }}
    >
      {children}

      {/* Global Floria Snackbar */}
      {snackbar && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.snackbarContainer,
            {
              bottom: bottomPosition,
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <View style={styles.snackbarCard}>
            <View style={styles.snackbarLeftCol}>
              <View
                style={[
                  styles.snackbarIconBadge,
                  { backgroundColor: snackbarIcon.bg },
                ]}
              >
                <Ionicons
                  name={snackbarIcon.name}
                  size={14}
                  color={snackbarIcon.color}
                />
              </View>
              <View style={styles.snackbarTextCol}>
                <Text style={styles.snackbarMessage} numberOfLines={2}>
                  {snackbar.message}
                </Text>
                {snackbar.subMessage && (
                  <Text style={styles.snackbarSubMessage} numberOfLines={1}>
                    {snackbar.subMessage}
                  </Text>
                )}
              </View>
            </View>

            {snackbar.action && (
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => {
                  hideSnackbar();
                  snackbar.action?.onPress();
                }}
                style={styles.snackbarActionBtn}
              >
                <Text style={styles.snackbarActionText}>
                  {snackbar.action.label}
                </Text>
                <Ionicons name="arrow-forward" size={11} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Global Floria Confirmation Bottom Sheet */}
      <Modal
        visible={confirmSheet !== null}
        transparent
        animationType="none"
        onRequestClose={hideConfirmSheet}
      >
        <View style={styles.sheetOverlay}>
          <Animated.View
            style={[
              styles.sheetBackdrop,
              { opacity: sheetBackdropOpacity },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{ flex: 1 }}
              onPress={hideConfirmSheet}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheetContent,
              {
                paddingBottom: Math.max(insets.bottom, 0) + Spacing.md,
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Header Icon + Title */}
            <View style={styles.sheetHeader}>
              <View
                style={[
                  styles.sheetIconCircle,
                  confirmSheet?.isDestructive && styles.sheetIconCircleDestructive,
                ]}
              >
                <Ionicons
                  name={
                    confirmSheet?.icon ||
                    (confirmSheet?.isDestructive
                      ? "trash-outline"
                      : "help-circle-outline")
                  }
                  size={22}
                  color={
                    confirmSheet?.isDestructive ? Colors.error : Colors.forest
                  }
                />
              </View>
              <Text style={styles.sheetTitle}>{confirmSheet?.title}</Text>
            </View>

            {/* Body Explanation */}
            <Text style={styles.sheetMessage}>{confirmSheet?.message}</Text>

            {/* Actions */}
            <View style={styles.sheetActionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={confirmLoading}
                onPress={hideConfirmSheet}
                style={styles.sheetCancelBtn}
              >
                <Text style={styles.sheetCancelText}>
                  {confirmSheet?.cancelLabel || "Cancel"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={confirmLoading}
                onPress={handleConfirmAction}
                style={[
                  styles.sheetConfirmBtn,
                  confirmSheet?.isDestructive
                    ? styles.sheetConfirmBtnDestructive
                    : styles.sheetConfirmBtnPrimary,
                ]}
              >
                {confirmLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.sheetConfirmText}>
                    {confirmSheet?.confirmLabel || "Confirm"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </FloriaFeedbackContext.Provider>
  );
}

export function useFeedback(): FloriaFeedbackContextType {
  const context = useContext(FloriaFeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FloriaFeedbackProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  // Snackbar Styles
  snackbarContainer: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    elevation: 9999,
  },
  snackbarCard: {
    backgroundColor: Colors.forestDark || "#12241B",
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  snackbarLeftCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs + 3,
    flex: 1,
    marginRight: Spacing.sm,
  },
  snackbarIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  snackbarTextCol: {
    flex: 1,
  },
  snackbarMessage: {
    fontSize: Typography.fontSizes.xs + 1,
    fontWeight: "bold",
    color: Colors.white,
    lineHeight: 16,
  },
  snackbarSubMessage: {
    fontSize: 10,
    color: Colors.botanical,
    marginTop: 1,
  },
  snackbarActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.terracotta,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  snackbarActionText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xs,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // Bottom Sheet Styles
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.52)",
  },
  sheetContent: {
    backgroundColor: Colors.linen,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs + 2,
  },
  sheetIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetIconCircleDestructive: {
    backgroundColor: "#FEE2E2",
  },
  sheetTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: "bold",
    fontFamily: "Georgia",
    color: Colors.ink,
    flex: 1,
  },
  sheetMessage: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkLight,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  sheetActionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sheetCancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.page,
  },
  sheetCancelText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.inkLight,
  },
  sheetConfirmBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
  },
  sheetConfirmBtnPrimary: {
    backgroundColor: Colors.forest,
  },
  sheetConfirmBtnDestructive: {
    backgroundColor: Colors.error,
  },
  sheetConfirmText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "bold",
    color: Colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
