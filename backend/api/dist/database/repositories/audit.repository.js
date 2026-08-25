"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRepository = exports.AuditRepository = void 0;
// Floria API — Audit Trail Repository
const database_js_1 = require("../../config/database.js");
class AuditRepository {
    async log(entry) {
        try {
            const actionUpper = (entry.action || "").toUpperCase();
            // Ignore read/view/visit events — only collect login, logout, and state changes
            if (actionUpper.includes("VIEW") ||
                actionUpper.includes("READ") ||
                actionUpper.includes("VISIT") ||
                actionUpper.includes("FETCH") ||
                actionUpper.includes("LIST") ||
                actionUpper.includes("SEARCH")) {
                return;
            }
            const db = (0, database_js_1.getAdminDb)();
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
        }
        catch (e) {
            console.error("[AuditRepository] Exception during audit logging:", e);
        }
    }
    async findAll(limit = 200) {
        try {
            const db = (0, database_js_1.getAdminDb)();
            const { data, error } = await db
                .from("audit_logs")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(limit);
            if (error || !data)
                return [];
            // Strictly return only login, logout, and change events (exclude legacy read/view logs)
            return data.filter((l) => {
                const act = (l.action || "").toUpperCase();
                return (!act.includes("VIEW") &&
                    !act.includes("READ") &&
                    !act.includes("VISIT") &&
                    !act.includes("FETCH") &&
                    !act.includes("LIST") &&
                    !act.includes("SEARCH"));
            });
        }
        catch {
            return [];
        }
    }
}
exports.AuditRepository = AuditRepository;
exports.auditRepository = new AuditRepository();
