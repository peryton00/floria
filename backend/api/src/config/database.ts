// Floria API — Server-Only Supabase Database Connection
import { createClient, SupabaseClient } from "@supabase/supabase-js";
// @ts-ignore
import WebSocket from "ws";
import { getEnv } from "./env.js";

// Ensure native WebSocket polyfill is available for @supabase/supabase-js in Node < 22
if (typeof globalThis.WebSocket === "undefined") {
  (globalThis as any).WebSocket = WebSocket;
}

let adminClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

/**
 * Returns trusted server-side Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Used exclusively by backend services & repositories.
 * Never exposed to any client application.
 */
export function getAdminDb(): SupabaseClient {
  if (!adminClient) {
    const env = getEnv();
    adminClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }
  return adminClient;
}

/**
 * Returns Supabase client initialized with user's JWT access token.
 * Used when performing user-scoped Supabase Auth or RLS verification.
 */
export function getUserDb(userAccessToken: string): SupabaseClient {
  const env = getEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Returns public Supabase client using SUPABASE_ANON_KEY.
 */
export function getAnonDb(): SupabaseClient {
  if (!anonClient) {
    const env = getEnv();
    anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return anonClient;
}

/**
 * Returns user-scoped Supabase client when a valid user JWT is provided,
 * otherwise falls back to trusted admin client.
 */
export function getDbForUser(userAccessToken?: string): SupabaseClient {
  if (userAccessToken && userAccessToken.length > 10) {
    try {
      return getUserDb(userAccessToken);
    } catch {
      return getAdminDb();
    }
  }
  return getAdminDb();
}

