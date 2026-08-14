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

  async createCategory(payload: { name: string; slug: string; description?: string; display_order?: number; is_active?: boolean }): Promise<Category> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("categories")
      .insert({
        name: payload.name.trim(),
        slug: payload.slug.trim().toLowerCase(),
        description: payload.description?.trim() || null,
        display_order: payload.display_order ?? 0,
        is_active: payload.is_active ?? true,
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
