// Floria API — Category Repository
import { getAdminDb } from "../../config/database.js";
import type { Category } from "@floria/types";

export class CategoryRepository {
  async findAllActive(): Promise<Category[]> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data) return [];
    return data as Category[];
  }

  async findAll(): Promise<Category[]> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data) return [];
    return data as Category[];
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return data as Category;
  }

  async findById(id: string): Promise<Category | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Category;
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

    if (error || !data) throw error || new Error("Failed to create category");
    return data as Category;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return data as Category;
  }
}

export const categoryRepository = new CategoryRepository();
