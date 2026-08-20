// Floria API — Product & Catalog Repository
import { getAdminDb } from "../../config/database.js";
import type { Product, Inventory } from "@floria/types";

const PRODUCT_LISTING_SELECT = `*, category:categories(id,name,slug), seller:seller_profiles(id,business_name), inventory:inventory(id,price_paise,stock_quantity,low_stock_threshold,sku,updated_at), images:product_images(*), rating_summary:product_rating_summary(review_count,avg_rating,bayesian_rating,wilson_lower_bound,star_1_count,star_2_count,star_3_count,star_4_count,star_5_count)`;

export class ProductRepository {
  /**
   * Enriches product_images with WebP variant URLs from media_assets/media_variants when asset_id is attached.
   */
  public async enrichProductImages(products: any[]): Promise<any[]> {
    if (!Array.isArray(products) || products.length === 0) return products;

    // Collect all unique asset_ids from product images
    const assetIds: string[] = [];
    for (const p of products) {
      if (Array.isArray(p.images)) {
        for (const img of p.images) {
          if (img.asset_id) assetIds.push(img.asset_id);
        }
      }
    }

    if (assetIds.length === 0) return products;

    try {
      const db = getAdminDb();
      const { data: variantsData } = await db
        .from("media_variants")
        .select("asset_id, variant_name, format, width, height, storage_bucket, storage_path")
        .in("asset_id", assetIds);

      if (!variantsData || variantsData.length === 0) return products;

      const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.co";
      const variantMap = new Map<string, Record<string, string>>();

      for (const v of variantsData) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${v.storage_bucket}/${v.storage_path}`;
        const existing = variantMap.get(v.asset_id) || {};
        existing[v.variant_name] = publicUrl;
        variantMap.set(v.asset_id, existing);
      }

      // Enrich product images
      for (const p of products) {
        if (Array.isArray(p.images)) {
          p.images = p.images.map((img: any) => {
            if (img.asset_id && variantMap.has(img.asset_id)) {
              const vars = variantMap.get(img.asset_id)!;
              const preferredUrl = vars.medium || vars.large || vars.thumbnail || img.url;
              return {
                ...img,
                url: preferredUrl,
                variants: vars,
              };
            }
            return img;
          });
        }
      }
    } catch (e: any) {
      console.warn("[ProductRepository] Failed to enrich media_variants:", e?.message);
    }

    return products;
  }

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
    return this.enrichProductImages(data);
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
    return this.enrichProductImages(data);
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

  async findById(productId: string): Promise<Product | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("products")
      .select(PRODUCT_LISTING_SELECT)
      .eq("id", productId)
      .maybeSingle();

    if (error || !data) return null;
    const [enriched] = await this.enrichProductImages([data]);
    return enriched as any;
  }

  async findBySellerId(sellerId: string): Promise<Product[]> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("products")
      .select(PRODUCT_LISTING_SELECT)
      .eq("seller_id", sellerId)
      .neq("status", "deleted")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return this.enrichProductImages(data);
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

  // Related: same category, exclude current product, limit 6
  async findRelated(productId: string, categoryId: string | null, limit = 6): Promise<any[]> {
    const db = getAdminDb();
    let q = db
      .from("products")
      .select(PRODUCT_LISTING_SELECT)
      .eq("status", "active")
      .neq("id", productId)
      .limit(limit);

    if (categoryId) q = q.eq("category_id", categoryId);

    const { data } = await q.order("created_at", { ascending: false });
    return data ?? [];
  }

  // Trending: join order_items from last 7 days, rank by order volume × bayesian rating
  // ponytail: full scan of recent order_items. Acceptable at current scale.
  //           Add a materialized view if order volume exceeds ~50k/week.
  async findTrending(limit = 12): Promise<any[]> {
    const db = getAdminDb();
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
      return (data ?? []).map((r: any) => r.product).filter(Boolean);
    }

    const productIds = trendingIds.map((r: any) => r.product_id).filter(Boolean);
    const { data } = await db
      .from("products")
      .select(PRODUCT_LISTING_SELECT)
      .in("id", productIds)
      .eq("status", "active")
      .limit(limit);

    return data ?? [];
  }
}

export const productRepository = new ProductRepository();
