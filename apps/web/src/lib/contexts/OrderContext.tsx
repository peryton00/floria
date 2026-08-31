"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type OrderStatus =
  | "Payment Pending"
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
  status: OrderStatus;
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
  deliveryFeePaise?: number;
  maintenanceFeePaise?: number;
  totalPaise?: number;
  discountPaise: number;
  totalItemsCount: number;
}

export type CreateOrderInput = Omit<
  OrderRecord,
  "id" | "createdAt" | "createdAtTimestamp" | "status"
> & {
  id?: string;
  status?: OrderStatus;
};

interface OrderContextType {
  orders: OrderRecord[];
  createOrder: (input: CreateOrderInput) => OrderRecord;
  getOrders: () => OrderRecord[];
  getOrderById: (id: string) => OrderRecord | undefined;
  updateDemoOrderStatus: (id: string, status: OrderStatus) => void;
  updateNurseryGroupStatus: (
    masterOrderId: string,
    sellerId: string,
    newStatus: OrderStatus,
  ) => void;
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
      const fulfillments: any[] = o.seller_order_fulfillments || [];
      const groupsMap = new Map<string, OrderNurseryGroup>();

      (o.order_items || []).forEach((item: any) => {
        const sellerId =
          item.seller_id ||
          item.seller_id_snapshot ||
          item.product?.seller_id ||
          item.seller?.id ||
          o.seller_id ||
          "seller_default";
        const sellerName =
          item.seller?.business_name ||
          item.product?.seller?.business_name ||
          "Nursery";

        const fulfillment = fulfillments.find(
          (f: any) => f.seller_id === sellerId || fulfillments.length === 1,
        );
        const rawStatus = fulfillment?.status || o.status || "Order Placed";
        const st = (rawStatus || "").toLowerCase().replace(/_/g, " ");

        let displayStatus: OrderStatus = "Order Placed";
        if (st.includes("ready") || st.includes("pickup") || st.includes("dispatch")) {
          displayStatus = "Ready for Pickup";
        } else if (st.includes("preparing") || st.includes("processing")) {
          displayStatus = "Preparing";
        } else if (st.includes("nursery confirmed") || st.includes("confirmed")) {
          displayStatus = "Nursery Confirmed";
        } else if (st.includes("picked up") || st.includes("picked")) {
          displayStatus = "Picked Up";
        } else if (st.includes("packing")) {
          displayStatus = "Packing";
        } else if (st.includes("delivery") || st.includes("out for delivery")) {
          displayStatus = "Out for Delivery";
        } else if (st.includes("delivered") || st.includes("completed")) {
          displayStatus = "Delivered";
        } else if (st.includes("cancelled")) {
          displayStatus = "Cancelled";
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
          pricePaise: item.unit_price_paise_snapshot || item.price_paise || 0,
          categoryName: null,
        });
      });

      const STATUS_RANKS: Record<string, number> = {
        "Order Placed": 0,
        "Nursery Confirmed": 1,
        "Preparing": 2,
        "Ready for Pickup": 3,
        "Picked Up": 4,
        "Packing": 5,
        "Out for Delivery": 6,
        "Delivered": 7,
      };

      let masterDisplayStatus: OrderStatus = "Order Placed";
      const mst = (o.status || "").toLowerCase().replace(/_/g, " ");

      if (mst.includes("pending payment") || o.status === "pending_payment") {
        masterDisplayStatus = "Payment Pending";
      } else if (mst.includes("cancelled")) {
        masterDisplayStatus = "Cancelled";
      } else if (mst.includes("delivered") || mst.includes("completed")) {
        masterDisplayStatus = "Delivered";
      } else if (mst.includes("delivery") || mst.includes("out for delivery")) {
        masterDisplayStatus = "Out for Delivery";
      } else if (mst.includes("packing")) {
        masterDisplayStatus = "Packing";
      } else {
        const groupStatuses = Array.from(groupsMap.values()).map((g) => g.status);
        if (groupStatuses.length > 0) {
          let minRank = 999;
          let matchedStatus: OrderStatus = "Order Placed";
          for (const gs of groupStatuses) {
            const rank = STATUS_RANKS[gs] ?? 0;
            if (rank < minRank) {
              minRank = rank;
              matchedStatus = gs;
            }
          }
          if (minRank > 0 && minRank < 999) {
            masterDisplayStatus = matchedStatus;
          }
        }

        if (mst.includes("ready") || mst.includes("pickup")) {
          masterDisplayStatus = "Ready for Pickup";
        } else if (mst.includes("preparing") && (STATUS_RANKS[masterDisplayStatus] ?? 0) < 2) {
          masterDisplayStatus = "Preparing";
        } else if ((mst.includes("nursery confirmed") || mst.includes("confirmed")) && (STATUS_RANKS[masterDisplayStatus] ?? 0) < 1) {
          masterDisplayStatus = "Nursery Confirmed";
        } else if (mst.includes("picked up") && (STATUS_RANKS[masterDisplayStatus] ?? 0) < 4) {
          masterDisplayStatus = "Picked Up";
        }
      }

      return {
        id: o.id,
        createdAt: new Date(o.created_at || Date.now()).toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          },
        ),
        createdAtTimestamp: new Date(o.created_at || Date.now()).getTime(),
        status: masterDisplayStatus,
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
        paymentMethod: o.notes?.includes("COD")
          ? "Cash on Delivery"
          : "Online Payment",
        nurseryGroups: Array.from(groupsMap.values()),
        subtotalPaise: o.subtotal_paise || 0,
        // Immutable snapshot: use DB value as-is. 0 is valid (free delivery).
        deliveryFeePaise:
          typeof o.delivery_fee_paise === "number" ? o.delivery_fee_paise : 0,
        maintenanceFeePaise:
          typeof o.maintenance_fee_paise === "number"
            ? o.maintenance_fee_paise
            : 0,
        totalPaise:
          typeof o.total_paise === "number"
            ? o.total_paise
            : o.subtotal_paise || 0,
        discountPaise: 0,
        totalItemsCount: (o.order_items || []).reduce(
          (s: number, i: any) => s + (i.quantity || 1),
          0,
        ),
      };
    });
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const res = await api.getOrders();
        if (res.success && res.data) {
          const rawOrders = Array.isArray(res.data)
            ? res.data
            : (res.data as any)?.orders || [];
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session?.user
      ) {
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
        1000 + Math.random() * 9000,
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
      prev.map((o) =>
        o.id.toLowerCase() === id.toLowerCase() ? { ...o, status } : o,
      ),
    );
  };

  const updateNurseryGroupStatus = (
    masterOrderId: string,
    sellerId: string,
    newStatus: OrderStatus,
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
      }),
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
