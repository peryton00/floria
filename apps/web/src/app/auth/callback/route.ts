// Floria — Supabase OAuth Callback Handler
// Route: GET /auth/callback
// Handles authorization code exchange, server-side user_profiles resolution, role enforcement, and audit logging.

import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseServerClient,
  getSupabaseServiceClient,
} from "@/lib/supabase/server";
import { auditLog } from "@/lib/server/audit";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", req.url));
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !sessionData.user) {
      console.error(
        "[oauth/callback] Exchange code error:",
        sessionError?.message,
      );
      return NextResponse.redirect(
        new URL("/login?error=oauth_exchange_failed", req.url),
      );
    }

    const user = sessionData.user;
    const db = await getSupabaseServiceClient();

    // 1. Resolve existing user_profiles record
    const { data: existingProfile } = await db
      .from("user_profiles")
      .select("id, role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    let role = "customer";

    if (existingProfile) {
      // Preserve existing Floria role (customer, seller, operations, admin)
      role = existingProfile.role;
    } else {
      // First-time Google Sign-In: create customer profile (server-assigned default)
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Floria Customer";

      const { error: insertError } = await db.from("user_profiles").insert({
        id: user.id,
        full_name: fullName,
        role: "customer",
        avatar_url:
          user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      });

      if (insertError) {
        console.error(
          "[oauth/callback] Profile creation error:",
          insertError.message,
        );
      }
    }

    // 2. Safe Audit Event (no tokens or credentials logged)
    void auditLog({
      actor_user_id: user.id,
      actor_role: role as any,
      action: "USER_GOOGLE_SIGNIN",
      resource_type: "user_profile",
      resource_id: user.id,
      metadata: {
        email: user.email,
        isNewUser: !existingProfile,
      },
    });

    // 3. Safe Destination Redirect
    let redirectPath = next;

    // Security check: Non-admin users attempting to access /admin routes are redirected safely
    if (
      redirectPath.startsWith("/admin") &&
      role !== "admin" &&
      role !== "super_admin"
    ) {
      console.warn(
        `[oauth/callback] User ${user.email} (role: ${role}) attempted unauthorized access to admin path: ${redirectPath}`,
      );
      return NextResponse.redirect(
        new URL("/admin/login?error=admin_role_required", req.url),
      );
    }

    if (redirectPath === "/" || !redirectPath.startsWith("/")) {
      if (role === "admin" || role === "super_admin") {
        const adminBase =
          process.env.NEXT_PUBLIC_ADMIN_URL ||
          "https://floria-admin-web.vercel.app";
        return NextResponse.redirect(new URL("/dashboard", adminBase));
      } else if (role === "operations") {
        redirectPath = "/operations";
      } else if (role === "seller") {
        const sellerBase =
          process.env.NEXT_PUBLIC_SELLER_URL ||
          "https://floria-seller-web.vercel.app";
        return NextResponse.redirect(new URL("/dashboard", sellerBase));
      } else {
        redirectPath = "/";
      }
    }

    return NextResponse.redirect(new URL(redirectPath, req.url));
  } catch (err: any) {
    console.error("[oauth/callback] Unexpected error:", err);
    return NextResponse.redirect(
      new URL("/login?error=oauth_callback_error", req.url),
    );
  }
}
