// Floria Web — Centralized Notification Deep-Link Navigation Resolver
import type { NotificationItem } from "@/lib/api";

export type UserRole = "customer" | "seller" | "operations" | "admin";

/**
 * Resolves structured notification navigation metadata (entityType, entityId, action)
 * into canonical web routes for the authenticated user's role.
 */
export function resolveNotificationNavigation(
  item: NotificationItem,
  userRole: UserRole = "customer"
): string {
  const data = item.data || {};
  const nav = data.navigation || (data.entityType ? { entityType: data.entityType, entityId: data.entityId, action: data.action } : null);

  if (nav) {
    switch (nav.entityType) {
      case "ORDER":
        if (nav.entityId) {
          if (userRole === "seller") return `/seller/orders/${nav.entityId}`;
          if (userRole === "operations") return `/operations/orders`;
          if (userRole === "admin") return `/admin/orders`;
          return `/orders/${nav.entityId}`;
        }
        break;
      case "PRODUCT":
        if (nav.entityId) {
          if (userRole === "seller") return `/seller/inventory`;
          return `/products/${nav.entityId}`;
        }
        break;
      case "SELLER":
        if (userRole === "admin") return `/admin/sellers`;
        return `/seller/dashboard`;
      case "REVIEW":
        if (userRole === "seller") return `/seller/reviews`;
        return nav.entityId ? `/products/${nav.entityId}` : `/account`;
      case "PAYMENT":
        if (userRole === "seller") return `/seller/earnings`;
        if (userRole === "admin") return `/admin/finance`;
        return `/account`;
      case "SYSTEM":
        return userRole === "seller" ? `/seller/settings` : `/account`;
    }
  }

  // Fallback heuristics for older notification formats
  if (data.orderId) {
    if (userRole === "seller") return `/seller/orders/${data.orderId}`;
    if (userRole === "operations") return `/operations/orders`;
    if (userRole === "admin") return `/admin/orders`;
    return `/orders/${data.orderId}`;
  }

  if (data.productId) {
    if (userRole === "seller") return `/seller/inventory`;
    return `/products/${data.productId}`;
  }

  if (item.type.includes("SELLER")) {
    if (userRole === "admin") return `/admin/sellers`;
    return `/seller/dashboard`;
  }

  return userRole === "seller"
    ? "/seller/dashboard"
    : userRole === "admin"
    ? "/admin/dashboard"
    : userRole === "operations"
    ? "/operations"
    : "/account";
}
