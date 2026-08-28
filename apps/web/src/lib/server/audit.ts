// Floria — server-side audit logging
// All security-relevant events should be logged here.
// Uses service-role client (bypasses RLS) to write to append-only audit_logs table.
// Non-blocking: errors are logged to server console, never thrown to callers.

import "server-only";

export type AuditAction =
  // Auth & Session lifecycle (login / logout)
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_GOOGLE_SIGNIN"
  | "USER_GOOGLE_LINKED"
  // User lifecycle & changes
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "CUSTOMER_SUSPENDED"
  | "CUSTOMER_REACTIVATED"
  | "USER_PROFILE_UPDATED"
  // Seller lifecycle & changes
  | "SELLER_APPLIED"
  | "SELLER_APPROVED"
  | "SELLER_SUSPENDED"
  | "SELLER_REJECTED"
  | "SELLER_PROFILE_UPDATED"
  | "SELLER_APPLICATION_SUBMITTED"
  | "SELLER_DOCUMENT_UPLOADED"
  | "SELLER_NOTIFICATION_SETTINGS_UPDATED"
  // Catalog & Product changes
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_PUBLISHED"
  | "PRODUCT_UNPUBLISHED"
  | "PRODUCT_DELETED"
  | "SELLER_PRODUCT_CREATED"
  | "SELLER_PRODUCT_UPDATED"
  | "SELLER_PRODUCT_DELETED"
  | "SELLER_PRODUCT_PUBLISHED"
  | "SELLER_PRODUCT_DRAFT"
  | "PRODUCT_CATALOG_UPDATED"
  | "CATEGORY_CREATED"
  | "CATEGORY_UPDATED"
  | "CATEGORY_DELETED"
  // Inventory changes
  | "INVENTORY_UPDATED"
  | "SELLER_INVENTORY_UPDATED"
  // Order & Fulfillment changes
  | "ORDER_CREATED"
  | "ORDER_STATUS_CHANGED"
  | "ORDER_STATUS_OVERRIDDEN"
  | "SELLER_FULFILLMENT_CHANGED"
  | "SELLER_FULFILLMENT_UPDATED"
  | "FULFILLMENT_STATUS_CHANGED"
  // Delivery changes
  | "DELIVERY_ASSIGNED"
  | "DELIVERY_REASSIGNED"
  | "DELIVERY_SETTINGS_UPDATED"
  // Payment & Financial policy changes
  | "PAYMENT_CREATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_WEBHOOK_PROCESSED"
  | "REFUND_CREATED"
  | "PAYOUT_CREATED"
  | "PAYOUT_COMPLETED"
  | "PLATFORM_COMMISSION_UPDATED"
  | "SELLER_COMMISSION_UPDATED"
  | "FLORIA_PROFIT_RATE_UPDATED"
  | "PLATFORM_MAINTENANCE_FEE_UPDATED"
  | "FREE_DELIVERY_POLICY_UPDATED"
  | "DELIVERY_RECOVERY_UPDATED"
  // Security
  | "AUTH_FAILED"
  | "RATE_LIMITED"
  | "FORBIDDEN_ACCESS";

export type ActorRole =
  "customer" | "seller" | "operations" | "admin" | "system";

export interface AuditEntry {
  actor_user_id?: string;
  actor_role: ActorRole;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  /** Must NOT contain secrets, tokens, or payment credentials */
  metadata?: Record<string, unknown>;
}

/**
 * Write an audit log entry. Fire-and-forget — never throws.
 * Errors are logged to the server console only.
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    const actionUpper = (entry.action || "").toUpperCase();
    // Filter out read/view/visit events — strictly collect logins, logouts, and data changes
    if (
      actionUpper.includes("VIEW") ||
      actionUpper.includes("READ") ||
      actionUpper.includes("VISIT") ||
      actionUpper.includes("FETCH") ||
      actionUpper.includes("LIST") ||
      actionUpper.includes("SEARCH")
    ) {
      return;
    }

    const { getSupabaseServiceClient } = await import("@/lib/supabase/server");
    const db = await getSupabaseServiceClient();

    const { error } = await db.from("audit_logs").insert({
      actor_user_id: entry.actor_user_id ?? null,
      actor_role: entry.actor_role,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id ?? null,
      metadata: entry.metadata ?? null,
    });

    if (error) {
      console.error(
        "[audit] Failed to write audit log:",
        error.message,
        "entry:",
        entry.action,
      );
    }
  } catch (e) {
    console.error("[audit] Unexpected error:", e);
  }
}
