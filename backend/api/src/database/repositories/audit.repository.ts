// Floria API — Audit Trail Repository
import { getAdminDb } from "../../config/database.js";

export interface CreateAuditLogInput {
  actor_user_id?: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
}

export class AuditRepository {
  async log(entry: CreateAuditLogInput): Promise<void> {
    try {
      const db = getAdminDb();
      const { error } = await db.from("audit_logs").insert({
        actor_user_id: entry.actor_user_id ?? null,
        actor_role: entry.actor_role,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id ?? null,
        metadata: entry.metadata ?? null,
      });

      if (error) {
        console.error("[AuditRepository] Failed to write audit log:", error.message);
      }
    } catch (e) {
      console.error("[AuditRepository] Exception during audit logging:", e);
    }
  }

  async findAll(limit = 100): Promise<any[]> {
    try {
      const db = getAdminDb();
      const { data, error } = await db
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  }
}

export const auditRepository = new AuditRepository();
