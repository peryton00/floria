"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDb = getAdminDb;
exports.getUserDb = getUserDb;
exports.getAnonDb = getAnonDb;
// Floria API — Server-Only Supabase Database Connection
const supabase_js_1 = require("@supabase/supabase-js");
const ws_1 = __importDefault(require("ws"));
const env_js_1 = require("./env.js");
// Ensure native WebSocket polyfill is available for @supabase/supabase-js in Node < 22
if (typeof globalThis.WebSocket === "undefined") {
    globalThis.WebSocket = ws_1.default;
}
let adminClient = null;
let anonClient = null;
/**
 * Returns trusted server-side Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Used exclusively by backend services & repositories.
 * Never exposed to any client application.
 */
function getAdminDb() {
    if (!adminClient) {
        const env = (0, env_js_1.getEnv)();
        adminClient = (0, supabase_js_1.createClient)(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return adminClient;
}
/**
 * Returns Supabase client initialized with user's JWT access token.
 * Used when performing user-scoped Supabase Auth or RLS verification.
 */
function getUserDb(userAccessToken) {
    const env = (0, env_js_1.getEnv)();
    return (0, supabase_js_1.createClient)(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
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
function getAnonDb() {
    if (!anonClient) {
        const env = (0, env_js_1.getEnv)();
        anonClient = (0, supabase_js_1.createClient)(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return anonClient;
}
