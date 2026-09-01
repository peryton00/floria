import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  BackHandler,
  Platform,
} from "react-native";
import { FloriaIcon } from "../../components/ui/FloriaIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";

export type FeedbackType = "success" | "error" | "warning" | "info";

export interface SnackbarAction {
  label: string;
  onPress: () => void;
}

export interface SnackbarConfig {
  message: string;
  type?: FeedbackType;
  duration?: number;
  action?: SnackbarAction;
}

export interface ConfirmSheetConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void> | void;
}

export interface SellerFeedbackContextValue {
  showSnackbar: (config: SnackbarConfig) => void;
  showSuccess: (message: string, action?: SnackbarAction) => void;
  showError: (message: string, action?: SnackbarAction) => void;
  showWarning: (message: string, action?: SnackbarAction) => void;
  showInfo: (message: string, action?: SnackbarAction) => void;
  confirmAction: (config: ConfirmSheetConfig) => void;
}

export interface ToastMethods {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

export interface SellerFeedbackContextType extends SellerFeedbackContextValue {
  toast: ToastMethods;
}

const SellerFeedbackContext = createContext<SellerFeedbackContextType | null>(null);

export function SellerFeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  // Snackbar State
  const [snackbar, setSnackbar] = useState<SnackbarConfig | null>(null);
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Confirm Sheet State
  const [confirmSheet, setConfirmSheet] = useState<ConfirmSheetConfig | null>(
    null,
  );
  const [confirmLoading, setConfirmLoading] = useState(false);

  const hideSnackbar = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateYAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSnackbar(null);
    });
  }, [translateYAnim, opacityAnim]);

  const showSnackbar = useCallback(
    (config: SnackbarConfig) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setSnackbar(config);
      translateYAnim.setValue(50);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = config.duration || (config.action ? 6000 : 3500);
      timeoutRef.current = setTimeout(() => {
        hideSnackbar();
      }, duration);
    },
    [translateYAnim, opacityAnim, hideSnackbar],
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
    (message: string, action?: SnackbarAction) => {
      showSnackbar({ message, type: "warning", action });
    },
    [showSnackbar],
  );

  const showInfo = useCallback(
    (message: string, action?: SnackbarAction) => {
      showSnackbar({ message, type: "info", action });
    },
    [showSnackbar],
  );

  const toast: ToastMethods = {
    success: (title: string, message?: string) => {
      showSuccess(message ? `${title}: ${message}` : title);
    },
    error: (title: string, message?: string) => {
      showError(message ? `${title}: ${message}` : title);
    },
    info: (title: string, message?: string) => {
      showInfo(message ? `${title}: ${message}` : title);
    },
    warning: (title: string, message?: string) => {
      showWarning(message ? `${title}: ${message}` : title);
    },
  };

  const confirmAction = useCallback((config: ConfirmSheetConfig) => {
    setConfirmSheet(config);
  }, []);

  const hideConfirmSheet = useCallback(() => {
    setConfirmSheet(null);
    setConfirmLoading(false);
  }, []);

  const handleExecuteConfirm = async () => {
    if (!confirmSheet) return;
    try {
      setConfirmLoading(true);
      await confirmSheet.onConfirm();
      hideConfirmSheet();
    } catch (err) {
      console.warn("[SellerFeedback] Confirmation handler error:", err);
      setConfirmLoading(false);
    }
  };

  // Hardware Back Handler for Android when Confirm Sheet is open
  useEffect(() => {
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

  const getSnackbarIcon = (type: FeedbackType = "info") => {
    switch (type) {
      case "success":
        return { name: "check_circle" as const, color: Colors.success };
      case "error":
        return { name: "warning" as const, color: Colors.error };
      case "warning":
        return { name: "warning" as const, color: Colors.warning };
      case "info":
      default:
        return { name: "info" as const, color: Colors.forest };
    }
  };

  return (
    <SellerFeedbackContext.Provider
      value={{
        showSnackbar,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        confirmAction,
        toast,
      }}
    >
      {children}

      {/* Floating Snackbar */}
      {snackbar && (
        <Animated.View
          style={[
            styles.snackbarContainer,
            {
              bottom: Math.max(insets.bottom + 65, 80),
              opacity: opacityAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          <View style={styles.snackbarContent}>
            <FloriaIcon
              name={getSnackbarIcon(snackbar.type).name}
              size={20}
              color={getSnackbarIcon(snackbar.type).color}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.snackbarText} numberOfLines={3}>
              {snackbar.message}
            </Text>
            {snackbar.action && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  hideSnackbar();
                  snackbar.action?.onPress();
                }}
                style={styles.actionButton}
              >
                <Text style={styles.actionText}>{snackbar.action.label}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Confirmation Bottom Modal */}
      <Modal
        visible={!!confirmSheet}
        transparent
        animationType="fade"
        onRequestClose={hideConfirmSheet}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.sheetContainer,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{confirmSheet?.title}</Text>
            <Text style={styles.sheetMessage}>{confirmSheet?.message}</Text>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={hideConfirmSheet}
                disabled={confirmLoading}
                style={[styles.sheetButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>
                  {confirmSheet?.cancelText || "Cancel"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleExecuteConfirm}
                disabled={confirmLoading}
                style={[
                  styles.sheetButton,
                  confirmSheet?.isDestructive
                    ? styles.destructiveButton
                    : styles.confirmButton,
                ]}
              >
                {confirmLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {confirmSheet?.confirmText || "Confirm"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SellerFeedbackContext.Provider>
  );
}

export function useSellerFeedback(): SellerFeedbackContextType {
  const context = useContext(SellerFeedbackContext);
  if (!context) {
    throw new Error(
      "useSellerFeedback must be used within a SellerFeedbackProvider",
    );
  }
  return context;
}

const styles = StyleSheet.create({
  snackbarContainer: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
  },
  snackbarContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.ink,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#3A3F45",
  },
  snackbarText: {
    flex: 1,
    color: Colors.white,
    fontSize: Typography.fontSizes.sm,
    lineHeight: 18,
    fontWeight: "500",
  },
  actionButton: {
    marginLeft: Spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  actionText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xs,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: Colors.page,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: Typography.fontSizes.lg,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: Spacing.xs,
  },
  sheetMessage: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.inkLight,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  sheetActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sheetButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Colors.linen,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "600",
    color: Colors.ink,
  },
  confirmButton: {
    backgroundColor: Colors.forest,
  },
  destructiveButton: {
    backgroundColor: Colors.error,
  },
  confirmButtonText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: "700",
    color: Colors.white,
  },
});
