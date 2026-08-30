// Floria Customer Mobile — Centralized Notification Deep-Link Navigation Resolver
import type { FloriaNotificationItem } from "./types";

export interface ResolvedNavigation {
  pathname: string;
  params?: Record<string, string>;
}

/**
 * Resolves structured notification metadata into an Expo Router destination.
 * Gracefully handles missing IDs or unmapped types by returning safe fallbacks.
 */
export function resolveNotificationRoute(
  item: Partial<FloriaNotificationItem> & { data?: Record<string, any>; type?: string; source_type?: string; source_id?: string },
): ResolvedNavigation {
  const data = item.data || {};
  const nav = data.navigation || item.navigation;

  // 1. Explicit navigation target from backend payload
  if (nav?.entityType) {
    const entityType = String(nav.entityType).toUpperCase();
    const entityId = nav.entityId || data.orderId || data.productId || data.id;

    switch (entityType) {
      case "ORDER":
      case "PAYMENT":
      case "DELIVERY":
        if (entityId) {
          return { pathname: "/orders/[id]", params: { id: String(entityId) } };
        }
        return { pathname: "/orders" };

      case "PRODUCT":
      case "WISHLIST":
        if (entityId) {
          return { pathname: "/products/[id]", params: { id: String(entityId) } };
        }
        return { pathname: "/(tabs)/explore" };

      case "SELLER":
        if (entityId) {
          return { pathname: "/nurseries/[id]", params: { id: String(entityId) } };
        }
        return { pathname: "/(tabs)/explore" };

      case "ACCOUNT":
        return { pathname: "/(tabs)/profile" };

      case "EXPLORE":
        return { pathname: "/(tabs)/explore" };

      default:
        break;
    }
  }

  // 2. Direct route override if provided in payload
  if (data.route && typeof data.route === "string" && data.route.startsWith("/")) {
    return { pathname: data.route };
  }

  // 3. Fallback based on notification category/type
  const type = (item.type || "").toUpperCase();

  if (type.includes("ORDER") || type.includes("DELIVERY") || type.includes("PAYMENT") || type.includes("REFUND")) {
    const orderId = data.orderId || data.order_id || item.source_id;
    if (orderId) {
      return { pathname: "/orders/[id]", params: { id: String(orderId) } };
    }
    return { pathname: "/orders" };
  }

  if (type.includes("WISHLIST") || type.includes("STOCK") || type.includes("PRICE") || type.includes("PRODUCT")) {
    const productId = data.productId || data.product_id || item.source_id;
    if (productId) {
      return { pathname: "/products/[id]", params: { id: String(productId) } };
    }
    return { pathname: "/(tabs)/explore" };
  }

  if (type.includes("ACCOUNT") || type.includes("SECURITY") || type.includes("AUTH")) {
    return { pathname: "/(tabs)/profile" };
  }

  // 4. Ultimate safe fallback
  return { pathname: "/(tabs)" };
}
