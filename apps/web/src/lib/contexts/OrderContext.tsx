"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type OrderStatus =
  | "Order Placed"
  | "Nursery Confirmed"
  | "Preparing"
  | "Ready for Pickup"
  | "Picked Up"
  | "Packing"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export const ORDER_STATUS_TIMELINE: OrderStatus[] = [
  "Order Placed",
  "Nursery Confirmed",
  "Preparing",
  "Ready for Pickup",
  "Picked Up",
  "Packing",
  "Out for Delivery",
  "Delivered",
];

export interface OrderNurseryItem {
  product: {
    id: string;
    name: string;
    slug: string;
  };
  quantity: number;
  pricePaise: number;
  originalPricePaise?: number;
  primary_image?: { url: string; alt_text?: string | null } | null;
  categoryName?: string | null;
}

export interface OrderNurseryGroup {
  sellerId: string;
  sellerName: string;
  status: string;
  items: OrderNurseryItem[];
}

export interface OrderAddressSnapshot {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  instructions?: string;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  createdAtTimestamp: number;
  status: OrderStatus;
  address: OrderAddressSnapshot;
  paymentMethod: string;
  nurseryGroups: OrderNurseryGroup[];
  subtotalPaise: number;
  discountPaise: number;
  totalItemsCount: number;
}

export type CreateOrderInput = Omit<OrderRecord, "id" | "createdAt" | "createdAtTimestamp" | "status"> & {
  id?: string;
  status?: OrderStatus;
};

interface OrderContextType {
  orders: OrderRecord[];
  createOrder: (input: CreateOrderInput) => OrderRecord;
  getOrders: () => OrderRecord[];
  getOrderById: (id: string) => OrderRecord | undefined;
  updateDemoOrderStatus: (id: string, status: OrderStatus) => void;
  updateNurseryGroupStatus: (masterOrderId: string, sellerId: string, newStatus: OrderStatus) => void;
  refreshOrders: () => Promise<void>;
  isLoading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapDbOrders = useCallback((dbOrders: any[]): OrderRecord[] => {
    return dbOrders.map((o: any) => {
      const addr = o.delivery_address_snapshot || {};
      const fulfillments = o.seller_order_fulfillments || [];

      (o.order_items || []).forEach((item: any) => {
        const sellerId = item.seller_id_snapshot || item.seller?.id || "seller_default";
        const sellerName = item.seller?.business_name || "Nursery";

        const fulfillment = fulfillments.find((f: any) => f.seller_id === sellerId);
        const rawStatus = fulfillment?.status || o.status || "Order Placed";
        
        let displayStatus: OrderStatus = "Order Placed";
        if (rawStatus === "preparing" || rawStatus === "Preparing") {
          displayStatus = "Preparing";
        } else if (rawStatus === "delivered" || rawStatus === "Delivered") {
          displayStatus = "Delivered";
        } else if (rawStatus === "Cancelled" || rawStatus === "cancelled") {
          displayStatus = "Cancelled";
        } else if (rawStatus) {
          displayStatus = rawStatus;
        }

        if (!groupsMap.has(sellerId)) {
          groupsMap.set(sellerId, {
            sellerId,
            sellerName,
            status: displayStatus,
            items: [],
          });
        }

        groupsMap.get(sellerId)!.items.push({
          product: {
            id: item.product_id,
            name: item.product_name_snapshot || item.product?.name || "Plant",
            slug: item.product?.slug || "plant",
          },
          quantity: item.quantity,
          pricePaise: item.unit_price_paise_snapshot || 0,
          categoryName: null,
        });
      });

      return {
        id: o.id,
        createdAt: new Date(o.created_at || Date.now()).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        createdAtTimestamp: new Date(o.created_at || Date.now()).getTime(),
        status: (o.status === "preparing"
          ? "Preparing"
          : o.status === "delivered"
          ? "Delivered"
          : "Order Placed") as OrderStatus,
        address: {
          full_name: addr.full_name || "Customer",
          phone: addr.phone || "",
          line1: addr.line1 || "",
          line2: addr.line2 || undefined,
          city: addr.city || "",
          state: addr.state || "",
          pincode: addr.pincode || "",
          instructions: addr.instructions || undefined,
        },
        paymentMethod: o.notes?.includes("COD") ? "Cash on Delivery" : "Online Payment",
        nurseryGroups: Array.from(groupsMap.values()),
        subtotalPaise: o.subtotal_paise || 0,
        discountPaise: 0,
        totalItemsCount: (o.order_items || []).reduce((s: number, i: any) => s + (i.quantity || 1), 0),
      };
    });
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const res = await api.getOrders();
        if (res.success && res.data) {
          const rawOrders = Array.isArray(res.data) ? res.data : ((res.data as any)?.orders || []);
          const mapped = mapDbOrders(rawOrders);
          setOrders(mapped);
          return;
        }
      }
      setOrders([]);
    } catch (e) {
      console.warn("[OrderContext] refreshOrders error:", e);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [mapDbOrders]);

  useEffect(() => {
    refreshOrders();

    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        await refreshOrders();
      } else if (event === "SIGNED_OUT") {
        setOrders([]);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshOrders]);

  const createOrder = (input: CreateOrderInput): OrderRecord => {
    const todayStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const newId =
      input.id ||
      `FLR-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    const newOrder: OrderRecord = {
      ...input,
      id: newId,
      createdAt: todayStr,
      createdAtTimestamp: Date.now(),
      status: input.status || "Order Placed",
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const getOrders = (): OrderRecord[] => orders;

  const getOrderById = (id: string): OrderRecord | undefined => {
    return orders.find((o) => o.id.toLowerCase() === id.toLowerCase());
  };

  const updateDemoOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id.toLowerCase() === id.toLowerCase() ? { ...o, status } : o))
    );
  };

  const updateNurseryGroupStatus = (
    masterOrderId: string,
    sellerId: string,
    newStatus: OrderStatus
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id.toLowerCase() !== masterOrderId.toLowerCase()) return o;

        const updatedGroups = o.nurseryGroups.map((g) => {
          if (g.sellerId === sellerId || sellerId === "all") {
            return { ...g, status: newStatus };
          }
          return g;
        });

        return {
          ...o,
          nurseryGroups: updatedGroups,
          status: newStatus,
        };
      })
    );
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        getOrders,
        getOrderById,
        updateDemoOrderStatus,
        updateNurseryGroupStatus,
        refreshOrders,
        isLoading,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
}
