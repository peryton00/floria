// Floria — Auth Audit API Route (POST /api/auth/audit)
// Allows frontend authentication flows to log USER_LOGIN and USER_LOGOUT events.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/server/audit";

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    const body = await req.json().catch(() => ({}));
    const { action, role, metadata } = body;

    if (action !== "USER_LOGIN" && action !== "USER_LOGOUT") {
      return NextResponse.json(
        { success: false, error: "Only USER_LOGIN and USER_LOGOUT events permitted via auth endpoint" },
        { status: 400 }
      );
    }

    const userId = session?.user?.id || body.user_id;
    const actorRole = role || session?.user?.user_metadata?.role || "customer";

    await auditLog({
      actor_user_id: userId,
      actor_role: actorRole,
      action: action as any,
      resource_type: "auth_session",
      resource_id: userId,
      metadata: {
        email: session?.user?.email || body.email || null,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[api/auth/audit] Failed to record auth audit:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
