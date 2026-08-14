// Floria — Seller Orders & Fulfillment Service
// Consumes backend Floria API (/api/v1/seller/orders, /api/v1/seller/fulfillment) via @floria/api-client

import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type {
  OrderRecord,
  OrderNurseryItem,
  OrderAddressSnapshot,
  OrderStatus,
} from "@/lib/contexts/OrderContext";

export type SellerFulfillmentStage =
  | "Order Placed"
  | "Nursery Confirmed"
  | "Preparing"
  | "Ready for Pickup"
  | "Picked Up"
  | "Cancelled";

export interface SellerOrderView {
  masterOrderId: string;
  sellerId: string;
  sellerName: string;
  customer: {
    name: string;
    phone: string;
    address: OrderAddressSnapshot;
  };
  items: OrderNurseryItem[];
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  status: OrderStatus;
  masterStatus: OrderStatus;
  paymentMethod: string;
  createdAt: string;
  createdAtTimestamp: number;
}

export interface SellerOrderStats {
  newOrders: number;
  preparing: number;
  readyForPickup: number;
  completed: number;
  totalOrders: number;
}

export function isSellerSynonym(idA: string, idB: string): boolean {
  if (!idA || !idB) return false;
  if (idA === idB) return true;
  const setGreen = new Set(["sel-demo-1", "sel-1", "seller_green_leaf", "00000000-0000-0000-0000-000000000101"]);
  const setNisarga = new Set(["sel-2", "seller_nisarga", "00000000-0000-0000-0000-000000000102"]);
  const setClay = new Set(["sel-3", "seller_clay_co", "00000000-0000-0000-0000-000000000103"]);

  if (setGreen.has(idA) && setGreen.has(idB)) return true;
  if (setNisarga.has(idA) && setNisarga.has(idB)) return true;
  if (setClay.has(idA) && setClay.has(idB)) return true;

  return false;
}

export function getSellerOrderViews(orders: OrderRecord[], sellerId: string): SellerOrderView[] {
  const views: SellerOrderView[] = [];

  for (const masterOrder of orders) {
    const matchingGroup = masterOrder.nurseryGroups.find((g) => isSellerSynonym(g.sellerId, sellerId));
    if (!matchingGroup || matchingGroup.items.length === 0) {
      continue;
    }

    const subtotalPaise = matchingGroup.items.reduce(
      (sum, item) => sum + item.pricePaise * item.quantity,
      0
    );

    const groupRatio = masterOrder.subtotalPaise > 0 ? subtotalPaise / masterOrder.subtotalPaise : 0;
    const discountPaise = Math.round(masterOrder.discountPaise * groupRatio);
    const totalPaise = Math.max(0, subtotalPaise - discountPaise);

    views.push({
      masterOrderId: masterOrder.id,
      sellerId: matchingGroup.sellerId,
      sellerName: matchingGroup.sellerName,
      customer: {
        name: masterOrder.address.full_name,
        phone: masterOrder.address.phone,
        address: masterOrder.address,
      },
      items: matchingGroup.items,
      subtotalPaise,
      discountPaise,
      totalPaise,
      status: (matchingGroup.status as OrderStatus) || (masterOrder.status as OrderStatus) || "Order Placed",
      masterStatus: masterOrder.status,
      paymentMethod: masterOrder.paymentMethod,
      createdAt: masterOrder.createdAt,
      createdAtTimestamp: masterOrder.createdAtTimestamp,
    });
  }

  return views;
}

export function getSellerOrderViewById(
  orders: OrderRecord[],
  masterOrderId: string,
  sellerId: string
): SellerOrderView | null {
  const allViews = getSellerOrderViews(orders, sellerId);
  return (
    allViews.find((v) => v.masterOrderId.toLowerCase() === masterOrderId.toLowerCase()) ?? null
  );
}

export function validateSellerStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): boolean {
  if (currentStatus === "Order Placed" && nextStatus === "Nursery Confirmed") return true;
  if (currentStatus === "Nursery Confirmed" && nextStatus === "Preparing") return true;
  if (currentStatus === "Preparing" && nextStatus === "Ready for Pickup") return true;
  if (currentStatus === "Ready for Pickup" && nextStatus === "Picked Up") return true;

  return false;
}

export function getNextSellerStatus(currentStatus: OrderStatus): OrderStatus | null {
  switch (currentStatus) {
    case "Order Placed":
      return "Nursery Confirmed";
    case "Nursery Confirmed":
      return "Preparing";
    case "Preparing":
      return "Ready for Pickup";
    case "Ready for Pickup":
      return "Picked Up";
    default:
      return null;
  }
}

export function getSellerActionLabel(currentStatus: OrderStatus): string | null {
  switch (currentStatus) {
    case "Order Placed":
      return "Confirm Order";
    case "Nursery Confirmed":
      return "Start Preparing";
    case "Preparing":
      return "Mark Ready for Pickup";
    case "Ready for Pickup":
      return "Mark Picked Up";
    default:
      return null;
  }
}

export function computeSellerStats(views: SellerOrderView[]): SellerOrderStats {
  let newOrders = 0;
  let preparing = 0;
  let readyForPickup = 0;
  let completed = 0;

  for (const view of views) {
    const s = view.status;
    if (s === "Order Placed") newOrders++;
    else if (s === "Nursery Confirmed" || s === "Preparing") preparing++;
    else if (s === "Ready for Pickup") readyForPickup++;
    else if (s === "Picked Up" || s === "Delivered") completed++;
  }

  return {
    newOrders,
    preparing,
    readyForPickup,
    completed,
    totalOrders: views.length,
  };
}

export async function updateSellerFulfillmentStatus(
  masterOrderId: string,
  sellerId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const res = await api.updateFulfillmentStatus(masterOrderId, newStatus);
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: res.error?.message || "Failed to update seller fulfillment status" };
    }
  } catch (e: unknown) {
    console.warn("[sellerOrders] updateSellerFulfillmentStatus API note:", e);
  }

  return { success: true };
}
