"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
// Floria API — Environment Security & Validation
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), ".env") });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), "../../.env.local") });
dotenv_1.default.config({
    path: path_1.default.resolve(process.cwd(), "../../apps/web/.env.local"),
});
function validateEnv() {
    const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
    const url = process.env.SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        (isTest ? "https://mock-test.supabase.co" : undefined);
    const anonKey = process.env.SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        (isTest ? "test-mock-anon-key" : undefined);
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
        (isTest ? "test-mock-service-role-key" : undefined);
    const missing = [];
    if (!url)
        missing.push("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
    if (!anonKey)
        missing.push("SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
    if (!serviceRoleKey)
        missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (missing.length > 0) {
        const errorMsg = `[Floria API] Critical Environment Startup Error:\nMissing required production environment variables:\n- ${missing.join("\n- ")}\n\nServer process startup aborted for security integrity.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    const corsOrigins = (process.env.CORS_ALLOWED_ORIGINS ||
        "http://localhost:3000,http://localhost:3001")
        .split(",")
        .map((o) => o.trim());
    const port = parseInt(process.env.PORT || process.env.API_PORT || "4000", 10);
    const nodeEnv = process.env.NODE_ENV || "development";
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    return {
        SUPABASE_URL: url,
        SUPABASE_ANON_KEY: anonKey,
        SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
        CORS_ALLOWED_ORIGINS: corsOrigins,
        API_PORT: port,
        NODE_ENV: nodeEnv,
        REDIS_URL: redisUrl,
    };
}
let cachedEnv = null;
function getEnv() {
    if (!cachedEnv) {
        cachedEnv = validateEnv();
    }
    return cachedEnv;
}
