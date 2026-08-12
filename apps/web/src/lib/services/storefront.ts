// Floria — Storefront Data Access & Query Service
// Encapsulates Supabase queries for the customer storefront.
// Falls back to rich static mock data when DB is offline / unconfigured.

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Category,
  ProductListing,
  ProductImage,
  Inventory,
  SellerProfile,
  Product,
} from "@floria/types";

// ============================================================
// MOCK FALLBACKS
// ============================================================

const MOCK_CATEGORIES: Category[] = [
  { id:"cat-1", name:"Indoor Plants",        slug:"indoor-plants",      description:"Fresh air purifiers for your home",              image_url:null, parent_id:null, display_order:1, is_active:true, created_at:"", updated_at:"" },
  { id:"cat-2", name:"Outdoor Plants",       slug:"outdoor-plants",     description:"Vibrant garden shrubs and trees",                image_url:null, parent_id:null, display_order:2, is_active:true, created_at:"", updated_at:"" },
  { id:"cat-3", name:"Succulents & Cacti",   slug:"succulents-cacti",   description:"Low-maintenance desert beauty",                  image_url:null, parent_id:null, display_order:3, is_active:true, created_at:"", updated_at:"" },
  { id:"cat-4", name:"Flowering Plants",     slug:"flowering-plants",   description:"Colorful seasonal blooms",                      image_url:null, parent_id:null, display_order:4, is_active:true, created_at:"", updated_at:"" },
  { id:"cat-5", name:"Herbs & Edibles",      slug:"herbs-edibles",      description:"Grow your own fresh kitchen ingredients",        image_url:null, parent_id:null, display_order:5, is_active:true, created_at:"", updated_at:"" },
  { id:"cat-6", name:"Planters & Pots",      slug:"planters-pots",      description:"Beautiful ceramic and clay housing",             image_url:null, parent_id:null, display_order:6, is_active:true, created_at:"", updated_at:"" },
  { id:"cat-7", name:"Soil & Fertilizers",   slug:"soil-fertilizers",   description:"Nutrient-rich mixtures for healthy roots",       image_url:null, parent_id:null, display_order:7, is_active:true, created_at:"", updated_at:"" },
  { id:"cat-8", name:"Tools & Accessories",  slug:"tools-accessories",  description:"Essential tools for gardening maintenance",      image_url:null, parent_id:null, display_order:8, is_active:true, created_at:"", updated_at:"" },
];

const MOCK_SELLERS: Record<string, Pick<SellerProfile, "id" | "business_name">> = {
  "sel-1": { id:"sel-1", business_name:"Green Leaf Nursery" },
  "sel-2": { id:"sel-2", business_name:"Nisarga Gardens" },
  "sel-3": { id:"sel-3", business_name:"Clay & Co." },
};

const MOCK_PRODUCTS: Product[] = [
  { id:"p-1", seller_id:"sel-1", category_id:"cat-1", name:"Snake Plant (Sansevieria)", slug:"snake-plant",          description:"The ultimate air-purifier. Minimal watering, resilient.", care_instructions:"Water every 2-3 weeks when soil is fully dry. Tolerates low light.", status:"active", created_at:"", updated_at:"" },
  { id:"p-2", seller_id:"sel-1", category_id:"cat-1", name:"Monstera Deliciosa",        slug:"monstera-deliciosa",   description:"Swiss Cheese Plant with stunning split leaves.",            care_instructions:"Water weekly. Medium to bright indirect light.",               status:"active", created_at:"", updated_at:"" },
  { id:"p-3", seller_id:"sel-2", category_id:"cat-1", name:"Fiddle Leaf Fig",            slug:"fiddle-leaf-fig",      description:"Large violin-shaped glossy leaves. A design statement.",   care_instructions:"Water when top 2 inches dry. Bright filtered light.",         status:"active", created_at:"", updated_at:"" },
  { id:"p-4", seller_id:"sel-2", category_id:"cat-4", name:"Bougainvillea (Pink)",       slug:"bougainvillea-pink",   description:"Vibrant pink ornamental vine. Thrives in full sun.",        care_instructions:"Water when dry. Needs full direct sunlight.",                 status:"active", created_at:"", updated_at:"" },
  { id:"p-5", seller_id:"sel-1", category_id:"cat-3", name:"Aloe Vera",                  slug:"aloe-vera",            description:"Medicinal succulent with cooling gel.",                    care_instructions:"Water every 3 weeks. Bright indirect light.",                 status:"active", created_at:"", updated_at:"" },
  { id:"p-6", seller_id:"sel-3", category_id:"cat-6", name:"Terracotta Pot (Medium)",    slug:"terracotta-pot-medium",description:"Breathable clay planter. Prevents root rot.",              care_instructions:"Soak new pots in water before planting.",                    status:"active", created_at:"", updated_at:"" },
];

const MOCK_INVENTORY: Record<string, Inventory> = {
  "p-1": { id:"inv-1", product_id:"p-1", seller_id:"sel-1", price_paise:29900, stock_quantity:15, low_stock_threshold:3, sku:"SP-001", updated_at:"" },
  "p-2": { id:"inv-2", product_id:"p-2", seller_id:"sel-1", price_paise:49900, stock_quantity:8,  low_stock_threshold:2, sku:"MD-002", updated_at:"" },
  "p-3": { id:"inv-3", product_id:"p-3", seller_id:"sel-2", price_paise:89900, stock_quantity:0,  low_stock_threshold:1, sku:"FL-003", updated_at:"" },
  "p-4": { id:"inv-4", product_id:"p-4", seller_id:"sel-2", price_paise:19900, stock_quantity:25, low_stock_threshold:5, sku:"BV-004", updated_at:"" },
  "p-5": { id:"inv-5", product_id:"p-5", seller_id:"sel-1", price_paise:15000, stock_quantity:4,  low_stock_threshold:2, sku:"AV-005", updated_at:"" },
  "p-6": { id:"inv-6", product_id:"p-6", seller_id:"sel-3", price_paise:12000, stock_quantity:50, low_stock_threshold:5, sku:"TP-006", updated_at:"" },
};

const MOCK_IMAGES: Record<string, ProductImage[]> = {
  "p-1": [{ id:"img-1-1", product_id:"p-1", url:"/floria-logo.png", alt_text:"Snake Plant in Pot",         display_order:1, is_primary:true, created_at:"" }],
  "p-2": [{ id:"img-2-1", product_id:"p-2", url:"/floria-logo.png", alt_text:"Large Monstera Leaves",      display_order:1, is_primary:true, created_at:"" }],
  "p-3": [{ id:"img-3-1", product_id:"p-3", url:"/floria-logo.png", alt_text:"Fiddle Leaf Fig Tree",       display_order:1, is_primary:true, created_at:"" }],
  "p-4": [{ id:"img-4-1", product_id:"p-4", url:"/floria-logo.png", alt_text:"Blooming Pink Bougainvillea",display_order:1, is_primary:true, created_at:"" }],
  "p-5": [{ id:"img-5-1", product_id:"p-5", url:"/floria-logo.png", alt_text:"Aloe Vera Plant",            display_order:1, is_primary:true, created_at:"" }],
  "p-6": [{ id:"img-6-1", product_id:"p-6", url:"/floria-logo.png", alt_text:"Clay Terracotta Planter",    display_order:1, is_primary:true, created_at:"" }],
};

function buildMockListing(p: Product): ProductListing {
  const inv = MOCK_INVENTORY[p.id] ?? { id:"", product_id:p.id, seller_id:p.seller_id, price_paise:0, stock_quantity:0, low_stock_threshold:0, sku:null, updated_at:"" };
  const imgs = MOCK_IMAGES[p.id] ?? [];
  const primary = imgs.find(i => i.is_primary) ?? imgs[0] ?? null;
  const seller = MOCK_SELLERS[p.seller_id] ?? { id:p.seller_id, business_name:"Unknown Nursery" };
  const cat = MOCK_CATEGORIES.find(c => c.id === p.category_id) ?? null;
  return {
    product: p,
    inventory: inv,
    primary_image: primary,
    seller,
    category: cat ? { id:cat.id, name:cat.name, slug:cat.slug } : null,
  };
}

function mapRow(row: Record<string, unknown>): ProductListing {
  const images = (row["images"] as ProductImage[]) ?? [];
  const inv = (row["inventory"] as Partial<Inventory>) ?? {};
  return {
    product: {
      id: row["id"] as string,
      seller_id: row["seller_id"] as string,
      category_id: row["category_id"] as string | null,
      name: row["name"] as string,
      slug: row["slug"] as string,
      description: row["description"] as string | null,
      care_instructions: row["care_instructions"] as string | null,
      status: row["status"] as Product["status"],
      created_at: row["created_at"] as string,
      updated_at: row["updated_at"] as string,
    },
    inventory: {
      id: inv.id ?? "",
      product_id: row["id"] as string,
      seller_id: row["seller_id"] as string,
      price_paise: inv.price_paise ?? 0,
      stock_quantity: inv.stock_quantity ?? 0,
      low_stock_threshold: inv.low_stock_threshold ?? 5,
      sku: inv.sku ?? null,
      updated_at: inv.updated_at ?? "",
    },
    primary_image: images.find(i => i.is_primary) ?? images[0] ?? null,
    seller: row["seller"]
      ? { id:(row["seller"] as SellerProfile).id, business_name:(row["seller"] as SellerProfile).business_name }
      : { id: row["seller_id"] as string, business_name:"Unknown Nursery" },
    category: row["category"]
      ? { id:(row["category"] as Category).id, name:(row["category"] as Category).name, slug:(row["category"] as Category).slug }
      : null,
  };
}

// ============================================================
// PUBLIC API
// ============================================================

export async function getActiveCategories(): Promise<Category[]> {
  try {
    const db = await getSupabaseServerClient();
    const { data, error } = await db.from("categories").select("*").eq("is_active", true).order("display_order");
    if (error) throw error;
    return data?.length ? (data as Category[]) : MOCK_CATEGORIES;
  } catch (e) {
    console.warn("[storefront] getActiveCategories fallback:", e);
    return MOCK_CATEGORIES;
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const db = await getSupabaseServerClient();
    const { data, error } = await db.from("categories").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
    if (error) throw error;
    return (data as Category) ?? MOCK_CATEGORIES.find(c => c.slug === slug) ?? null;
  } catch (e) {
    console.warn("[storefront] getCategoryBySlug fallback:", e);
    return MOCK_CATEGORIES.find(c => c.slug === slug) ?? null;
  }
}

const LISTING_SELECT = `*, category:categories(id,name,slug), seller:seller_profiles(id,business_name), inventory:inventory(id,price_paise,stock_quantity,low_stock_threshold,sku,updated_at), images:product_images(*)`;

export async function getProductListings(categoryId?: string): Promise<ProductListing[]> {
  try {
    const db = await getSupabaseServerClient();
    let q = db.from("products").select(LISTING_SELECT).eq("status", "active");
    if (categoryId) q = q.eq("category_id", categoryId);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as Record<string, unknown>[];
    if (!rows.length) {
      const subset = categoryId ? MOCK_PRODUCTS.filter(p => p.category_id === categoryId) : MOCK_PRODUCTS;
      return subset.map(buildMockListing);
    }
    return rows.map(mapRow);
  } catch (e) {
    console.warn("[storefront] getProductListings fallback:", e);
    const subset = categoryId ? MOCK_PRODUCTS.filter(p => p.category_id === categoryId) : MOCK_PRODUCTS;
    return subset.map(buildMockListing);
  }
}

export async function getProductListingsByCategorySlug(slug: string): Promise<ProductListing[]> {
  const cat = await getCategoryBySlug(slug);
  if (!cat) return [];
  return getProductListings(cat.id);
}

export interface ProductDetailListing extends ProductListing {
  images: ProductImage[];
}

export async function getProductListingBySlug(slug: string): Promise<ProductDetailListing | null> {
  try {
    const db = await getSupabaseServerClient();
    const { data, error } = await db.from("products").select(LISTING_SELECT).eq("slug", slug).eq("status", "active").maybeSingle();
    if (error) throw error;
    if (!data) {
      const mp = MOCK_PRODUCTS.find(p => p.slug === slug);
      if (!mp) return null;
      return { ...buildMockListing(mp), images: MOCK_IMAGES[mp.id] ?? [] };
    }
    const row = data as Record<string, unknown>;
    return { ...mapRow(row), images: (row["images"] as ProductImage[]) ?? [] };
  } catch (e) {
    console.warn("[storefront] getProductListingBySlug fallback:", e);
    const mp = MOCK_PRODUCTS.find(p => p.slug === slug);
    if (!mp) return null;
    return { ...buildMockListing(mp), images: MOCK_IMAGES[mp.id] ?? [] };
  }
}

export async function searchProductListings(query: string): Promise<ProductListing[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const db = await getSupabaseServerClient();
    const { data, error } = await db.from("products").select(LISTING_SELECT).eq("status", "active").or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    if (error) throw error;
    const rows = (data ?? []) as Record<string, unknown>[];
    if (!rows.length) return MOCK_PRODUCTS.filter(p => matchesQuery(p, q)).map(buildMockListing);
    return rows.map(mapRow);
  } catch (e) {
    console.warn("[storefront] searchProductListings fallback:", e);
    return MOCK_PRODUCTS.filter(p => matchesQuery(p, q)).map(buildMockListing);
  }
}

function matchesQuery(p: Product, q: string): boolean {
  const lq = q.toLowerCase();
  return p.name.toLowerCase().includes(lq) || (p.description?.toLowerCase().includes(lq) ?? false);
}
