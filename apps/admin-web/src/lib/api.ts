// Floria Admin Web — Configured Universal Typed API Client Instance
// Injects the current Supabase Auth access_token into Authorization: Bearer header.
import { FloriaApiClient } from "@floria/api-client";
import { getSupabaseBrowserClient } from "./supabase/browser";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = new FloriaApiClient({
  baseUrl: API_BASE_URL,
  getAccessToken: async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  },
});

export type {
  ApiResponse,
  NotificationItem,
  NotificationListResponse,
} from "@floria/api-client";
