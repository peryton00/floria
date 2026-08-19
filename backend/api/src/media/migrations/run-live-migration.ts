// Live System Asset Migration Runner
import dotenv from "dotenv";
import path from "path";

// Load environment variables from backend/api/.env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/api/.env") });

import { migrateSystemAssets, resolveSystemUploaderUserId } from "./migrate-system-assets.js";
import { getAdminDb } from "../../config/database.js";

async function main() {
  console.log("=== Testing Live Supabase Connection ===");
  const adminDb = getAdminDb();
  
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
    const sysUserId = await resolveSystemUploaderUserId();
    console.log("System Uploader User ID:", sysUserId);

    console.log("Executing migrateSystemAssets()...");
    const results = await migrateSystemAssets();
    console.log("Migration Results:", JSON.stringify(results, null, 2));
    console.log("LIVE MIGRATION EXECUTED SUCCESSFULLY!");
  } catch (err: any) {
    console.error("Migration Error:", err.message);
    console.log("RESULT: LIVE MIGRATION FAILED");
    process.exit(1);
  }
}

main();
