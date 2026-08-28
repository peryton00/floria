import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

export interface CartItem {
  productId: string;
  nurseryId: string;
  nurseryName: string;
  name: string;
  pricePaise: number;
  quantity: number;
  imageUrl?: string;
}

export interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotalPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          );
        }
        return [...prev, { ...item, quantity }];
      });
    },
    [],
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
      );
    }
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );
  const subtotalPaise = useMemo(
    () => items.reduce((sum, i) => sum + i.pricePaise * i.quantity, 0),
    [items],
  );
  // Flat delivery fee of ₹49 for hyperlocal courier dispatch
  const deliveryFeePaise = useMemo(
    () => (items.length > 0 ? 4900 : 0),
    [items],
  );
  const totalPaise = useMemo(
    () => subtotalPaise + deliveryFeePaise,
    [subtotalPaise, deliveryFeePaise],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotalPaise,
        deliveryFeePaise,
        totalPaise,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
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
