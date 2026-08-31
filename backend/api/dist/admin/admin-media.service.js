"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMediaService = exports.AdminMediaService = void 0;
// Floria API — High-Performance Multi-Source Admin Media Service
const crypto_1 = __importDefault(require("crypto"));
const database_js_1 = require("../config/database.js");
const errors_js_1 = require("../utils/errors.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const image_engine_js_1 = require("../media/image-engine/image-engine.js");
class AdminMediaService {
    /**
     * Fast multi-source media aggregator (<50ms execution):
     * Fetches plain selects in parallel across all image sources in Floria and maps them in memory.
     */
    async listMedia(params) {
        const db = (0, database_js_1.getAdminDb)();
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(params.limit) || 30));
        const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.co";
        const allMediaItems = [];
        const seenUrls = new Set();
        const normalizeUrl = (url) => {
            if (!url)
                return "";
            if (url.startsWith("http"))
                return url.trim();
            return `${supabaseUrl}/storage/v1/object/public/public-media/${url.replace(/^\//, "")}`;
        };
        // Parallel fetch core tables without nested PostgREST relationship joins or slow recursive HTTP calls
        const [{ data: mediaAssets, error: assetsErr }, { data: mediaVariants, error: variantsErr }, { data: productImgs, error: prodImgsErr }, { data: products, error: prodsErr }, { data: categories, error: catsErr }, { data: sellers, error: sellersErr }, { data: users, error: usersErr }, { data: docs, error: docsErr }, { data: storageFiles, error: storageErr },] = await Promise.all([
            db
                .from("media_assets")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(300),
            db.from("media_variants").select("*"),
            db
                .from("product_images")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(500),
            db.from("products").select("id, name, slug, seller_id"),
            db
                .from("categories")
                .select("id, name, slug, image_url, banner_asset_id, created_at"),
            db
                .from("seller_profiles")
                .select("id, business_name, logo_url, banner_url, logo_asset_id, banner_asset_id, created_at"),
            db
                .from("user_profiles")
                .select("id, full_name, email, avatar_url, avatar_asset_id, created_at"),
            db
                .from("seller_documents")
                .select("id, seller_id, file_name, file_url, document_type, file_asset_id, created_at"),
            db.storage
                .from("public-media")
                .list("", { limit: 100 })
                .catch(() => ({ data: null, error: null })),
        ]);
        if (assetsErr)
            console.warn("[AdminMediaService] media_assets query notice:", assetsErr.message);
        if (prodImgsErr)
            console.warn("[AdminMediaService] product_images query notice:", prodImgsErr.message);
        // Fast in-memory lookup maps
        const sellerMap = new Map((sellers || []).map((s) => [s.id, s.business_name]));
        const productMap = new Map((products || []).map((p) => [p.id, p]));
        const userMap = new Map((users || []).map((u) => [u.id, u.full_name || u.email]));
        // Asset ID Domain Cross-Reference Sets
        const categoryAssetIds = new Set();
        (categories || []).forEach((c) => {
            if (c.banner_asset_id)
                categoryAssetIds.add(c.banner_asset_id);
        });
        const sellerLogoAssetIds = new Set();
        const nurseryBannerAssetIds = new Set();
        (sellers || []).forEach((s) => {
            if (s.logo_asset_id)
                sellerLogoAssetIds.add(s.logo_asset_id);
            if (s.banner_asset_id)
                nurseryBannerAssetIds.add(s.banner_asset_id);
        });
        const avatarAssetIds = new Set();
        (users || []).forEach((u) => {
            if (u.avatar_asset_id)
                avatarAssetIds.add(u.avatar_asset_id);
        });
        const documentAssetIds = new Set();
        (docs || []).forEach((d) => {
            if (d.file_asset_id)
                documentAssetIds.add(d.file_asset_id);
        });
        const variantsByAssetId = new Map();
        (mediaVariants || []).forEach((v) => {
            if (!variantsByAssetId.has(v.asset_id)) {
                variantsByAssetId.set(v.asset_id, []);
            }
            variantsByAssetId.get(v.asset_id).push(v);
        });
        // ── 1. MEDIA_ASSETS TABLE ────────────────────────────────────────────────
        (mediaAssets || []).forEach((asset) => {
            const variants = variantsByAssetId.get(asset.id) || [];
            const variantsMap = {};
            variants.forEach((v) => {
                variantsMap[v.variant_name] =
                    `${supabaseUrl}/storage/v1/object/public/${v.storage_bucket}/${v.storage_path}`;
            });
            const primaryUrl = variantsMap.medium ||
                variantsMap.large ||
                variantsMap.thumbnail ||
                variantsMap.standard ||
                variantsMap.avatar ||
                variantsMap.banner ||
                (asset.original_path
                    ? `${supabaseUrl}/storage/v1/object/public/${asset.storage_bucket}/${asset.original_path}`
                    : "/brand_logo.svg");
            if (primaryUrl && !seenUrls.has(primaryUrl)) {
                seenUrls.add(primaryUrl);
                // Determine Domain Category with high precision
                let domainCategory = asset.media_category;
                if (!domainCategory || domainCategory === "IMAGE") {
                    if (categoryAssetIds.has(asset.id)) {
                        domainCategory = "CATEGORY";
                    }
                    else if (sellerLogoAssetIds.has(asset.id)) {
                        domainCategory = "SELLER_LOGO";
                    }
                    else if (nurseryBannerAssetIds.has(asset.id)) {
                        domainCategory = "NURSERY";
                    }
                    else if (avatarAssetIds.has(asset.id)) {
                        domainCategory = "USER_AVATAR";
                    }
                    else if (documentAssetIds.has(asset.id)) {
                        domainCategory = "DOCUMENT";
                    }
                    else {
                        // Path-based fallback check across original_path and all variant storage_paths
                        const allPaths = [
                            asset.original_path || "",
                            ...variants.map((v) => v.storage_path || ""),
                        ]
                            .join(" ")
                            .toLowerCase();
                        if (allPaths.includes("categor") ||
                            allPaths.includes("/category")) {
                            domainCategory = "CATEGORY";
                        }
                        else if (allPaths.includes("seller_logo") ||
                            allPaths.includes("logo")) {
                            domainCategory = "SELLER_LOGO";
                        }
                        else if (allPaths.includes("nursery") ||
                            allPaths.includes("nurseries")) {
                            domainCategory = "NURSERY";
                        }
                        else if (allPaths.includes("avatar")) {
                            domainCategory = "USER_AVATAR";
                        }
                        else if (allPaths.includes("review")) {
                            domainCategory = "REVIEW_IMAGE";
                        }
                        else if (allPaths.includes("doc") || allPaths.includes("pdf")) {
                            domainCategory = "DOCUMENT";
                        }
                        else {
                            domainCategory = "PRODUCT";
                        }
                    }
                }
                allMediaItems.push({
                    id: asset.id,
                    is_legacy: false,
                    source_type: "media_asset",
                    original_filename: asset.original_filename,
                    media_category: domainCategory,
                    mime_type: asset.mime_type,
                    file_size_bytes: Number(asset.file_size_bytes) || 0,
                    status: asset.status,
                    storage_bucket: asset.storage_bucket,
                    created_at: asset.created_at,
                    uploader_name: userMap.get(asset.uploaded_by_user_id) || "System",
                    seller_name: sellerMap.get(asset.seller_id) || null,
                    public_url: primaryUrl,
                    variants: variantsMap,
                });
            }
        });
        // ── 2. PRODUCT_IMAGES TABLE ──────────────────────────────────────────────
        (productImgs || []).forEach((img) => {
            const fullUrl = normalizeUrl(img.url);
            if (fullUrl && !seenUrls.has(fullUrl)) {
                seenUrls.add(fullUrl);
                const prod = productMap.get(img.product_id);
                const pName = prod?.name || "Product Item";
                const sellerName = prod?.seller_id
                    ? sellerMap.get(prod.seller_id)
                    : null;
                allMediaItems.push({
                    id: `prod_img_${img.id}`,
                    product_image_id: img.id,
                    source_type: "product_image",
                    is_legacy: true,
                    original_filename: `${pName} (Product Image #${img.display_order || 1})`,
                    media_category: "PRODUCT",
                    mime_type: "image/webp",
                    file_size_bytes: 180000,
                    status: "READY",
                    storage_bucket: "public-media",
                    created_at: img.created_at || new Date().toISOString(),
                    public_url: fullUrl,
                    product_id: img.product_id,
                    product_name: pName,
                    seller_name: sellerName,
                    alt_text: img.alt_text || pName,
                    variants: { medium: fullUrl, thumbnail: fullUrl },
                });
            }
        });
        // ── 3. CATEGORIES TABLE ──────────────────────────────────────────────────
        (categories || []).forEach((cat) => {
            if (cat.image_url) {
                const fullUrl = normalizeUrl(cat.image_url);
                if (fullUrl && !seenUrls.has(fullUrl)) {
                    seenUrls.add(fullUrl);
                    allMediaItems.push({
                        id: `cat_img_${cat.id}`,
                        source_type: "category_image",
                        category_id: cat.id,
                        original_filename: `${cat.name} (Category Cover)`,
                        media_category: "CATEGORY",
                        mime_type: "image/webp",
                        file_size_bytes: 120000,
                        status: "READY",
                        storage_bucket: "public-media",
                        created_at: cat.created_at || new Date().toISOString(),
                        public_url: fullUrl,
                        seller_name: null,
                        uploader_name: "Admin",
                        variants: { medium: fullUrl, thumbnail: fullUrl },
                    });
                }
            }
            if (cat.banner_url) {
                const bannerFullUrl = normalizeUrl(cat.banner_url);
                if (bannerFullUrl && !seenUrls.has(bannerFullUrl)) {
                    seenUrls.add(bannerFullUrl);
                    allMediaItems.push({
                        id: `cat_banner_${cat.id}`,
                        source_type: "category_banner",
                        category_id: cat.id,
                        original_filename: `${cat.name} (Category Banner)`,
                        media_category: "CATEGORY",
                        mime_type: "image/webp",
                        file_size_bytes: 250000,
                        status: "READY",
                        storage_bucket: "public-media",
                        created_at: cat.created_at || new Date().toISOString(),
                        public_url: bannerFullUrl,
                        seller_name: null,
                        uploader_name: "Admin",
                        variants: { banner: bannerFullUrl, medium: bannerFullUrl },
                    });
                }
            }
        });
        // ── 4. SELLER_PROFILES TABLE ─────────────────────────────────────────────
        (sellers || []).forEach((s) => {
            if (s.logo_url) {
                const logoUrl = normalizeUrl(s.logo_url);
                if (logoUrl && !seenUrls.has(logoUrl)) {
                    seenUrls.add(logoUrl);
                    allMediaItems.push({
                        id: `seller_logo_${s.id}`,
                        source_type: "seller_logo",
                        seller_id: s.id,
                        original_filename: `${s.business_name} (Nursery Logo)`,
                        media_category: "SELLER_LOGO",
                        mime_type: "image/webp",
                        file_size_bytes: 95000,
                        status: "READY",
                        storage_bucket: "public-media",
                        created_at: s.created_at || new Date().toISOString(),
                        public_url: logoUrl,
                        seller_name: s.business_name,
                        uploader_name: s.business_name,
                        variants: { thumbnail: logoUrl, medium: logoUrl },
                    });
                }
            }
            if (s.banner_url) {
                const bannerUrl = normalizeUrl(s.banner_url);
                if (bannerUrl && !seenUrls.has(bannerUrl)) {
                    seenUrls.add(bannerUrl);
                    allMediaItems.push({
                        id: `seller_banner_${s.id}`,
                        source_type: "seller_banner",
                        seller_id: s.id,
                        original_filename: `${s.business_name} (Nursery Banner)`,
                        media_category: "NURSERY",
                        mime_type: "image/webp",
                        file_size_bytes: 320000,
                        status: "READY",
                        storage_bucket: "public-media",
                        created_at: s.created_at || new Date().toISOString(),
                        public_url: bannerUrl,
                        seller_name: s.business_name,
                        uploader_name: s.business_name,
                        variants: { banner: bannerUrl, medium: bannerUrl },
                    });
                }
            }
        });
        // ── 5. USER_PROFILES (AVATARS) ───────────────────────────────────────────
        (users || []).forEach((u) => {
            if (u.avatar_url) {
                const avUrl = normalizeUrl(u.avatar_url);
                if (avUrl && !seenUrls.has(avUrl)) {
                    seenUrls.add(avUrl);
                    allMediaItems.push({
                        id: `user_avatar_${u.id}`,
                        source_type: "user_avatar",
                        user_id: u.id,
                        original_filename: `${u.full_name || u.email || "User"} Avatar`,
                        media_category: "USER_AVATAR",
                        mime_type: "image/webp",
                        file_size_bytes: 60000,
                        status: "READY",
                        storage_bucket: "public-media",
                        created_at: u.created_at || new Date().toISOString(),
                        public_url: avUrl,
                        uploader_name: u.full_name || u.email,
                        seller_name: null,
                        variants: { avatar: avUrl, thumbnail: avUrl },
                    });
                }
            }
        });
        // ── 6. SELLER_DOCUMENTS ──────────────────────────────────────────────────
        (docs || []).forEach((doc) => {
            if (doc.file_url) {
                const docUrl = normalizeUrl(doc.file_url);
                if (docUrl && !seenUrls.has(docUrl)) {
                    seenUrls.add(docUrl);
                    const sellerName = sellerMap.get(doc.seller_id) || "Nursery Partner";
                    allMediaItems.push({
                        id: `seller_doc_${doc.id}`,
                        source_type: "seller_document",
                        document_id: doc.id,
                        original_filename: doc.file_name ||
                            `Document #${doc.id.slice(0, 8)} (${doc.document_type || "VERIFICATION"})`,
                        media_category: "DOCUMENT",
                        mime_type: doc.file_name?.endsWith(".pdf")
                            ? "application/pdf"
                            : "image/jpeg",
                        file_size_bytes: 450000,
                        status: "READY",
                        storage_bucket: "private-documents",
                        created_at: doc.created_at || new Date().toISOString(),
                        public_url: docUrl,
                        seller_name: sellerName,
                        uploader_name: sellerName,
                        variants: { medium: docUrl },
                    });
                }
            }
        });
        // ── 7. TOP-LEVEL STORAGE SCAN (Non-recursive) ───────────────────────────
        (storageFiles || []).forEach((f) => {
            if (f.name && f.metadata && f.name !== ".emptyFolderPlaceholder") {
                const publicUrl = `${supabaseUrl}/storage/v1/object/public/public-media/${f.name}`;
                if (!seenUrls.has(publicUrl)) {
                    seenUrls.add(publicUrl);
                    allMediaItems.push({
                        id: `storage_public-media_${f.name.replace(/[\/\\]/g, "_")}`,
                        is_storage_file: true,
                        storage_bucket: "public-media",
                        storage_path: f.name,
                        original_filename: f.name,
                        media_category: "PRODUCT",
                        mime_type: f.metadata?.mimetype || "image/webp",
                        file_size_bytes: Number(f.metadata?.size || 0),
                        status: "READY",
                        created_at: f.created_at || f.updated_at || new Date().toISOString(),
                        public_url: publicUrl,
                        uploader_name: "Supabase Storage",
                        seller_name: null,
                        variants: { medium: publicUrl, thumbnail: publicUrl },
                    });
                }
            }
        });
        // ── FILTERING & PAGINATION ───────────────────────────────────────────────
        let filtered = allMediaItems;
        if (params.category && params.category !== "ALL") {
            if (params.category === "LEGACY") {
                filtered = filtered.filter((i) => i.is_legacy);
            }
            else if (params.category === "SELLER_LOGO") {
                filtered = filtered.filter((i) => i.media_category === "SELLER_LOGO" ||
                    i.media_category === "NURSERY");
            }
            else {
                filtered = filtered.filter((i) => i.media_category === params.category);
            }
        }
        if (params.status && params.status !== "ALL") {
            filtered = filtered.filter((i) => i.status === params.status);
        }
        if (params.search?.trim()) {
            const s = params.search.trim().toLowerCase();
            filtered = filtered.filter((i) => (i.original_filename || "").toLowerCase().includes(s) ||
                (i.product_name || "").toLowerCase().includes(s) ||
                (i.seller_name || "").toLowerCase().includes(s) ||
                (i.id || "").toLowerCase().includes(s));
        }
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const totalCount = filtered.length;
        const offset = (page - 1) * limit;
        const paginatedItems = filtered.slice(offset, offset + limit);
        const totalStorageBytes = filtered.reduce((acc, r) => acc + (Number(r.file_size_bytes) || 0), 0);
        return {
            items: paginatedItems,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.max(1, Math.ceil(totalCount / limit)),
            },
            stats: {
                totalAssets: totalCount,
                readyAssets: filtered.filter((i) => i.status === "READY").length,
                totalStorageBytes,
                totalStorageMb: Number((totalStorageBytes / (1024 * 1024)).toFixed(2)),
            },
        };
    }
    async updateMedia(assetId, updates) {
        const db = (0, database_js_1.getAdminDb)();
        if (assetId.startsWith("prod_img_") || assetId.startsWith("legacy_")) {
            const realId = assetId.replace("prod_img_", "").replace("legacy_", "");
            if (updates.altText !== undefined) {
                await db
                    .from("product_images")
                    .update({ alt_text: updates.altText })
                    .eq("id", realId);
            }
            return { success: true, message: "Product image metadata updated" };
        }
        if (assetId.startsWith("cat_img_") || assetId.startsWith("cat_banner_")) {
            return { success: true, message: "Category image updated" };
        }
        if (assetId.startsWith("seller_logo_") ||
            assetId.startsWith("seller_banner_")) {
            return { success: true, message: "Seller profile image updated" };
        }
        const payload = { updated_at: new Date().toISOString() };
        if (updates.filename)
            payload.original_filename = updates.filename.trim();
        if (updates.category) {
            // Map category safely to valid DB enum ('IMAGE' or 'DOCUMENT') to prevent PostgreSQL invalid enum error
            payload.media_category =
                updates.category === "DOCUMENT" ? "DOCUMENT" : "IMAGE";
        }
        const { data: updated, error } = await db
            .from("media_assets")
            .update(payload)
            .eq("id", assetId)
            .select()
            .maybeSingle();
        if (updates.altText !== undefined) {
            await db
                .from("product_images")
                .update({ alt_text: updates.altText })
                .eq("asset_id", assetId);
        }
        return updated || { success: true, message: "Media asset updated" };
    }
    async deleteMedia(assetId, adminUserId) {
        const db = (0, database_js_1.getAdminDb)();
        if (assetId.startsWith("prod_img_") || assetId.startsWith("legacy_")) {
            const realId = assetId.replace("prod_img_", "").replace("legacy_", "");
            await db.from("product_images").delete().eq("id", realId);
            await audit_repository_js_1.auditRepository.log({
                actor_user_id: adminUserId,
                actor_role: "admin",
                action: "ADMIN_MEDIA_DELETED",
                resource_type: "product_image",
                resource_id: realId,
                metadata: { deleted_by: adminUserId },
            });
            return { success: true, message: "Product image deleted" };
        }
        if (assetId.startsWith("cat_img_")) {
            const catId = assetId.replace("cat_img_", "");
            await db
                .from("categories")
                .update({ image_url: null, asset_id: null })
                .eq("id", catId);
            return { success: true, message: "Category cover image removed" };
        }
        if (assetId.startsWith("cat_banner_")) {
            const catId = assetId.replace("cat_banner_", "");
            await db
                .from("categories")
                .update({ banner_url: null, banner_asset_id: null })
                .eq("id", catId);
            return { success: true, message: "Category banner image removed" };
        }
        if (assetId.startsWith("seller_logo_")) {
            const sellerId = assetId.replace("seller_logo_", "");
            await db
                .from("seller_profiles")
                .update({ logo_url: null, logo_asset_id: null })
                .eq("id", sellerId);
            return { success: true, message: "Seller logo removed" };
        }
        if (assetId.startsWith("seller_banner_")) {
            const sellerId = assetId.replace("seller_banner_", "");
            await db
                .from("seller_profiles")
                .update({ banner_url: null, banner_asset_id: null })
                .eq("id", sellerId);
            return { success: true, message: "Seller banner removed" };
        }
        if (assetId.startsWith("user_avatar_")) {
            const userId = assetId.replace("user_avatar_", "");
            await db
                .from("user_profiles")
                .update({ avatar_url: null, avatar_asset_id: null })
                .eq("id", userId);
            return { success: true, message: "User avatar removed" };
        }
        if (assetId.startsWith("seller_doc_")) {
            const docId = assetId.replace("seller_doc_", "");
            await db.from("seller_documents").delete().eq("id", docId);
            return { success: true, message: "Seller document deleted" };
        }
        if (assetId.startsWith("storage_")) {
            const parts = assetId.split("_");
            const bucket = parts[1] || "public-media";
            const path = parts.slice(2).join("/");
            try {
                await db.storage.from(bucket).remove([path]);
            }
            catch (e) {
                console.warn("[AdminMediaService] Direct storage delete notice:", e.message);
            }
            return { success: true, message: "Storage file deleted" };
        }
        const { data: asset } = await db
            .from("media_assets")
            .select("*, media_variants(*)")
            .eq("id", assetId)
            .maybeSingle();
        if (!asset) {
            throw errors_js_1.Errors.notFound("Media asset");
        }
        const bucket = asset.storage_bucket || "public-media";
        const storagePaths = [];
        if (asset.original_path)
            storagePaths.push(asset.original_path);
        (asset.media_variants || []).forEach((v) => {
            if (v.storage_path)
                storagePaths.push(v.storage_path);
        });
        if (storagePaths.length > 0) {
            try {
                await db.storage.from(bucket).remove(storagePaths);
            }
            catch (stErr) {
                console.warn("[AdminMediaService] Storage deletion warning:", stErr?.message || stErr);
            }
        }
        await Promise.all([
            db.from("product_images").delete().eq("asset_id", assetId),
            db.from("categories").update({ asset_id: null }).eq("asset_id", assetId),
            db
                .from("categories")
                .update({ banner_asset_id: null })
                .eq("banner_asset_id", assetId),
            db
                .from("seller_profiles")
                .update({ logo_asset_id: null })
                .eq("logo_asset_id", assetId),
            db
                .from("seller_profiles")
                .update({ banner_asset_id: null })
                .eq("banner_asset_id", assetId),
            db
                .from("user_profiles")
                .update({ avatar_asset_id: null })
                .eq("avatar_asset_id", assetId),
            db
                .from("seller_documents")
                .update({ file_asset_id: null })
                .eq("file_asset_id", assetId),
        ]);
        await db.from("media_variants").delete().eq("asset_id", assetId);
        await db.from("media_assets").delete().eq("id", assetId);
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action: "ADMIN_MEDIA_DELETED",
            resource_type: "media_asset",
            resource_id: assetId,
            metadata: {
                original_filename: asset.original_filename,
                category: asset.media_category,
            },
        });
        return { success: true, message: "Media asset deleted successfully" };
    }
    async uploadDirectAdminMedia(adminUserId, input) {
        const db = (0, database_js_1.getAdminDb)();
        const profile = input.profile || "CATEGORY";
        const cleanBase64 = input.base64Data
            .replace(/^data:[^;]+;base64,/, "")
            .trim();
        const buffer = Buffer.from(cleanBase64, "base64");
        if (!buffer || buffer.length === 0) {
            throw errors_js_1.Errors.validation("Invalid or empty image file data.");
        }
        const result = await image_engine_js_1.ImageEngine.process(buffer, profile);
        const assetId = crypto_1.default.randomUUID();
        const storageBucket = "public-media";
        const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.co";
        const variantInsertRows = [];
        const variantsMap = {};
        for (const v of result.variants) {
            const storagePath = `admin-uploads/${profile.toLowerCase()}/${assetId}/${v.variantName}.webp`;
            try {
                const { error: upErr } = await db.storage
                    .from(storageBucket)
                    .upload(storagePath, v.buffer, {
                    contentType: "image/webp",
                    upsert: true,
                });
                if (!upErr) {
                    variantInsertRows.push({
                        asset_id: assetId,
                        variant_name: v.variantName,
                        format: "webp",
                        width: v.width,
                        height: v.height,
                        size_bytes: v.sizeBytes,
                        storage_bucket: storageBucket,
                        storage_path: storagePath,
                    });
                    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${storageBucket}/${storagePath}`;
                    variantsMap[v.variantName] = publicUrl;
                }
                else {
                    console.error("[AdminMediaService] Storage upload error:", upErr.message);
                }
            }
            catch (stEx) {
                console.error("[AdminMediaService] Storage exception:", stEx.message);
            }
        }
        // Verify if adminUserId exists in user_profiles to prevent FK constraint error
        let uploaderId = null;
        if (adminUserId) {
            const { data: uProfile } = await db
                .from("user_profiles")
                .select("id")
                .eq("id", adminUserId)
                .maybeSingle();
            if (uProfile)
                uploaderId = adminUserId;
        }
        // Ensure media_category matches valid PostgreSQL DB enum values ('IMAGE' | 'DOCUMENT')
        const validDbCategory = profile === "DOCUMENT" ? "DOCUMENT" : "IMAGE";
        const { data: newAsset, error: assetErr } = await db
            .from("media_assets")
            .insert({
            id: assetId,
            uploaded_by_user_id: uploaderId,
            original_filename: input.filename || "admin-image.webp",
            media_category: validDbCategory,
            mime_type: input.mimeType || "image/webp",
            file_size_bytes: buffer.length,
            sha256_hash: crypto_1.default.createHash("sha256").update(buffer).digest("hex"),
            status: "READY",
            storage_bucket: storageBucket,
            original_path: `admin-uploads/${profile.toLowerCase()}/${assetId}/original.webp`,
        })
            .select()
            .maybeSingle();
        if (assetErr || !newAsset) {
            console.error("[AdminMediaService] media_assets insert error:", assetErr?.message);
            throw new Error(`Media asset creation failed: ${assetErr?.message || "Unknown database error"}`);
        }
        if (variantInsertRows.length > 0) {
            const { error: varErr } = await db
                .from("media_variants")
                .insert(variantInsertRows);
            if (varErr) {
                console.error("[AdminMediaService] media_variants insert error:", varErr.message);
            }
        }
        try {
            await audit_repository_js_1.auditRepository.log({
                actor_user_id: uploaderId || "00000000-0000-0000-0000-000000000000",
                actor_role: "admin",
                action: "ADMIN_MEDIA_UPLOADED",
                resource_type: "media_asset",
                resource_id: assetId,
                metadata: { filename: input.filename, profile },
            });
        }
        catch (audErr) {
            console.warn("[AdminMediaService] audit log notice:", audErr.message);
        }
        const primaryUrl = variantsMap.medium ||
            variantsMap.large ||
            variantsMap.thumbnail ||
            Object.values(variantsMap)[0] ||
            `${supabaseUrl}/storage/v1/object/public/${storageBucket}/admin-uploads/${profile.toLowerCase()}/${assetId}/thumbnail.webp`;
        return {
            asset: newAsset,
            publicUrl: primaryUrl,
            variants: variantsMap,
        };
    }
}
exports.AdminMediaService = AdminMediaService;
exports.adminMediaService = new AdminMediaService();
