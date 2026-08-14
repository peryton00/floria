// Floria — server-side audit logging
// All security-relevant events should be logged here.
// Uses service-role client (bypasses RLS) to write to append-only audit_logs table.
// Non-blocking: errors are logged to server console, never thrown to callers.

import "server-only";

export type AuditAction =
  // User lifecycle
  | "USER_CREATED"
  | "USER_GOOGLE_SIGNIN"
  | "USER_GOOGLE_LINKED"
  // Seller lifecycle
  | "SELLER_APPLIED"
  | "SELLER_APPROVED"
  | "SELLER_SUSPENDED"
  // Product
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_PUBLISHED"
  | "PRODUCT_UNPUBLISHED"
  // Inventory
  | "INVENTORY_UPDATED"
  // Orders
  | "ORDER_CREATED"
  | "ORDER_STATUS_CHANGED"
  | "SELLER_FULFILLMENT_CHANGED"
  // Payments
  | "PAYMENT_CREATED"
  | "PAYMENT_CONFIRMED"
  | "REFUND_CREATED"
  // Payouts
  | "PAYOUT_CREATED"
  | "PAYOUT_COMPLETED"
  // Security
  | "AUTH_FAILED"
  | "RATE_LIMITED"
  | "FORBIDDEN_ACCESS";

export type ActorRole = "customer" | "seller" | "operations" | "admin" | "system";

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
      console.error("[audit] Failed to write audit log:", error.message, "entry:", entry.action);
    }
  } catch (e) {
    console.error("[audit] Unexpected error:", e);
  }
}
