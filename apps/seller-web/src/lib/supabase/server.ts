// Floria — Supabase server client (Server Components, Route Handlers, Middleware)
// Uses @supabase/ssr with Next.js cookies() for session handling.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getSupabaseServerClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key =
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ||
    process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error(
      "[Floria] Supabase env vars missing. Copy .env.example to .env.local.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }>,
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(
              name,
              value,
              options as Parameters<typeof cookieStore.set>[2],
            );
          });
        } catch {
          // setAll called from Server Component — cookies can only be set in
          // middleware or Route Handlers; safe to ignore here.
        }
      },
    },
  });
}

/** Service-role client — ONLY for trusted server operations.
 *  Never expose this client or its key to the browser. */
export async function getSupabaseServiceClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !serviceKey) {
    throw new Error(
      "[Floria] SUPABASE_SERVICE_ROLE_KEY missing. Required for service-role operations.",
    );
  }

  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
