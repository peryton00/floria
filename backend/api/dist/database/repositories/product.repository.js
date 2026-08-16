"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepository = exports.ProductRepository = void 0;
// Floria API — Product & Catalog Repository
const database_js_1 = require("../../config/database.js");
const PRODUCT_LISTING_SELECT = `*, category:categories(id,name,slug), seller:seller_profiles(id,business_name), inventory:inventory(id,price_paise,stock_quantity,low_stock_threshold,sku,updated_at), images:product_images(*), rating_summary:product_rating_summary(review_count,avg_rating,bayesian_rating,wilson_lower_bound,star_1_count,star_2_count,star_3_count,star_4_count,star_5_count)`;
class ProductRepository {
    async findActiveCatalog(categoryId, search) {
        const db = (0, database_js_1.getAdminDb)();
        let q = db.from("products").select(PRODUCT_LISTING_SELECT).eq("status", "active");
        if (categoryId) {
            q = q.eq("category_id", categoryId);
        }
        if (search) {
            q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }
        const { data, error } = await q;
        if (error || !data)
            return [];
        return data;
    }
    async findAll(filters) {
        const db = (0, database_js_1.getAdminDb)();
        let q = db.from("products").select(PRODUCT_LISTING_SELECT).neq("status", "deleted");
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
        return data;
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
        if (bySlug)
            return bySlug;
        const { data: byId } = await db
            .from("products")
            .select(PRODUCT_LISTING_SELECT)
            .eq("id", slugOrId)
            .neq("status", "deleted")
            .maybeSingle();
        if (byId)
            return byId;
        const { data: fallbackList } = await db
            .from("products")
            .select(PRODUCT_LISTING_SELECT)
            .ilike("slug", `%${slugOrId}%`)
            .neq("status", "deleted")
            .limit(1);
        return fallbackList?.[0] || null;
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
        return data;
    }
    async findBySellerId(sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("products")
            .select("*")
            .eq("seller_id", sellerId);
        if (error || !data)
            return [];
        return data;
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
        const productIds = trendingIds.map((r) => r.product_id).filter(Boolean);
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
