// Floria — Admin Protected API Route
// GET /api/admin/health

import "server-only";

import { requireAdmin } from "@/lib/server/auth";
import { ok, handleRoute } from "@/lib/server/response";

export async function GET() {
  return handleRoute(async () => {
    const admin = await requireAdmin();
    return ok({ status: "healthy", adminId: admin.id, role: admin.role });
  });
}
