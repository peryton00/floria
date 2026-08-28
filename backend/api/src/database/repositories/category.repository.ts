// Floria API — Category Repository
import { getAdminDb } from "../../config/database.js";
import type { Category } from "@floria/types";
import { MediaResolverService } from "../../media/media-resolver.service.js";

export class CategoryRepository {
  async findAllActive(): Promise<Category[]> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data) return [];
    return MediaResolverService.enrichCategories(data as Category[]);
  }

  async findAll(): Promise<Category[]> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data) return [];
    return MediaResolverService.enrichCategories(data as Category[]);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    const [enriched] = await MediaResolverService.enrichCategories([
      data as Category,
    ]);
    return enriched;
  }

  async findById(id: string): Promise<Category | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    const [enriched] = await MediaResolverService.enrichCategories([
      data as Category,
    ]);
    return enriched;
  }

  async createCategory(payload: {
    name: string;
    slug: string;
    description?: string;
    display_order?: number;
    is_active?: boolean;
    image_url?: string;
    banner_url?: string;
    asset_id?: string;
    banner_asset_id?: string;
  }): Promise<Category> {
    const db = getAdminDb();
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

    if (error || !data) throw error || new Error("Failed to create category");
    const [enriched] = await MediaResolverService.enrichCategories([
      data as Category,
    ]);
    return enriched;
  }

  async updateCategory(
    id: string,
    updates: Record<string, any>,
  ): Promise<Category | null> {
    const db = getAdminDb();
    const dbPayload: Record<string, any> = {};

    if (updates.name !== undefined) dbPayload.name = updates.name.trim();
    if (updates.slug !== undefined)
      dbPayload.slug = updates.slug.trim().toLowerCase();
    if (updates.description !== undefined)
      dbPayload.description = updates.description?.trim() || null;
    if (updates.display_order !== undefined)
      dbPayload.display_order = updates.display_order;
    if (updates.is_active !== undefined)
      dbPayload.is_active = updates.is_active;

    const imgUrl = updates.image_url || updates.banner_url;
    if (imgUrl !== undefined) dbPayload.image_url = imgUrl || null;

    const astId = updates.banner_asset_id || updates.asset_id;
    if (astId !== undefined) dbPayload.banner_asset_id = astId || null;

    dbPayload.updated_at = new Date().toISOString();

    const { data, error } = await db
      .from("categories")
      .update(dbPayload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    const [enriched] = await MediaResolverService.enrichCategories([
      data as Category,
    ]);
    return enriched;
  }
}

export const categoryRepository = new CategoryRepository();
