"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaResolverService = void 0;
// Floria Media Infrastructure — Centralized Media Resolver Service
const database_js_1 = require("../config/database.js");
class MediaResolverService {
    /**
     * Resolves a map of asset_id -> { variantName: publicUrl } for a given list of asset IDs.
     */
    static async resolveAssetVariants(assetIds) {
        const variantMap = new Map();
        const uniqueIds = Array.from(new Set(assetIds.filter((id) => !!id)));
        if (uniqueIds.length === 0)
            return variantMap;
        const adminDb = (0, database_js_1.getAdminDb)();
        const { data: variants } = await adminDb
            .from("media_variants")
            .select("asset_id, variant_name, storage_bucket, storage_path")
            .in("asset_id", uniqueIds);
        if (!variants || variants.length === 0)
            return variantMap;
        const supabaseUrl = process.env.SUPABASE_URL || "";
        const getPublicUrl = (bucket, path) => `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
        for (const v of variants) {
            if (!variantMap.has(v.asset_id)) {
                variantMap.set(v.asset_id, {});
            }
            variantMap.get(v.asset_id)[v.variant_name] = getPublicUrl(v.storage_bucket, v.storage_path);
        }
        return variantMap;
    }
    /**
     * Enriches seller profile objects with logo_url and banner_url resolved from WebP variants.
     */
    static async enrichSellerProfiles(sellers) {
        if (!sellers || sellers.length === 0)
            return sellers;
        const assetIds = [];
        for (const s of sellers) {
            if (s.logo_asset_id)
                assetIds.push(s.logo_asset_id);
            if (s.banner_asset_id)
                assetIds.push(s.banner_asset_id);
        }
        if (assetIds.length === 0)
            return sellers;
        const variantMap = await this.resolveAssetVariants(assetIds);
        for (const s of sellers) {
            const item = s;
            if (item.logo_asset_id && variantMap.has(item.logo_asset_id)) {
                const vars = variantMap.get(item.logo_asset_id);
                item.logo_variants = vars;
                item.logo_url = vars.standard || vars.medium || vars.thumbnail || item.logo_url;
            }
            if (item.banner_asset_id && variantMap.has(item.banner_asset_id)) {
                const vars = variantMap.get(item.banner_asset_id);
                item.banner_variants = vars;
                item.banner_url = vars.cover || vars.card || vars.banner || item.banner_url;
            }
        }
        return sellers;
    }
    /**
     * Enriches user profile objects with avatar_url resolved from WebP variants.
     */
    static async enrichUserProfiles(users) {
        if (!users || users.length === 0)
            return users;
        const assetIds = users.map((u) => u.avatar_asset_id).filter(Boolean);
        if (assetIds.length === 0)
            return users;
        const variantMap = await this.resolveAssetVariants(assetIds);
        for (const u of users) {
            const item = u;
            if (item.avatar_asset_id && variantMap.has(item.avatar_asset_id)) {
                const vars = variantMap.get(item.avatar_asset_id);
                item.avatar_variants = vars;
                item.avatar_url = vars.avatar || vars.thumbnail || vars.medium || item.avatar_url;
            }
        }
        return users;
    }
    /**
     * Enriches category objects with banner_url resolved from WebP variants.
     */
    static async enrichCategories(categories) {
        if (!categories || categories.length === 0)
            return categories;
        const assetIds = categories
            .map((c) => c.banner_asset_id || c.asset_id)
            .filter(Boolean);
        const variantMap = assetIds.length > 0 ? await this.resolveAssetVariants(assetIds) : new Map();
        for (const c of categories) {
            const item = c;
            const astId = item.banner_asset_id || item.asset_id;
            if (astId && variantMap.has(astId)) {
                const vars = variantMap.get(astId);
                item.banner_variants = vars;
                item.banner_url = vars.banner || vars.medium || vars.cover || vars.thumbnail || item.image_url;
                item.image_url = item.banner_url;
            }
            else if (item.image_url) {
                item.banner_url = item.image_url;
            }
        }
        return categories;
    }
    /**
     * Enriches review media items with WebP URLs.
     */
    static async enrichReviewMedia(reviewMediaList) {
        if (!reviewMediaList || reviewMediaList.length === 0)
            return reviewMediaList;
        const assetIds = reviewMediaList.map((rm) => rm.asset_id).filter(Boolean);
        if (assetIds.length === 0)
            return reviewMediaList;
        const variantMap = await this.resolveAssetVariants(assetIds);
        for (const rm of reviewMediaList) {
            const item = rm;
            if (item.asset_id && variantMap.has(item.asset_id)) {
                const vars = variantMap.get(item.asset_id);
                item.variants = vars;
                item.url = vars.display || vars.medium || vars.thumbnail || item.url;
            }
        }
        return reviewMediaList;
    }
}
exports.MediaResolverService = MediaResolverService;
