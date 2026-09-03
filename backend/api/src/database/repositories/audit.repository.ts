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

export interface FindAuditLogsOptions {
  limit?: number;
  before?: string; // Cursor: ISO timestamp of last seen item
  page?: number;   // Offset-based fallback if no cursor
  role?: string;
  action?: string;
  actorId?: string;
  search?: string;
  includeMetadata?: boolean;
}

export interface PaginatedAuditLogs {
  items: any[];
  hasMore: boolean;
  nextCursor: string | null;
  limit: number;
}

export class AuditRepository {
  async log(entry: CreateAuditLogInput): Promise<void> {
    try {
      const db = getAdminDb();
      const { error } = await db.from("audit_logs").insert({
        actor_user_id: entry.actor_user_id ?? null,
        actor_role: entry.actor_role || "system",
        action: entry.action,
        resource_type: entry.resource_type || "system",
        resource_id: entry.resource_id ?? null,
        metadata: entry.metadata ?? {},
      });

      if (error) {
        console.error(
          "[AuditRepository] Failed to write audit log:",
          error.message,
        );
      }
    } catch (e) {
      console.error("[AuditRepository] Exception during audit logging:", e);
    }
  }

  async findById(id: string): Promise<any | null> {
    try {
      const db = getAdminDb();
      const { data, error } = await db
        .from("audit_logs")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch (err) {
      console.error("[AuditRepository] Failed to get log by ID:", err);
      return null;
    }
  }

  async findAll(options: FindAuditLogsOptions = {}): Promise<PaginatedAuditLogs> {
    const limit = Math.min(Math.max(Number(options.limit) || 25, 1), 100);
    try {
      const db = getAdminDb();
      // Select lightweight summary columns unless full metadata explicitly requested
      const selectFields = options.includeMetadata
        ? "*"
        : "id, created_at, actor_user_id, actor_role, action, resource_type, resource_id";

      let query = db
        .from("audit_logs")
        .select(selectFields)
        .order("created_at", { ascending: false });

      // Cursor pagination (created_at < before)
      if (options.before) {
        query = query.lt("created_at", options.before);
      } else if (options.page && options.page > 1) {
        const from = (options.page - 1) * limit;
        query = query.range(from, from + limit);
      }

      // SQL WHERE filtering
      if (options.role && options.role !== "all") {
        query = query.eq("actor_role", options.role);
      }
      if (options.action) {
        query = query.eq("action", options.action);
      }
      if (options.actorId) {
        query = query.eq("actor_user_id", options.actorId);
      }
      if (options.search) {
        query = query.or(
          `action.ilike.%${options.search}%,resource_type.ilike.%${options.search}%,actor_role.ilike.%${options.search}%`,
        );
      }

      // Query limit + 1 to test for next page availability
      const { data, error } = await query.limit(limit + 1);

      if (error) {
        console.error(
          "[AuditRepository] Error querying audit_logs:",
          error.message,
        );
        return { items: [], hasMore: false, nextCursor: null, limit };
      }

      const rows: any[] = (data as any[]) || [];
      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor =
        items.length > 0 ? items[items.length - 1].created_at : null;

      return {
        items,
        hasMore,
        nextCursor,
        limit,
      };
    } catch (err) {
      console.error("[AuditRepository] Unexpected error in findAll:", err);
      return { items: [], hasMore: false, nextCursor: null, limit };
    }
  }
}

export const auditRepository = new AuditRepository();
