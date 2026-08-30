// Floria Seller Mobile — Universal API Client Instance
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

import { getSellerMobileToken } from "./token";

export const api = new FloriaApiClient({
  baseUrl: getApiBaseUrl(),
  getAccessToken: async () => {
    return getSellerMobileToken() || null;
  },
});
