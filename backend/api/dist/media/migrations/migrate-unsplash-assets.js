"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNSPLASH_ASSETS_MANIFEST = void 0;
exports.downloadImageBuffer = downloadImageBuffer;
exports.migrateUnsplashAssets = migrateUnsplashAssets;
// Floria Media Infrastructure — Unsplash Seed Media Migration Module (Stage 7)
const crypto_1 = __importDefault(require("crypto"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const database_js_1 = require("../../config/database.js");
const image_engine_js_1 = require("../image-engine/image-engine.js");
const migrate_system_assets_js_1 = require("./migrate-system-assets.js");
// 16 Unique Unsplash Seed Assets Required for Floria Production Runtime & Seeds
exports.UNSPLASH_ASSETS_MANIFEST = [
    // --- SELLER LOGOS / AVATARS (4) ---
    {
        id: "seller-logo-greenleaf",
        url: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=300&auto=format&fit=crop&q=80",
        profile: "SELLER_LOGO",
        domainEntity: "Green Leaf Nursery Logo & Avatar",
        description: "Potted tropical green leaves logo",
    },
    {
        id: "seller-logo-nisarga",
        url: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=300&auto=format&fit=crop&q=80",
        profile: "SELLER_LOGO",
        domainEntity: "Nisarga Gardens Logo & Avatar",
        description: "Garden sprout seedlings logo",
    },
    {
        id: "seller-logo-clayco",
        url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300&auto=format&fit=crop&q=80",
        profile: "SELLER_LOGO",
        domainEntity: "Clay & Co. Logo & Avatar",
        description: "Terracotta planter logo",
    },
    {
        id: "seller-logo-saigarden",
        url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&auto=format&fit=crop&q=80",
        profile: "SELLER_LOGO",
        domainEntity: "Sai Garden Center Logo & Avatar",
        description: "Garden tools & foliage logo",
    },
    // --- PRODUCT PRIMARY IMAGES (9) ---
    {
        id: "product-snake-monstera",
        url: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80",
        profile: "PRODUCT",
        domainEntity: "Snake Plant & Monstera Deliciosa",
        description: "Indoor tropical houseplants",
    },
    {
        id: "product-aloe-vera",
        url: "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=600&auto=format&fit=crop&q=80",
        profile: "PRODUCT",
        domainEntity: "Aloe Vera Succulent",
        description: "Medicinal aloe vera potted succulent",
    },
    {
        id: "product-peace-lily",
        url: "https://images.unsplash.com/photo-1589393922695-ef4c2f236b67?w=600&auto=format&fit=crop&q=80",
        profile: "PRODUCT",
        domainEntity: "Peace Lily (Spathiphyllum)",
        description: "Blooming white peace lily plant",
    },
    {
        id: "product-sweet-basil",
        url: "https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=600&auto=format&fit=crop&q=80",
        profile: "PRODUCT",
        domainEntity: "Sweet Basil Organic Seeds",
        description: "Culinary sweet basil herbs",
    },
    {
        id: "product-terracotta-pot",
        url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80",
        profile: "PRODUCT",
        domainEntity: "Terracotta Pot Medium",
        description: "Handcrafted terracotta clay planter",
    },
    {
        id: "product-pink-bougainvillea",
        url: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=600&auto=format&fit=crop&q=80",
        profile: "PRODUCT",
        domainEntity: "Vibrant Pink Bougainvillea",
        description: "Magenta flowering bougainvillea climber",
    },
    {
        id: "product-vermicompost",
        url: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=600&auto=format&fit=crop&q=80",
        profile: "PRODUCT",
        domainEntity: "Organic Vermicompost 5kg",
        description: "Nutrient-rich organic compost fertilizer",
    },
    {
        id: "product-pruning-shears",
        url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
        profile: "PRODUCT",
        domainEntity: "Ergonomic Pruning Shears",
        description: "Bypass garden pruning shears",
    },
    {
        id: "product-golden-money-plant",
        url: "https://images.unsplash.com/photo-1604762524889-3e2fcc145683?w=600&auto=format&fit=crop&q=80",
        profile: "PRODUCT",
        domainEntity: "Golden Money Plant (Pothos)",
        description: "Trailing golden pothos vine",
    },
    // --- CATEGORY BANNER IMAGES (5 distinct category banners) ---
    {
        id: "category-outdoor-plants",
        url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80",
        profile: "CATEGORY",
        domainEntity: "Outdoor Plants Category",
        description: "Garden patio outdoor plants and shrubs",
    },
    {
        id: "category-succulents-cacti",
        url: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=600&q=80",
        profile: "CATEGORY",
        domainEntity: "Succulents & Cacti Category",
        description: "Desert cacti and succulent rosettes",
    },
    {
        id: "category-flowering-plants",
        url: "https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=600&q=80",
        profile: "CATEGORY",
        domainEntity: "Flowering Plants Category",
        description: "Blooming garden flowers",
    },
    {
        id: "category-herbs-edibles",
        url: "https://images.unsplash.com/photo-1618164435735-413d3b066c9a?auto=format&fit=crop&w=600&q=80",
        profile: "CATEGORY",
        domainEntity: "Herbs & Edibles Category",
        description: "Potted culinary herb garden",
    },
    {
        id: "category-soil-fertilizers",
        url: "https://images.unsplash.com/photo-1599685315640-9ceab2f58944?auto=format&fit=crop&w=600&q=80",
        profile: "CATEGORY",
        domainEntity: "Soil & Fertilizers Category",
        description: "Rich organic soil mix and nutrition",
    },
];
/**
 * Robust Image Downloader with Content & MIME Verification
 */
async function downloadImageBuffer(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith("https") ? https_1.default : http_1.default;
        const req = client.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode} when downloading '${url}'`));
            }
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                const buffer = Buffer.concat(chunks);
                if (buffer.length === 0) {
                    return reject(new Error(`Empty binary received from '${url}'`));
                }
                // Validate image magic bytes (JPEG: 0xFFD8, PNG: 0x8950, WebP: RIFF)
                const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
                const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
                const isWebp = buffer.subarray(8, 12).toString() === "WEBP";
                if (!isJpeg && !isPng && !isWebp) {
                    return reject(new Error(`Downloaded binary from '${url}' is not a valid JPEG/PNG/WebP image.`));
                }
                resolve(buffer);
            });
        });
        req.on("error", (err) => reject(new Error(`Network download error for '${url}': ${err.message}`)));
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error(`Download timeout (15s) for '${url}'`));
        });
    });
}
/**
 * Migration Executor for Unsplash Seed Media
 */
async function migrateUnsplashAssets(overrideBuffers) {
    const adminDb = (0, database_js_1.getAdminDb)();
    const systemUserId = await (0, migrate_system_assets_js_1.resolveSystemUploaderUserId)();
    const results = [];
    const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.co";
    for (const assetDef of exports.UNSPLASH_ASSETS_MANIFEST) {
        let fileBuffer = null;
        if (overrideBuffers && overrideBuffers[assetDef.id]) {
            fileBuffer = overrideBuffers[assetDef.id];
        }
        else {
            try {
                fileBuffer = await downloadImageBuffer(assetDef.url);
            }
            catch (dlErr) {
                console.error(`[UnsplashMigration] Failed to download '${assetDef.id}' (${assetDef.url}): ${dlErr.message}`);
                continue;
            }
        }
        if (!fileBuffer)
            continue;
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
                originalUrl: assetDef.url,
                assetId: existingAsset.id,
                sha256Hash,
                profile: assetDef.profile,
                domainEntity: assetDef.domainEntity,
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
                seller_id: null, // System-seeded
                uploaded_by_user_id: systemUserId,
                media_category: "IMAGE",
                original_filename: `${assetDef.id}.jpg`,
                mime_type: "image/jpeg",
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
                originalUrl: assetDef.url,
                assetId,
                sha256Hash,
                profile: assetDef.profile,
                domainEntity: assetDef.domainEntity,
                isDeduplicated: false,
                variants: variantMap,
            });
        }
        catch (err) {
            // Rollback cleanup on partial upload failure
            if (uploadedVariantPaths.length > 0) {
                try {
                    await adminDb.storage
                        .from("public-media")
                        .remove(uploadedVariantPaths);
                }
                catch (cleanupErr) {
                    console.error(`[UnsplashMigration] Rollback cleanup error for '${assetDef.id}': ${cleanupErr.message}`);
                }
            }
            throw err;
        }
    }
    return results;
}
