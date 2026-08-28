"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepository = exports.ProductRepository = void 0;
// Floria API — Product & Catalog Repository
const database_js_1 = require("../../config/database.js");
const PRODUCT_LISTING_SELECT = `*, category:categories(id,name,slug), seller:seller_profiles(id,business_name), inventory:inventory(id,price_paise,stock_quantity,low_stock_threshold,sku,updated_at), images:product_images(*), rating_summary:product_rating_summary(review_count,avg_rating,bayesian_rating,wilson_lower_bound,star_1_count,star_2_count,star_3_count,star_4_count,star_5_count)`;
class ProductRepository {
    /**
     * Enriches product_images with WebP variant URLs from media_assets/media_variants when asset_id is attached.
     */
    async enrichProductImages(products) {
        if (!Array.isArray(products) || products.length === 0)
            return products;
        // Collect all unique asset_ids from product images
        const assetIds = [];
        for (const p of products) {
            if (Array.isArray(p.images)) {
                for (const img of p.images) {
                    if (img.asset_id)
                        assetIds.push(img.asset_id);
                }
            }
        }
        if (assetIds.length === 0)
            return products;
        try {
            const db = (0, database_js_1.getAdminDb)();
            const [{ data: assetsData }, { data: variantsData }] = await Promise.all([
                db
                    .from("media_assets")
                    .select("id, original_filename, mime_type, file_size_bytes, sha256_hash, status, is_system_seeded, created_at, width, height, storage_bucket")
                    .in("id", assetIds),
                db
                    .from("media_variants")
                    .select("asset_id, variant_name, format, width, height, file_size_bytes, storage_bucket, storage_path")
                    .in("asset_id", assetIds),
            ]);
            const assetMap = new Map();
            if (Array.isArray(assetsData)) {
                for (const a of assetsData) {
                    assetMap.set(a.id, a);
                }
            }
            const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.co";
            const variantMap = new Map();
            const variantDetailsMap = new Map();
            if (Array.isArray(variantsData)) {
                for (const v of variantsData) {
                    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${v.storage_bucket}/${v.storage_path}`;
                    const existingVars = variantMap.get(v.asset_id) || {};
                    existingVars[v.variant_name] = publicUrl;
                    variantMap.set(v.asset_id, existingVars);
                    const existingDetails = variantDetailsMap.get(v.asset_id) || [];
                    existingDetails.push({
                        variant_name: v.variant_name,
                        format: v.format,
                        width: v.width,
                        height: v.height,
                        file_size_bytes: v.file_size_bytes,
                        storage_bucket: v.storage_bucket,
                        storage_path: v.storage_path,
                        url: publicUrl,
                    });
                    variantDetailsMap.set(v.asset_id, existingDetails);
                }
            }
            // Enrich product images
            for (const p of products) {
                if (Array.isArray(p.images)) {
                    p.images = p.images.map((img) => {
                        if (img.asset_id) {
                            const vars = variantMap.get(img.asset_id) || {};
                            const variantDetails = variantDetailsMap.get(img.asset_id) || [];
                            const assetMeta = assetMap.get(img.asset_id) || null;
                            const preferredUrl = vars.medium || vars.large || vars.thumbnail || img.url;
                            return {
                                ...img,
                                url: preferredUrl,
                                variants: vars,
                                variant_details: variantDetails,
                                asset: assetMeta,
                            };
                        }
                        return img;
                    });
                }
            }
        }
        catch (e) {
            console.warn("[ProductRepository] Failed to enrich media_variants:", e?.message);
        }
        return products;
    }
    async findActiveCatalog(categoryId, search) {
        const db = (0, database_js_1.getAdminDb)();
        let q = db
            .from("products")
            .select(PRODUCT_LISTING_SELECT)
            .eq("status", "active");
        if (categoryId) {
            q = q.eq("category_id", categoryId);
        }
        if (search) {
            q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }
        const { data, error } = await q;
        if (error || !data)
            return [];
        return this.enrichProductImages(data);
    }
    async findAll(filters) {
        const db = (0, database_js_1.getAdminDb)();
        let q = db
            .from("products")
            .select(PRODUCT_LISTING_SELECT)
            .neq("status", "deleted");
        if (filters?.status && filters.status !== "all") {
            q = q.eq("status", filters.status);
        }
        if (filters?.categoryId) {
            q = q.eq("category_id", filters.categoryId);
        }
        if (filters?.sellerId) {
            q = q.eq("seller_id", filters.sellerId);
        }
        if (filters?.search) {
            q = q.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
        const { data, error } = await q.order("created_at", { ascending: false });
        if (error || !data)
            return [];
        return this.enrichProductImages(data);
    }
    async updateStatus(productId, status) {
        const db = (0, database_js_1.getAdminDb)();
        const { error } = await db
            .from("products")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", productId);
        return !error;
    }
    async findBySlug(slugOrId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: bySlug } = await db
            .from("products")
            .select(PRODUCT_LISTING_SELECT)
            .eq("slug", slugOrId)
            .neq("status", "deleted")
            .maybeSingle();
        if (bySlug) {
            const [enriched] = await this.enrichProductImages([bySlug]);
            return enriched;
        }
        const { data: byId } = await db
            .from("products")
            .select(PRODUCT_LISTING_SELECT)
            .eq("id", slugOrId)
            .neq("status", "deleted")
            .maybeSingle();
        if (byId) {
            const [enriched] = await this.enrichProductImages([byId]);
            return enriched;
        }
        const { data: fallbackList } = await db
            .from("products")
            .select(PRODUCT_LISTING_SELECT)
            .ilike("slug", `%${slugOrId}%`)
            .neq("status", "deleted")
            .limit(1);
        if (fallbackList?.[0]) {
            const [enriched] = await this.enrichProductImages([fallbackList[0]]);
            return enriched;
        }
        return null;
    }
    async findById(productId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("products")
            .select(PRODUCT_LISTING_SELECT)
            .eq("id", productId)
            .maybeSingle();
        if (error || !data)
            return null;
        const [enriched] = await this.enrichProductImages([data]);
        return enriched;
    }
    async findBySellerId(sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("products")
            .select(PRODUCT_LISTING_SELECT)
            .eq("seller_id", sellerId)
            .neq("status", "deleted")
            .order("created_at", { ascending: false });
        if (error || !data)
            return [];
        return this.enrichProductImages(data);
    }
    async getInventory(productId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("inventory")
            .select("*")
            .eq("product_id", productId)
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    // Related: same category, exclude current product, limit 6
    async findRelated(productId, categoryId, limit = 6) {
        const db = (0, database_js_1.getAdminDb)();
        let q = db
            .from("products")
            .select(PRODUCT_LISTING_SELECT)
            .eq("status", "active")
            .neq("id", productId)
            .limit(limit);
        if (categoryId)
            q = q.eq("category_id", categoryId);
        const { data } = await q.order("created_at", { ascending: false });
        return data ?? [];
    }
    // Trending: join order_items from last 7 days, rank by order volume × bayesian rating
    // ponytail: full scan of recent order_items. Acceptable at current scale.
    //           Add a materialized view if order volume exceeds ~50k/week.
    async findTrending(limit = 12) {
        const db = (0, database_js_1.getAdminDb)();
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        // Get top product_ids by recent order item count
        const { data: trendingIds } = await db
            .from("order_items")
            .select("product_id, count:product_id.count()")
            .gte("created_at", since)
            .order("count", { ascending: false })
            .limit(limit * 2); // fetch extra so we can filter by active status
        if (!trendingIds?.length) {
            // Fallback: return highest-rated active products
            const { data } = await db
                .from("product_rating_summary")
                .select(`product:products!inner(${PRODUCT_LISTING_SELECT})`)
                .order("bayesian_rating", { ascending: false })
                .limit(limit);
            return (data ?? []).map((r) => r.product).filter(Boolean);
        }
        const productIds = trendingIds
            .map((r) => r.product_id)
            .filter(Boolean);
        const { data } = await db
            .from("products")
            .select(PRODUCT_LISTING_SELECT)
            .in("id", productIds)
            .eq("status", "active")
            .limit(limit);
        return data ?? [];
    }
}
exports.ProductRepository = ProductRepository;
exports.productRepository = new ProductRepository();
