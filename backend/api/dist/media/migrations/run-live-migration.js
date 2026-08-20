"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Live System Asset Migration Runner
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from backend/api/.env
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), ".env") });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), "backend/api/.env") });
const migrate_system_assets_js_1 = require("./migrate-system-assets.js");
const database_js_1 = require("../../config/database.js");
async function main() {
    console.log("=== Testing Live Supabase Connection ===");
    const adminDb = (0, database_js_1.getAdminDb)();
    const { data: healthCheck, error: healthErr } = await adminDb
        .from("user_profiles")
        .select("count", { count: "exact", head: true });
    if (healthErr) {
        console.error("Live DB Connection Error:", healthErr.message);
        console.log("RESULT: LIVE MIGRATION NOT VERIFIED");
        process.exit(1);
    }
    console.log("Live DB Connection Successful!");
    try {
        const sysUserId = await (0, migrate_system_assets_js_1.resolveSystemUploaderUserId)();
        console.log("System Uploader User ID:", sysUserId);
        console.log("Executing migrateSystemAssets()...");
        const results = await (0, migrate_system_assets_js_1.migrateSystemAssets)();
        console.log("Migration Results:", JSON.stringify(results, null, 2));
        console.log("LIVE MIGRATION EXECUTED SUCCESSFULLY!");
    }
    catch (err) {
        console.error("Migration Error:", err.message);
        console.log("RESULT: LIVE MIGRATION FAILED");
        process.exit(1);
    }
}
main();
