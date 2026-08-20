// Floria — Storefront Data Access & Query Service
// Consumes backend Floria API (/api/v1/catalog) via @floria/api-client

import { api } from "@/lib/api";
import type {
  Category,
  ProductListing,
  ProductImage,
  Inventory,
  SellerProfile,
  Product,
} from "@floria/types";
import { MOCK_CATEGORIES, MOCK_SELLERS } from "@/lib/services/mockData";

const MOCK_PRODUCTS: Product[] = [
  { id: "p-1",  seller_id: "sel-1", category_id: "cat-1", name: "Snake Plant (Sansevieria)", slug: "snake-plant",          description: "The ultimate air-purifier. Minimal watering, resilient.", care_instructions: "Water every 2-3 weeks when soil is fully dry. Tolerates low light.", status: "active", created_at: "2026-01-01T00:00:00Z", updated_at: "" },
  { id: "p-2",  seller_id: "sel-1", category_id: "cat-1", name: "Monstera Deliciosa",        slug: "monstera-deliciosa",   description: "Swiss Cheese Plant with stunning split leaves.",            care_instructions: "Water weekly. Medium to bright indirect light.",               status: "active", created_at: "2026-01-02T00:00:00Z", updated_at: "" },
  { id: "p-3",  seller_id: "sel-2", category_id: "cat-1", name: "Fiddle Leaf Fig",            slug: "fiddle-leaf-fig",      description: "Large violin-shaped glossy leaves. A design statement.",   care_instructions: "Water when top 2 inches dry. Bright filtered light.",         status: "active", created_at: "2026-01-03T00:00:00Z", updated_at: "" },
  { id: "p-4",  seller_id: "sel-2", category_id: "cat-4", name: "Bougainvillea (Pink)",       slug: "bougainvillea-pink",   description: "Vibrant pink ornamental vine. Thrives in full sun.",        care_instructions: "Water when dry. Needs full direct sunlight.",                 status: "active", created_at: "2026-01-04T00:00:00Z", updated_at: "" },
  { id: "p-5",  seller_id: "sel-1", category_id: "cat-3", name: "Aloe Vera",                  slug: "aloe-vera",            description: "Medicinal succulent with cooling gel.",                    care_instructions: "Water every 3 weeks. Bright indirect light.",                 status: "active", created_at: "2026-01-05T00:00:00Z", updated_at: "" },
  { id: "p-6",  seller_id: "sel-3", category_id: "cat-6", name: "Terracotta Pot (Medium)",    slug: "terracotta-pot-medium",description: "Breathable clay planter. Prevents root rot.",              care_instructions: "Soak new pots in water before planting.",                    status: "active", created_at: "2026-01-06T00:00:00Z", updated_at: "" },
  { id: "p-7",  seller_id: "sel-1", category_id: "cat-5", name: "Sweet Basil Seeds",          slug: "sweet-basil-seeds",    description: "Aromatic Italian basil seeds for home herb garden.",        care_instructions: "Sow 1/4 inch deep in moist fertile soil.",                   status: "active", created_at: "2026-01-07T00:00:00Z", updated_at: "" },
  { id: "p-8",  seller_id: "sel-2", category_id: "cat-7", name: "Organic Vermicompost 5kg",   slug: "vermicompost-5kg",     description: "100% natural earthworm casting organic fertilizer.",        care_instructions: "Mix 100g with topsoil every 30 days.",                       status: "active", created_at: "2026-01-08T00:00:00Z", updated_at: "" },
  { id: "p-9",  seller_id: "sel-3", category_id: "cat-8", name: "Bypass Pruning Shears",      slug: "bypass-pruning-shears",description: "Sharp carbon steel blade for clean garden pruning.",       care_instructions: "Wipe clean and oil blade after use.",                        status: "active", created_at: "2026-01-09T00:00:00Z", updated_at: "" },
  { id: "p-10", seller_id: "sel-1", category_id: "cat-1", name: "Peace Lily (Spathiphyllum)", slug: "peace-lily",            description: "Graceful indoor air purifying plant with white blooms.",   care_instructions: "Keep soil moist. Thrives in shade or indirect light.",       status: "active", created_at: "2026-01-10T00:00:00Z", updated_at: "" },
  { id: "p-11", seller_id: "sel-3", category_id: "cat-6", name: "Ceramic Cylinder Planter",   slug: "ceramic-planter-white",description: "Minimalist white glazed ceramic pot with drainage tray.", care_instructions: "Wipe with damp cloth. Ensure drainage hole stays clear.",       status: "active", created_at: "2026-01-11T00:00:00Z", updated_at: "" },
  { id: "p-12", seller_id: "sel-2", category_id: "cat-2", name: "Areca Palm (Outdoor/Indoor)",slug: "areca-palm",            description: "Feathery tropical palm tree bringing lush green vibes.",    care_instructions: "Water twice a week. Bright indirect to direct light.",      status: "active", created_at: "2026-01-12T00:00:00Z", updated_at: "" },
];

const MOCK_INVENTORY: Record<string, Inventory> = {
  "p-1":  { id: "inv-1",  product_id: "p-1",  seller_id: "sel-1", price_paise: 29900, stock_quantity: 15, low_stock_threshold: 3, sku: "SP-001", updated_at: "" },
  "p-2":  { id: "inv-2",  product_id: "p-2",  seller_id: "sel-1", price_paise: 49900, stock_quantity: 8,  low_stock_threshold: 2, sku: "MD-002", updated_at: "" },
  "p-3":  { id: "inv-3",  product_id: "p-3",  seller_id: "sel-2", price_paise: 89900, stock_quantity: 0,  low_stock_threshold: 1, sku: "FL-003", updated_at: "" },
  "p-4":  { id: "inv-4",  product_id: "p-4",  seller_id: "sel-2", price_paise: 19900, stock_quantity: 25, low_stock_threshold: 5, sku: "BV-004", updated_at: "" },
  "p-5":  { id: "inv-5",  product_id: "p-5",  seller_id: "sel-1", price_paise: 15000, stock_quantity: 4,  low_stock_threshold: 2, sku: "AV-005", updated_at: "" },
  "p-6":  { id: "inv-6",  product_id: "p-6",  seller_id: "sel-3", price_paise: 12000, stock_quantity: 50, low_stock_threshold: 5, sku: "TP-006", updated_at: "" },
  "p-7":  { id: "inv-7",  product_id: "p-7",  seller_id: "sel-1", price_paise: 9900,  stock_quantity: 40, low_stock_threshold: 5, sku: "SB-007", updated_at: "" },
  "p-8":  { id: "inv-8",  product_id: "p-8",  seller_id: "sel-2", price_paise: 24900, stock_quantity: 18, low_stock_threshold: 3, sku: "VC-008", updated_at: "" },
  "p-9":  { id: "inv-9",  product_id: "p-9",  seller_id: "sel-3", price_paise: 39900, stock_quantity: 12, low_stock_threshold: 2, sku: "PS-009", updated_at: "" },
  "p-10": { id: "inv-10", product_id: "p-10", seller_id: "sel-1", price_paise: 34900, stock_quantity: 6,  low_stock_threshold: 2, sku: "PL-010", updated_at: "" },
  "p-11": { id: "inv-11", product_id: "p-11", seller_id: "sel-3", price_paise: 29900, stock_quantity: 14, low_stock_threshold: 3, sku: "CP-011", updated_at: "" },
  "p-12": { id: "inv-12", product_id: "p-12", seller_id: "sel-2", price_paise: 64900, stock_quantity: 9,  low_stock_threshold: 2, sku: "AP-012", updated_at: "" },
};

const MOCK_IMAGES: Record<string, ProductImage[]> = {
  "p-1":  [{ id: "img-1-1",  product_id: "p-1",  url: "/floria-logo.png", alt_text: "Snake Plant in Pot",         display_order: 1, is_primary: true, created_at: "" }],
  "p-2":  [{ id: "img-2-1",  product_id: "p-2",  url: "/floria-logo.png", alt_text: "Large Monstera Leaves",      display_order: 1, is_primary: true, created_at: "" }],
  "p-3":  [{ id: "img-3-1",  product_id: "p-3",  url: "/floria-logo.png", alt_text: "Fiddle Leaf Fig Tree",       display_order: 1, is_primary: true, created_at: "" }],
  "p-4":  [{ id: "img-4-1",  product_id: "p-4",  url: "/floria-logo.png", alt_text: "Blooming Pink Bougainvillea",display_order: 1, is_primary: true, created_at: "" }],
  "p-5":  [{ id: "img-5-1",  product_id: "p-5",  url: "/floria-logo.png", alt_text: "Aloe Vera Plant",            display_order: 1, is_primary: true, created_at: "" }],
  "p-6":  [{ id: "img-6-1",  product_id: "p-6",  url: "/floria-logo.png", alt_text: "Clay Terracotta Planter",    display_order: 1, is_primary: true, created_at: "" }],
  "p-7":  [{ id: "img-7-1",  product_id: "p-7",  url: "/floria-logo.png", alt_text: "Sweet Basil Seeds Pack",     display_order: 1, is_primary: true, created_at: "" }],
  "p-8":  [{ id: "img-8-1",  product_id: "p-8",  url: "/floria-logo.png", alt_text: "Organic Vermicompost Bag",   display_order: 1, is_primary: true, created_at: "" }],
  "p-9":  [{ id: "img-9-1",  product_id: "p-9",  url: "/floria-logo.png", alt_text: "Garden Pruning Shears",      display_order: 1, is_primary: true, created_at: "" }],
  "p-10": [{ id: "img-10-1", product_id: "p-10", url: "/floria-logo.png", alt_text: "Peace Lily Blooming",        display_order: 1, is_primary: true, created_at: "" }],
  "p-11": [{ id: "img-11-1", product_id: "p-11", url: "/floria-logo.png", alt_text: "Ceramic Cylinder Pot",       display_order: 1, is_primary: true, created_at: "" }],
  "p-12": [{ id: "img-12-1", product_id: "p-12", url: "/floria-logo.png", alt_text: "Areca Palm Plant",           display_order: 1, is_primary: true, created_at: "" }],
};

function buildMockListing(p: Product): ProductListing {
  const inv = MOCK_INVENTORY[p.id] ?? { id: "", product_id: p.id, seller_id: p.seller_id, price_paise: 0, stock_quantity: 0, low_stock_threshold: 0, sku: null, updated_at: "" };
  const imgs = MOCK_IMAGES[p.id] ?? [];
  const primary = imgs.find(i => i.is_primary) ?? imgs[0] ?? null;
  const seller = MOCK_SELLERS[p.seller_id] ?? { id: p.seller_id, business_name: "Green Leaf Nursery" };
  const cat = MOCK_CATEGORIES.find(c => c.id === p.category_id) ?? null;
  return {
    product: p,
    inventory: {
      ...inv,
      price_paise: inv.price_paise ?? 0,
    },
    primary_image: primary,
    seller,
    category: cat ? { id: cat.id, name: cat.name, slug: cat.slug } : null,
  };
}

function mapRow(row: Record<string, unknown>): ProductListing {
  const images = (row["images"] as ProductImage[]) ?? [];
  const rawInv = row["inventory"];
  const inv = (Array.isArray(rawInv) ? rawInv[0] : rawInv) as Partial<Inventory> ?? {};
  const rawRs = row["rating_summary"];
  const rs = Array.isArray(rawRs) ? rawRs[0] : rawRs;
  const rawPricing = (row["pricing"] as any) ?? (inv as any)?.pricing;

  const customerPrice = rawPricing?.customerPricePaise ?? rawPricing?.sellingPricePaise ?? inv.price_paise ?? 0;
  const rawOriginalPrice = (inv as any)?.original_price_paise;
  const compareAtPrice = rawPricing?.compareAtPricePaise ?? rawPricing?.originalPricePaise ?? (typeof rawOriginalPrice === "number" && rawOriginalPrice > customerPrice ? rawOriginalPrice : null);
  const isFreeDelivery = Boolean(rawPricing?.isFreeDelivery);

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
      created_at: (row["created_at"] as string) ?? "",
      updated_at: (row["updated_at"] as string) ?? "",
    },
    inventory: {
      id: inv.id ?? "",
      product_id: row["id"] as string,
      seller_id: row["seller_id"] as string,
      price_paise: customerPrice,
      stock_quantity: inv.stock_quantity ?? 0,
      low_stock_threshold: inv.low_stock_threshold ?? 5,
      sku: inv.sku ?? null,
      updated_at: inv.updated_at ?? "",
    },
    primary_image: images.find(i => i.is_primary) ?? images[0] ?? null,
    seller: row["seller"]
      ? { id: (row["seller"] as SellerProfile).id, business_name: (row["seller"] as SellerProfile).business_name }
      : { id: row["seller_id"] as string, business_name: "Unknown Nursery" },
    category: row["category"]
      ? { id: (row["category"] as Category).id, name: (row["category"] as Category).name, slug: (row["category"] as Category).slug }
      : null,
    rating_summary: rs ? {
      review_count: Number(rs.review_count ?? 0),
      avg_rating: Number(rs.avg_rating ?? 0),
      bayesian_rating: Number(rs.bayesian_rating ?? 0),
      wilson_lower_bound: Number(rs.wilson_lower_bound ?? 0),
    } : null,
    pricing: {
      customerPricePaise: customerPrice,
      sellingPricePaise: customerPrice,
      originalPricePaise: compareAtPrice,
      compareAtPricePaise: compareAtPrice,
      discountAmountPaise: rawPricing?.discountAmountPaise ?? (compareAtPrice ? compareAtPrice - customerPrice : 0),
      discountPercentage: rawPricing?.discountPercentage ?? (compareAtPrice ? Math.round(((compareAtPrice - customerPrice) / compareAtPrice) * 100) : 0),
      isDiscounted: Boolean(rawPricing?.isDiscounted || (compareAtPrice && compareAtPrice > customerPrice)),
      isFreeDelivery,
      isOverride: Boolean(rawPricing?.isOverride),
    },
  };
}

export interface ListingFilterOptions {
  categoryId?: string;
  categorySlug?: string;
  nurseryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  searchQuery?: string;
  sort?: "featured" | "top-rated" | "most-reviewed" | "price-asc" | "price-desc" | "newest";
}

export function filterAndSortListings(
  listings: ProductListing[],
  opts: ListingFilterOptions = {}
): ProductListing[] {
  let result = [...listings];

  if (opts.categorySlug && opts.categorySlug !== "all") {
    result = result.filter(l => l.category?.slug === opts.categorySlug);
  } else if (opts.categoryId) {
    result = result.filter(l => l.product.category_id === opts.categoryId);
  }

  if (opts.nurseryId && opts.nurseryId !== "all") {
    result = result.filter(l => l.product.seller_id === opts.nurseryId || l.seller.id === opts.nurseryId);
  }

  if (typeof opts.minPrice === "number" && opts.minPrice > 0) {
    const minPaise = opts.minPrice * 100;
    result = result.filter(l => l.inventory.price_paise >= minPaise);
  }
  if (typeof opts.maxPrice === "number" && opts.maxPrice > 0) {
    const maxPaise = opts.maxPrice * 100;
    result = result.filter(l => l.inventory.price_paise <= maxPaise);
  }

  if (opts.inStockOnly) {
    result = result.filter(l => l.inventory.stock_quantity > 0);
  }

  if (opts.searchQuery && opts.searchQuery.trim().length > 0) {
    const q = opts.searchQuery.trim().toLowerCase();
    result = result.filter(l => {
      const pName = l.product.name.toLowerCase();
      const pDesc = l.product.description?.toLowerCase() ?? "";
      const cName = l.category?.name.toLowerCase() ?? "";
      const sName = l.seller.business_name.toLowerCase();
      return pName.includes(q) || pDesc.includes(q) || cName.includes(q) || sName.includes(q);
    });
  }

  if (opts.sort === "price-asc") {
    result.sort((a, b) => a.inventory.price_paise - b.inventory.price_paise);
  } else if (opts.sort === "price-desc") {
    result.sort((a, b) => b.inventory.price_paise - a.inventory.price_paise);
  } else if (opts.sort === "newest") {
    result.sort((a, b) => new Date(b.product.created_at).getTime() - new Date(a.product.created_at).getTime());
  } else if (opts.sort === "top-rated") {
    result.sort((a, b) => {
      const aRating = a.rating_summary?.bayesian_rating ?? 0;
      const bRating = b.rating_summary?.bayesian_rating ?? 0;
      return bRating - aRating;
    });
  } else if (opts.sort === "most-reviewed") {
    result.sort((a, b) => {
      const aCount = a.rating_summary?.review_count ?? 0;
      const bCount = b.rating_summary?.review_count ?? 0;
      return bCount - aCount;
    });
  }

  return result;
}

// ============================================================
// PUBLIC STOREFRONT API (Using @floria/api-client)
// ============================================================

export async function getActiveCategories(): Promise<Category[]> {
  try {
    const res = await api.getCategories({ next: { revalidate: 300 } });
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn("[storefront] getActiveCategories API error:", e);
  }
  return [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getActiveCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getProductListings(
  categoryId?: string,
  options: ListingFilterOptions = {}
): Promise<ProductListing[]> {
  try {
    const params: Record<string, string> = {};
    if (categoryId) params["category_id"] = categoryId;
    if (options.searchQuery) params["search"] = options.searchQuery;

    const res = await api.getProducts(params, { next: { revalidate: 180 } });
    if (res.success && res.data && res.data.length > 0) {
      const rows = res.data as Record<string, unknown>[];
      const listings = rows.map(mapRow);
      return filterAndSortListings(listings, { ...options, categoryId });
    }
  } catch (e) {
    console.warn("[storefront] getProductListings API error:", e);
  }

  // Development Fallback
  const activeProds = MOCK_PRODUCTS.filter((p) => p.status === "active");
  const subset = categoryId ? activeProds.filter((p) => p.category_id === categoryId) : activeProds;
  const listings = subset.map(buildMockListing);
  return filterAndSortListings(listings, { ...options, categoryId });
}

export async function getProductListingsByCategorySlug(
  slug: string,
  options: ListingFilterOptions = {}
): Promise<ProductListing[]> {
  const cat = await getCategoryBySlug(slug);
  if (cat) {
    return getProductListings(cat.id, { ...options, categorySlug: slug });
  }
  const activeProds = MOCK_PRODUCTS.filter((p) => p.status === "active");
  const allMock = activeProds.map(buildMockListing);
  return filterAndSortListings(allMock, { ...options, categorySlug: slug });
}

export interface ProductDetailListing extends ProductListing {
  images: ProductImage[];
}

export async function getProductListingBySlug(slug: string): Promise<ProductDetailListing | null> {
  try {
    const res = await api.getProductBySlug(slug, { next: { revalidate: 180 } });
    if (res.success && res.data) {
      const row = res.data as Record<string, unknown>;
      return { ...mapRow(row), images: (row["images"] as ProductImage[]) ?? [] };
    }
  } catch (e) {
    console.warn("[storefront] getProductListingBySlug API error:", e);
  }

  // Development Fallback
  const activeProds = MOCK_PRODUCTS.filter((p) => p.status === "active");
  const mp = activeProds.find((p) => p.slug === slug);
  if (!mp) return null;
  return { ...buildMockListing(mp), images: MOCK_IMAGES[mp.id] ?? [] };
}

export async function searchProductListings(
  query: string,
  options: ListingFilterOptions = {}
): Promise<ProductListing[]> {
  return getProductListings(undefined, { ...options, searchQuery: query });
}

export async function getTrendingListings(limit = 10): Promise<ProductListing[]> {
  try {
    const res = await api.getTrendingProducts({ limit }, { next: { revalidate: 120 } });
    if (res.success && res.data && res.data.length > 0) {
      return (res.data as Record<string, unknown>[]).map(mapRow);
    }
  } catch (e) {
    console.warn("[storefront] getTrendingListings API error:", e);
  }
  return [];
}

export async function getRelatedListings(slug: string): Promise<ProductListing[]> {
  try {
    const res = await api.getRelatedProducts(slug, { next: { revalidate: 180 } });
    if (res.success && res.data && res.data.length > 0) {
      return (res.data as Record<string, unknown>[]).map(mapRow);
    }
  } catch (e) {
    console.warn("[storefront] getRelatedListings API error:", e);
  }
  return [];
}

