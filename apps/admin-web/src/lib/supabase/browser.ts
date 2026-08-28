// Floria Admin Web — Supabase browser client (client components)
import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseBrowserClient() {
  if (_client) return _client;

  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key =
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ||
    process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error(
      "[Floria Admin Web] Supabase environment variables missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }

  _client = createBrowserClient(url, key);
  return _client;
}
