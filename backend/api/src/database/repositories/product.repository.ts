// Floria API — Product & Catalog Repository
import { getAdminDb } from "../../config/database.js";
import type { Product, Inventory } from "@floria/types";

const PRODUCT_LISTING_SELECT = `*, category:categories(id,name,slug), seller:seller_profiles(id,business_name), inventory:inventory(id,price_paise,stock_quantity,low_stock_threshold,sku,updated_at), images:product_images(*)`;

export class ProductRepository {
  async findActiveCatalog(categoryId?: string, search?: string): Promise<any[]> {
    const db = getAdminDb();
    let q = db.from("products").select(PRODUCT_LISTING_SELECT).eq("status", "active");

    if (categoryId) {
      q = q.eq("category_id", categoryId);
    }

    if (search) {
      q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await q;
    if (error || !data) return [];
    return data;
  }

  async findAll(filters?: { search?: string; status?: string; categoryId?: string; sellerId?: string }): Promise<any[]> {
    const db = getAdminDb();
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
    if (error || !data) return [];
    return data;
  }

  async updateStatus(productId: string, status: string): Promise<boolean> {
    const db = getAdminDb();
    const { error } = await db
      .from("products")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", productId);

    return !error;
  }

  async findBySlug(slugOrId: string): Promise<any | null> {
    const db = getAdminDb();

    const { data: bySlug } = await db
      .from("products")
      .select(PRODUCT_LISTING_SELECT)
      .eq("slug", slugOrId)
      .neq("status", "deleted")
      .maybeSingle();

    if (bySlug) return bySlug;

    const { data: byId } = await db
      .from("products")
      .select(PRODUCT_LISTING_SELECT)
      .eq("id", slugOrId)
      .neq("status", "deleted")
      .maybeSingle();

    if (byId) return byId;

    const { data: fallbackList } = await db
      .from("products")
      .select(PRODUCT_LISTING_SELECT)
      .ilike("slug", `%${slugOrId}%`)
      .neq("status", "deleted")
      .limit(1);

    return fallbackList?.[0] || null;
  }

  async findById(productId: string): Promise<Product | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("products")
      .select(PRODUCT_LISTING_SELECT)
      .eq("id", productId)
      .maybeSingle();

    if (error || !data) return null;
    return data as any;
  }

  async findBySellerId(sellerId: string): Promise<Product[]> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("products")
      .select("*")
      .eq("seller_id", sellerId);

    if (error || !data) return [];
    return data as Product[];
  }

  async getInventory(productId: string): Promise<Inventory | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("inventory")
      .select("*")
      .eq("product_id", productId)
      .maybeSingle();

    if (error || !data) return null;
    return data as Inventory;
  }
}

export const productRepository = new ProductRepository();
