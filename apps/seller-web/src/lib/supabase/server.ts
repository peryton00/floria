// Floria Seller Web — Supabase server client (Server Components, Route Handlers, Middleware)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getSupabaseServerClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key =
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ||
    process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error(
      "[Floria Seller Web] Supabase environment variables missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
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
          // setAll called from Server Component — safe to ignore here.
        }
      },
    },
  });
}
