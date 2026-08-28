// Floria — Supabase browser client (client components)
// Uses @supabase/ssr for cookie-based session handling.

import { createBrowserClient } from "@supabase/ssr";

// ponytail: module-level singleton — one client per browser tab
let _client: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseBrowserClient() {
  if (_client) return _client;

  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key =
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ||
    process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error(
      "[Floria] Supabase env vars missing. Copy .env.example to .env.local.",
    );
  }

  _client = createBrowserClient(url, key);
  return _client;
}
