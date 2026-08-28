// Floria Seller Web — OAuth Callback Handler
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", req.url));
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !sessionData.user) {
      console.error(
        "[seller-oauth/callback] Exchange error:",
        sessionError?.message,
      );
      return NextResponse.redirect(
        new URL("/login?error=oauth_exchange_failed", req.url),
      );
    }

    const redirectPath = next.startsWith("/") ? next : "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, req.url));
  } catch (err: any) {
    console.error("[seller-oauth/callback] Unexpected error:", err);
    return NextResponse.redirect(
      new URL("/login?error=oauth_callback_error", req.url),
    );
  }
}
