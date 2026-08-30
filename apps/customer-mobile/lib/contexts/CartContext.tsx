import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useRouter } from "expo-router";
import { useFeedback } from "./FloriaFeedbackContext";
import { haptics } from "../haptics";
import { StorageService, STORAGE_KEYS } from "../storage";
import { api } from "../api";

export interface CartItem {
  productId: string;
  nurseryId: string;
  nurseryName: string;
  name: string;
  pricePaise: number;
  quantity: number;
  imageUrl?: string;
  isFreeDelivery?: boolean;
}

export interface DeliveryConfig {
  deliveryEnabled: boolean;
  baseDeliveryFeePaise: number;
  freeDeliveryEnabled: boolean;
  freeDeliveryThresholdPaise: number;
}

export interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotalPaise: number;
  deliveryFeePaise: number;
  maintenanceFeePaise: number;
  totalPaise: number;
  isFreeDelivery: boolean;
  freeDeliveryThresholdPaise: number;
  freeDeliveryRemainingPaise: number;
  deliverySettings: DeliveryConfig;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  refreshSettings: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { showSuccess, showSnackbar } = useFeedback();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Platform delivery & financial fee settings
  const [deliverySettings, setDeliverySettings] = useState<DeliveryConfig>({
    deliveryEnabled: true,
    baseDeliveryFeePaise: 4000, // ₹40.00 standard base delivery fee
    freeDeliveryEnabled: true,
    freeDeliveryThresholdPaise: 99900, // ₹999.00 free delivery threshold
  });
  const [maintenanceFeePaise, setMaintenanceFeePaise] = useState(1000); // ₹10.00 platform maintenance fee

  // Fetch live server platform fee settings
  const refreshSettings = useCallback(async () => {
    try {
      const [dRes, fRes] = await Promise.allSettled([
        api.getDeliverySettings(),
        api.getFinancialSettings(),
      ]);

      if (dRes.status === "fulfilled" && dRes.value?.success && dRes.value.data) {
        const dData = dRes.value.data as any;
        setDeliverySettings({
          deliveryEnabled: dData.deliveryEnabled !== false,
          baseDeliveryFeePaise: typeof dData.baseDeliveryFeePaise === "number" ? dData.baseDeliveryFeePaise : 4000,
          freeDeliveryEnabled: dData.freeDeliveryEnabled !== false,
          freeDeliveryThresholdPaise: typeof dData.freeDeliveryThresholdPaise === "number" ? dData.freeDeliveryThresholdPaise : 99900,
        });
      }

      if (fRes.status === "fulfilled" && fRes.value?.success && fRes.value.data) {
        const fData = fRes.value.data as any;
        if (typeof fData.platformMaintenanceFeePaise === "number") {
          setMaintenanceFeePaise(fData.platformMaintenanceFeePaise);
        }
      }
    } catch {
      // Retain robust standard defaults
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // 1. Initial cart hydration from storage
  useEffect(() => {
    StorageService.getItem<CartItem[]>(STORAGE_KEYS.CART, []).then((saved) => {
      if (Array.isArray(saved) && saved.length > 0) {
        setItems(saved);
      }
      setIsHydrated(true);
    });
  }, []);

  // 2. Persist cart changes after initial hydration
  useEffect(() => {
    if (isHydrated) {
      StorageService.setItem(STORAGE_KEYS.CART, items);
    }
  }, [items, isHydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + quantity, isFreeDelivery: item.isFreeDelivery ?? i.isFreeDelivery }
              : i,
          );
        }
        return [...prev, { ...item, quantity }];
      });

      // Background sync with backend DB cart
      if (item.productId) {
        api.addToCart(item.productId, quantity).catch(() => null);
      }

      // Subtle tactile confirmation upon successful cart addition
      haptics.success();

      // Context-aware Floria feedback with "View Bag" routing
      showSuccess(
        `${quantity} × ${item.name} added to your bag`,
        {
          label: "View Bag",
          onPress: () => router.push("/(tabs)/cart" as any),
        },
      );
    },
    [showSuccess, router],
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      api.removeFromCart(productId).catch(() => null);
    } else {
      setItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
      );
      api.updateCartQuantity(productId, quantity).catch(() => null);
    }
  }, []);

  const removeItem = useCallback(
    (productId: string) => {
      let removedItem: CartItem | undefined;
      setItems((prev) => {
        removedItem = prev.find((i) => i.productId === productId);
        return prev.filter((i) => i.productId !== productId);
      });

      // Background sync with backend
      api.removeFromCart(productId).catch(() => null);

      haptics.light();

      if (removedItem) {
        const itemToRestore = removedItem;
        showSnackbar({
          message: `${itemToRestore.name} removed from bag`,
          type: "info",
          action: {
            label: "Undo",
            onPress: () => {
              setItems((prev) => {
                const existing = prev.find((i) => i.productId === itemToRestore.productId);
                if (existing) {
                  return prev.map((i) =>
                    i.productId === itemToRestore.productId
                      ? { ...i, quantity: i.quantity + itemToRestore.quantity }
                      : i,
                  );
                }
                return [...prev, itemToRestore];
              });
              api.addToCart(itemToRestore.productId, itemToRestore.quantity).catch(() => null);
            },
          },
        });
      }
    },
    [showSnackbar],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    api.clearCart().catch(() => null);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const subtotalPaise = useMemo(
    () => items.reduce((sum, i) => sum + i.pricePaise * i.quantity, 0),
    [items],
  );

  // Free delivery eligibility (all individual items free delivery OR subtotal >= threshold)
  const allItemsFreeDelivery = useMemo(
    () => items.length > 0 && items.every((i) => Boolean(i.isFreeDelivery)),
    [items],
  );

  const isFreeDelivery = useMemo(() => {
    if (items.length === 0) return false;
    if (!deliverySettings.deliveryEnabled) return true;
    if (deliverySettings.freeDeliveryEnabled && allItemsFreeDelivery) return true;
    if (
      deliverySettings.freeDeliveryEnabled &&
      subtotalPaise >= deliverySettings.freeDeliveryThresholdPaise
    ) {
      return true;
    }
    return false;
  }, [items.length, deliverySettings, allItemsFreeDelivery, subtotalPaise]);

  // Server-authoritative delivery fee calculation
  const deliveryFeePaise = useMemo(() => {
    if (items.length === 0) return 0;
    if (isFreeDelivery) return 0;
    return deliverySettings.baseDeliveryFeePaise;
  }, [items.length, isFreeDelivery, deliverySettings.baseDeliveryFeePaise]);

  const activeMaintenanceFeePaise = useMemo(
    () => (items.length > 0 ? maintenanceFeePaise : 0),
    [items.length, maintenanceFeePaise],
  );

  const totalPaise = useMemo(
    () => subtotalPaise + deliveryFeePaise + activeMaintenanceFeePaise,
    [subtotalPaise, deliveryFeePaise, activeMaintenanceFeePaise],
  );

  const freeDeliveryRemainingPaise = useMemo(() => {
    if (isFreeDelivery || items.length === 0) return 0;
    return Math.max(0, deliverySettings.freeDeliveryThresholdPaise - subtotalPaise);
  }, [isFreeDelivery, items.length, deliverySettings.freeDeliveryThresholdPaise, subtotalPaise]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotalPaise,
        deliveryFeePaise,
        maintenanceFeePaise: activeMaintenanceFeePaise,
        totalPaise,
        isFreeDelivery,
        freeDeliveryThresholdPaise: deliverySettings.freeDeliveryThresholdPaise,
        freeDeliveryRemainingPaise,
        deliverySettings,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshSettings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
