"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SYSTEM_USER_ID = void 0;
exports.resolveSystemUploaderUserId = resolveSystemUploaderUserId;
exports.migrateSystemAssets = migrateSystemAssets;
// Floria Media Infrastructure — System Assets Migration Script (Stage 6)
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const database_js_1 = require("../../config/database.js");
const image_engine_js_1 = require("../image-engine/image-engine.js");
const system_assets_manifest_js_1 = require("./system-assets-manifest.js");
exports.DEFAULT_SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
/**
 * Resolves or creates a valid system uploader user_profiles record to fulfill FK constraints.
 */
async function resolveSystemUploaderUserId() {
    const adminDb = (0, database_js_1.getAdminDb)();
    // 1. Query real existing admin profile from user_profiles
    const { data: adminUser } = await adminDb
        .from("user_profiles")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();
    if (adminUser && adminUser.id) {
        return adminUser.id;
    }
    // 2. Query any existing user profile
    const { data: existingProfile } = await adminDb
        .from("user_profiles")
        .select("id")
        .limit(1)
        .maybeSingle();
    if (existingProfile && existingProfile.id) {
        return existingProfile.id;
    }
    return exports.DEFAULT_SYSTEM_USER_ID;
}
/**
 * Core Migration Executor: Reads 10 system raster assets from apps/web/public,
 * processes through Stage 3 ImageEngine, uploads WebP variants to public-media,
 * and records database records with is_system_seeded = TRUE and seller_id = NULL.
 */
async function migrateSystemAssets(overrideBuffers) {
    const adminDb = (0, database_js_1.getAdminDb)();
    const systemUserId = await resolveSystemUploaderUserId();
    const results = [];
    const publicDir = path_1.default.resolve(process.cwd(), "../../apps/web/public");
    const fallbackPublicDir = path_1.default.resolve(process.cwd(), "apps/web/public");
    const effectivePublicDir = fs_1.default.existsSync(publicDir)
        ? publicDir
        : fs_1.default.existsSync(fallbackPublicDir)
            ? fallbackPublicDir
            : process.cwd();
    const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.co";
    for (const assetDef of system_assets_manifest_js_1.SYSTEM_ASSETS_MANIFEST) {
        let fileBuffer = null;
        if (overrideBuffers && overrideBuffers[assetDef.legacyPath]) {
            fileBuffer = overrideBuffers[assetDef.legacyPath];
        }
        else {
            const filePath = path_1.default.join(effectivePublicDir, assetDef.legacyPath);
            if (fs_1.default.existsSync(filePath)) {
                fileBuffer = fs_1.default.readFileSync(filePath);
            }
        }
        if (!fileBuffer) {
            console.warn(`[SystemMigration] Source file '${assetDef.legacyPath}' not found. Skipping.`);
            continue;
        }
        const sha256Hash = crypto_1.default
            .createHash("sha256")
            .update(fileBuffer)
            .digest("hex");
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
            const variantMap = {};
            if (variantRows) {
                for (const v of variantRows) {
                    variantMap[v.variant_name] =
                        `${supabaseUrl}/storage/v1/object/public/${v.storage_bucket}/${v.storage_path}`;
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
        const engineResult = await image_engine_js_1.ImageEngine.process(fileBuffer, assetDef.profile);
        // 3. Generate Asset UUID & Upload WebP Variants to public-media
        const assetId = crypto_1.default.randomUUID();
        const uploadedVariantPaths = [];
        const variantRecords = [];
        const variantMap = {};
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
                variantMap[variant.variantName] =
                    `${supabaseUrl}/storage/v1/object/public/public-media/${storagePath}`;
            }
            // 4. Database Records Creation
            const { error: assetErr } = await adminDb.from("media_assets").insert({
                id: assetId,
                seller_id: null, // Strictly system-seeded, not seller-owned!
                uploaded_by_user_id: systemUserId,
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
            const { error: variantErr } = await adminDb
                .from("media_variants")
                .insert(variantRecords);
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
        }
        catch (err) {
            // ROLLBACK: Delete any partial storage variants uploaded during this failed migration attempt
            if (uploadedVariantPaths.length > 0) {
                try {
                    await adminDb.storage
                        .from("public-media")
                        .remove(uploadedVariantPaths);
                }
                catch (cleanupErr) {
                    console.error(`[SystemMigration] Rollback cleanup error for '${assetDef.legacyPath}': ${cleanupErr.message}`);
                }
            }
            throw err;
        }
    }
    return results;
}
