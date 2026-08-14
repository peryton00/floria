// Floria — Operations Protected API Route
// GET /api/operations/health

import "server-only";

import { requireOperations } from "@/lib/server/auth";
import { ok, handleRoute } from "@/lib/server/response";

export async function GET() {
  return handleRoute(async () => {
    const ops = await requireOperations();
    return ok({ status: "healthy", userId: ops.id, role: ops.role });
  });
}
