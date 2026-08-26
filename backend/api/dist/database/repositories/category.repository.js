"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRepository = exports.CategoryRepository = void 0;
// Floria API — Category Repository
const database_js_1 = require("../../config/database.js");
class CategoryRepository {
    async findAllActive() {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("categories")
            .select("*")
            .eq("is_active", true)
            .order("display_order", { ascending: true });
        if (error || !data)
            return [];
        return data;
    }
    async findAll() {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("categories")
            .select("*")
            .order("display_order", { ascending: true });
        if (error || !data)
            return [];
        return data;
    }
    async findBySlug(slug) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("categories")
            .select("*")
            .eq("slug", slug)
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async findById(id) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("categories")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async createCategory(payload) {
        const db = (0, database_js_1.getAdminDb)();
        const imgUrl = payload.banner_url || payload.image_url || null;
        const astId = payload.banner_asset_id || payload.asset_id || null;
        const { data, error } = await db
            .from("categories")
            .insert({
            name: payload.name.trim(),
            slug: payload.slug.trim().toLowerCase(),
            description: payload.description?.trim() || null,
            display_order: payload.display_order ?? 0,
            is_active: payload.is_active ?? true,
            image_url: imgUrl,
            banner_url: imgUrl,
            asset_id: astId,
            banner_asset_id: astId,
        })
            .select()
            .single();
        if (error || !data)
            throw error || new Error("Failed to create category");
        return data;
    }
    async updateCategory(id, updates) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("categories")
            .update(updates)
            .eq("id", id)
            .select()
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
}
exports.CategoryRepository = CategoryRepository;
exports.categoryRepository = new CategoryRepository();
