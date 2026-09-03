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
function mapRow(row: Record<string, unknown>): ProductListing {
  const images = (row["images"] as ProductImage[]) ?? [];
  const rawInv = row["inventory"];
  const inv =
    ((Array.isArray(rawInv) ? rawInv[0] : rawInv) as Partial<Inventory>) ?? {};
  const rawRs = row["rating_summary"];
  const rs = Array.isArray(rawRs) ? rawRs[0] : rawRs;
  const rawPricing = (row["pricing"] as any) ?? (inv as any)?.pricing;

  const customerPrice =
    rawPricing?.customerPricePaise ??
    rawPricing?.sellingPricePaise ??
    inv.price_paise ??
    0;
  const rawOriginalPrice = (inv as any)?.original_price_paise;
  const compareAtPrice =
    rawPricing?.compareAtPricePaise ??
    rawPricing?.originalPricePaise ??
    (typeof rawOriginalPrice === "number" && rawOriginalPrice > customerPrice
      ? rawOriginalPrice
      : null);
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
    primary_image: images.find((i) => i.is_primary) ?? images[0] ?? null,
    seller: row["seller"]
      ? {
          id: (row["seller"] as SellerProfile).id,
          business_name: (row["seller"] as SellerProfile).business_name,
        }
      : { id: row["seller_id"] as string, business_name: "Unknown Nursery" },
    category: row["category"]
      ? {
          id: (row["category"] as Category).id,
          name: (row["category"] as Category).name,
          slug: (row["category"] as Category).slug,
        }
      : null,
    rating_summary: rs
      ? {
          review_count: Number(rs.review_count ?? 0),
          avg_rating: Number(rs.avg_rating ?? 0),
          bayesian_rating: Number(rs.bayesian_rating ?? 0),
          wilson_lower_bound: Number(rs.wilson_lower_bound ?? 0),
        }
      : null,
    pricing: {
      customerPricePaise: customerPrice,
      sellingPricePaise: customerPrice,
      originalPricePaise: compareAtPrice,
      compareAtPricePaise: compareAtPrice,
      discountAmountPaise:
        rawPricing?.discountAmountPaise ??
        (compareAtPrice ? compareAtPrice - customerPrice : 0),
      discountPercentage:
        rawPricing?.discountPercentage ??
        (compareAtPrice
          ? Math.round(
              ((compareAtPrice - customerPrice) / compareAtPrice) * 100,
            )
          : 0),
      isDiscounted: Boolean(
        rawPricing?.isDiscounted ||
        (compareAtPrice && compareAtPrice > customerPrice),
      ),
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
  page?: number;
  limit?: number;
  sort?:
    | "featured"
    | "top-rated"
    | "most-reviewed"
    | "price-asc"
    | "price-desc"
    | "newest";
}

export function filterAndSortListings(
  listings: ProductListing[],
  opts: ListingFilterOptions = {},
): ProductListing[] {
  let result = [...listings];

  if (opts.categorySlug && opts.categorySlug !== "all") {
    result = result.filter((l) => l.category?.slug === opts.categorySlug);
  } else if (opts.categoryId) {
    result = result.filter((l) => l.product.category_id === opts.categoryId);
  }

  if (opts.nurseryId && opts.nurseryId !== "all") {
    result = result.filter(
      (l) =>
        l.product.seller_id === opts.nurseryId ||
        l.seller.id === opts.nurseryId,
    );
  }

  if (typeof opts.minPrice === "number" && opts.minPrice > 0) {
    const minPaise = opts.minPrice * 100;
    result = result.filter((l) => l.inventory.price_paise >= minPaise);
  }
  if (typeof opts.maxPrice === "number" && opts.maxPrice > 0) {
    const maxPaise = opts.maxPrice * 100;
    result = result.filter((l) => l.inventory.price_paise <= maxPaise);
  }

  if (opts.inStockOnly) {
    result = result.filter((l) => l.inventory.stock_quantity > 0);
  }

  if (opts.searchQuery && opts.searchQuery.trim().length > 0) {
    const q = opts.searchQuery.trim().toLowerCase();
    result = result.filter((l) => {
      const pName = l.product.name.toLowerCase();
      const pDesc = l.product.description?.toLowerCase() ?? "";
      const cName = l.category?.name.toLowerCase() ?? "";
      const sName = l.seller.business_name.toLowerCase();
      return (
        pName.includes(q) ||
        pDesc.includes(q) ||
        cName.includes(q) ||
        sName.includes(q)
      );
    });
  }

  if (opts.sort === "price-asc") {
    result.sort((a, b) => a.inventory.price_paise - b.inventory.price_paise);
  } else if (opts.sort === "price-desc") {
    result.sort((a, b) => b.inventory.price_paise - a.inventory.price_paise);
  } else if (opts.sort === "newest") {
    result.sort(
      (a, b) =>
        new Date(b.product.created_at).getTime() -
        new Date(a.product.created_at).getTime(),
    );
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
    const res = await api.getCategories({ cache: "no-store" });
    if (res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    console.warn("[storefront] getActiveCategories API error:", e);
  }
  return [];
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const categories = await getActiveCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getProductListings(
  categoryId?: string,
  options: ListingFilterOptions = {},
): Promise<ProductListing[]> {
  try {
    const params: Record<string, string> = {};
    if (categoryId) params["category_id"] = categoryId;
    if (options.searchQuery) params["search"] = options.searchQuery;
    if (options.page) params["page"] = String(options.page);
    if (options.limit) params["limit"] = String(options.limit);

    const res = await api.getProducts(params, { next: { revalidate: 180 } });
    if (res.success && res.data) {
      const rows = res.data as Record<string, unknown>[];
      const listings = rows.map(mapRow);
      return filterAndSortListings(listings, { ...options, categoryId });
    }
  } catch (e) {
    console.warn("[storefront] getProductListings API error:", e);
  }

  return [];
}

export async function getProductListingsByCategorySlug(
  slug: string,
  options: ListingFilterOptions = {},
): Promise<ProductListing[]> {
  const cat = await getCategoryBySlug(slug);
  if (cat) {
    return getProductListings(cat.id, { ...options, categorySlug: slug });
  }
  return [];
}

export interface ProductDetailListing extends ProductListing {
  images: ProductImage[];
}

export async function getProductListingBySlug(
  slug: string,
): Promise<ProductDetailListing | null> {
  try {
    const res = await api.getProductBySlug(slug, { next: { revalidate: 180 } });
    if (res.success && res.data) {
      const row = res.data as Record<string, unknown>;
      return {
        ...mapRow(row),
        images: (row["images"] as ProductImage[]) ?? [],
      };
    }
  } catch (e) {
    console.warn("[storefront] getProductListingBySlug API error:", e);
  }

  return null;
}

export async function searchProductListings(
  query: string,
  options: ListingFilterOptions = {},
): Promise<ProductListing[]> {
  return getProductListings(undefined, { ...options, searchQuery: query });
}

export async function getTrendingListings(
  limit = 10,
): Promise<ProductListing[]> {
  try {
    const res = await api.getTrendingProducts(
      { limit },
      { next: { revalidate: 120 } },
    );
    if (res.success && res.data && res.data.length > 0) {
      return (res.data as Record<string, unknown>[]).map(mapRow);
    }
  } catch (e) {
    console.warn("[storefront] getTrendingListings API error:", e);
  }
  return [];
}

export async function getRelatedListings(
  slug: string,
): Promise<ProductListing[]> {
  try {
    const res = await api.getRelatedProducts(slug, {
      next: { revalidate: 180 },
    });
    if (res.success && res.data && res.data.length > 0) {
      return (res.data as Record<string, unknown>[]).map(mapRow);
    }
  } catch (e) {
    console.warn("[storefront] getRelatedListings API error:", e);
  }
  return [];
}
