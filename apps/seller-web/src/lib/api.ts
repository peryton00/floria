// Floria Web App — Configured API Client Instance
// Automatically injects the Supabase Auth access_token into Authorization: Bearer header.
import { FloriaApiClient } from "@floria/api-client";
import { getSupabaseBrowserClient } from "./supabase/browser";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = new FloriaApiClient({
  baseUrl: API_BASE_URL,
  getAccessToken: async () => {
    try {
      if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("floria_seller_token");
        if (localToken) return localToken;
      }
      return null;
    } catch {
      return null;
    }
  },
});

export type {
  SellerDashboardData,
  ApiResponse,
  NotificationItem,
  NotificationListResponse,
  SellerDocument,
  SellerNotificationSettings,
  ProductReview,
  ReviewSummary,
  ReviewListResponse,
  NurserySummary,
} from "@floria/api-client";
