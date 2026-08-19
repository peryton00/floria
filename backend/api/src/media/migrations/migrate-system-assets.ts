// Floria Media Infrastructure — System Assets Migration Script (Stage 6)
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getAdminDb } from "../../config/database.js";
import { ImageEngine } from "../image-engine/image-engine.js";
import { SYSTEM_ASSETS_MANIFEST, SystemAssetDefinition } from "./system-assets-manifest.js";

export interface MigratedAssetResult {
  legacyPath: string;
  assetId: string;
  sha256Hash: string;
  profile: string;
  isDeduplicated: boolean;
  variants: Record<string, string>;
}

export const DEFAULT_SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Resolves or creates a valid system uploader user_profiles record to fulfill FK constraints.
 */
export async function resolveSystemUploaderUserId(): Promise<string> {
  const adminDb = getAdminDb();

  // 1. Check if designated system user exists
  const { data: existingSysUser } = await adminDb
    .from("user_profiles")
    .select("id")
    .eq("id", DEFAULT_SYSTEM_USER_ID)
    .maybeSingle();

  if (existingSysUser) {
    return DEFAULT_SYSTEM_USER_ID;
  }

  // 2. Query any existing admin or user profile
  const { data: existingProfile } = await adminDb
    .from("user_profiles")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existingProfile) {
    return existingProfile.id;
  }

  // 3. Insert system user profile if table is empty
  const { error: insertErr } = await adminDb.from("user_profiles").insert({
    id: DEFAULT_SYSTEM_USER_ID,
    role: "admin",
    full_name: "Floria System Administrator",
  });

  if (insertErr) {
    console.warn(`[SystemMigration] System uploader insert fallback notice: ${insertErr.message}`);
  }

  return DEFAULT_SYSTEM_USER_ID;
}

/**
 * Core Migration Executor: Reads 10 system raster assets from apps/web/public,
 * processes through Stage 3 ImageEngine, uploads WebP variants to public-media,
 * and records database records with is_system_seeded = TRUE and seller_id = NULL.
 */
export async function migrateSystemAssets(): Promise<MigratedAssetResult[]> {
  const adminDb = getAdminDb();
  const systemUserId = await resolveSystemUploaderUserId();
  const results: MigratedAssetResult[] = [];

  const publicDir = path.resolve(process.cwd(), "../../apps/web/public");
  const fallbackPublicDir = path.resolve(process.cwd(), "apps/web/public");

  const effectivePublicDir = fs.existsSync(publicDir)
    ? publicDir
    : fs.existsSync(fallbackPublicDir)
    ? fallbackPublicDir
    : process.cwd();

  const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.co";

  for (const assetDef of SYSTEM_ASSETS_MANIFEST) {
    const filePath = path.join(effectivePublicDir, assetDef.legacyPath);

    if (!fs.existsSync(filePath)) {
      console.warn(`[SystemMigration] Source file '${assetDef.legacyPath}' not found at '${filePath}'. Skipping.`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const sha256Hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // 1. SHA-256 Deduplication Check (for system-seeded READY assets)
    const { data: existingAsset } = await adminDb
      .from("media_assets")
      .select("id, status")
      .eq("sha256_hash", sha256Hash)
      .eq("is_system_seeded", true)
      .eq("status", "READY")
      .maybeSingle();

    if (existingAsset) {
      // Fetch existing variants
      const { data: variantRows } = await adminDb
        .from("media_variants")
        .select("variant_name, storage_bucket, storage_path")
        .eq("asset_id", existingAsset.id);

      const variantMap: Record<string, string> = {};
      if (variantRows) {
        for (const v of variantRows) {
          variantMap[v.variant_name] = `${supabaseUrl}/storage/v1/object/public/${v.storage_bucket}/${v.storage_path}`;
        }
      }

      results.push({
        legacyPath: assetDef.legacyPath,
        assetId: existingAsset.id,
        sha256Hash,
        profile: assetDef.profile,
        isDeduplicated: true,
        variants: variantMap,
      });
      continue;
    }

    // 2. Process Binary through Stage 3 ImageEngine
    const engineResult = await ImageEngine.process(fileBuffer, assetDef.profile);

    // 3. Generate Asset UUID & Upload WebP Variants to public-media
    const assetId = crypto.randomUUID();
    const uploadedVariantPaths: string[] = [];
    const variantRecords: Array<{
      asset_id: string;
      variant_name: string;
      format: string;
      width: number;
      height: number;
      size_bytes: number;
      storage_bucket: string;
      storage_path: string;
    }> = [];
    const variantMap: Record<string, string> = {};

    try {
      for (const variant of engineResult.variants) {
        const storagePath = `system/${assetId}/${variant.variantName}.webp`;

        const { error: uploadErr } = await adminDb.storage
          .from("public-media")
          .upload(storagePath, variant.buffer, {
            contentType: "image/webp",
            cacheControl: "public, max-age=31536000, immutable",
            upsert: true,
          });

        if (uploadErr) {
          throw new Error(`Failed to upload variant '${variant.variantName}' to '${storagePath}': ${uploadErr.message}`);
        }

        uploadedVariantPaths.push(storagePath);
        variantRecords.push({
          asset_id: assetId,
          variant_name: variant.variantName,
          format: variant.format,
          width: variant.width,
          height: variant.height,
          size_bytes: variant.sizeBytes,
          storage_bucket: "public-media",
          storage_path: storagePath,
        });

        variantMap[variant.variantName] = `${supabaseUrl}/storage/v1/object/public/public-media/${storagePath}`;
      }

      // 4. Database Records Creation
      const { error: assetErr } = await adminDb.from("media_assets").insert({
        id: assetId,
        seller_id: null, // Strictly system-seeded, not seller-owned!
        uploaded_by_user_id: systemUserId,
        profile: assetDef.profile,
        media_category: "IMAGE",
        original_filename: assetDef.originalFilename,
        mime_type: "image/png",
        file_size_bytes: fileBuffer.length,
        sha256_hash: sha256Hash,
        status: "READY",
        storage_bucket: "public-media",
        is_system_seeded: true,
      });

      if (assetErr) {
        throw new Error(`Failed to insert media_assets record: ${assetErr.message}`);
      }

      const { error: variantErr } = await adminDb.from("media_variants").insert(variantRecords);
      if (variantErr) {
        throw new Error(`Failed to insert media_variants records: ${variantErr.message}`);
      }

      results.push({
        legacyPath: assetDef.legacyPath,
        assetId,
        sha256Hash,
        profile: assetDef.profile,
        isDeduplicated: false,
        variants: variantMap,
      });
    } catch (err: any) {
      // ROLLBACK: Delete any partial storage variants uploaded during this failed migration attempt
      if (uploadedVariantPaths.length > 0) {
        try {
          await adminDb.storage.from("public-media").remove(uploadedVariantPaths);
        } catch (cleanupErr: any) {
          console.error(`[SystemMigration] Rollback cleanup error for '${assetDef.legacyPath}': ${cleanupErr.message}`);
        }
      }
      throw err;
    }
  }

  return results;
}
