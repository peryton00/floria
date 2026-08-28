// Floria Admin Mobile — Universal API Client Instance
import Constants from "expo-constants";
import { FloriaApiClient } from "@floria/api-client";
import { supabase } from "./supabase";

function getApiBaseUrl(): string {
  if (
    process.env.EXPO_PUBLIC_API_URL &&
    !process.env.EXPO_PUBLIC_API_URL.includes("localhost")
  ) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host) {
      return `http://${host}:4000`;
    }
  }

  return process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";
}

export const api = new FloriaApiClient({
  baseUrl: getApiBaseUrl(),
  getAccessToken: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  },
});
