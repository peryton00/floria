"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRepository = exports.CategoryRepository = void 0;
// Floria API — Category Repository
const database_js_1 = require("../../config/database.js");
const media_resolver_service_js_1 = require("../../media/media-resolver.service.js");
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
        return media_resolver_service_js_1.MediaResolverService.enrichCategories(data);
    }
    async findAll() {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("categories")
            .select("*")
            .order("display_order", { ascending: true });
        if (error || !data)
            return [];
        return media_resolver_service_js_1.MediaResolverService.enrichCategories(data);
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
        const [enriched] = await media_resolver_service_js_1.MediaResolverService.enrichCategories([
            data,
        ]);
        return enriched;
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
        const [enriched] = await media_resolver_service_js_1.MediaResolverService.enrichCategories([
            data,
        ]);
        return enriched;
    }
    async createCategory(payload) {
        const db = (0, database_js_1.getAdminDb)();
        const imgUrl = payload.image_url || payload.banner_url || null;
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
            banner_asset_id: astId,
        })
            .select()
            .single();
        if (error || !data)
            throw error || new Error("Failed to create category");
        const [enriched] = await media_resolver_service_js_1.MediaResolverService.enrichCategories([
            data,
        ]);
        return enriched;
    }
    async updateCategory(id, updates) {
        const db = (0, database_js_1.getAdminDb)();
        const dbPayload = {};
        if (updates.name !== undefined)
            dbPayload.name = updates.name.trim();
        if (updates.slug !== undefined)
            dbPayload.slug = updates.slug.trim().toLowerCase();
        if (updates.description !== undefined)
            dbPayload.description = updates.description?.trim() || null;
        if (updates.display_order !== undefined)
            dbPayload.display_order = updates.display_order;
        if (updates.is_active !== undefined)
            dbPayload.is_active = updates.is_active;
        const imgUrl = updates.image_url || updates.banner_url;
        if (imgUrl !== undefined)
            dbPayload.image_url = imgUrl || null;
        const astId = updates.banner_asset_id || updates.asset_id;
        if (astId !== undefined)
            dbPayload.banner_asset_id = astId || null;
        dbPayload.updated_at = new Date().toISOString();
        const { data, error } = await db
            .from("categories")
            .update(dbPayload)
            .eq("id", id)
            .select()
            .maybeSingle();
        if (error || !data)
            return null;
        const [enriched] = await media_resolver_service_js_1.MediaResolverService.enrichCategories([
            data,
        ]);
        return enriched;
    }
}
exports.CategoryRepository = CategoryRepository;
exports.categoryRepository = new CategoryRepository();
