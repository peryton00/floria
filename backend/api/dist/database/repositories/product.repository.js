"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepository = exports.ProductRepository = void 0;
// Floria API — Product & Catalog Repository
const database_js_1 = require("../../config/database.js");
const PRODUCT_LISTING_SELECT = `*, category:categories(id,name,slug), seller:seller_profiles(id,business_name), inventory:inventory(id,price_paise,stock_quantity,low_stock_threshold,sku,updated_at), images:product_images(*)`;
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
    async findBySlug(slug) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("products")
            .select(PRODUCT_LISTING_SELECT)
            .eq("slug", slug)
            .eq("status", "active")
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
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
}
exports.ProductRepository = ProductRepository;
exports.productRepository = new ProductRepository();
