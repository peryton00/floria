// Floria — System Media URL Resolver Service
const SUPABASE_STORAGE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase.co";

export interface SystemMediaMapping {
  legacyPath: string;
  assetId: string;
  variants: Record<string, string>;
}

// System Media Registry mapping original static filenames to Supabase WebP storage objects
export const SYSTEM_MEDIA_REGISTRY: Record<string, Record<string, string>> = {
  "/cat-plants.png": {
    banner: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/cat-plants/banner.webp`,
  },
  "/cat-seeds.png": {
    banner: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/cat-seeds/banner.webp`,
  },
  "/cat-pots.png": {
    banner: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/cat-pots/banner.webp`,
  },
  "/cat-fertilizers.png": {
    banner: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/cat-fertilizers/banner.webp`,
  },
  "/cat-tools.png": {
    banner: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/cat-tools/banner.webp`,
  },
  "/nursery-1.png": {
    card: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/nursery-1/card.webp`,
    cover: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/nursery-1/cover.webp`,
  },
  "/nursery-2.png": {
    card: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/nursery-2/card.webp`,
    cover: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/nursery-2/cover.webp`,
  },
  "/nursery-3.png": {
    card: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/nursery-3/card.webp`,
    cover: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/nursery-3/cover.webp`,
  },
  "/nursery-4.png": {
    card: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/nursery-4/card.webp`,
    cover: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/nursery-4/cover.webp`,
  },
  "/hero-plants.png": {
    cover: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/hero-plants/cover.webp`,
    card: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/hero-plants/card.webp`,
  },
  "outdoor-plants": {
    banner: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/category-outdoor-plants/banner.webp`,
  },
  "succulents-cacti": {
    banner: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/category-succulents-cacti/banner.webp`,
  },
  "flowering-plants": {
    banner: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/category-flowering-plants/banner.webp`,
  },
  "herbs-edibles": {
    banner: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/category-herbs-edibles/banner.webp`,
  },
  "soil-fertilizers": {
    banner: `${SUPABASE_STORAGE_URL}/storage/v1/object/public/public-media/system/category-soil-fertilizers/banner.webp`,
  },
};

/**
 * Returns the optimized WebP variant URL for a system-seeded asset.
 */
export function getSystemMediaUrl(
  path: string,
  variant: "banner" | "cover" | "card" = "banner"
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const assetVariants = SYSTEM_MEDIA_REGISTRY[normalizedPath];

  if (assetVariants && assetVariants[variant]) {
    return assetVariants[variant];
  }

  if (assetVariants) {
    const firstAvailable = Object.values(assetVariants)[0];
    if (firstAvailable) return firstAvailable;
  }

  return normalizedPath;
}
