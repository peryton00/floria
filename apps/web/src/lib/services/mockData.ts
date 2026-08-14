import type { Category, SellerProfile } from "@floria/types";

export const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Indoor Plants",        slug: "indoor-plants",      description: "Fresh air purifiers for your home",              image_url: null, parent_id: null, display_order: 1, is_active: true, created_at: "", updated_at: "" },
  { id: "cat-2", name: "Outdoor Plants",       slug: "outdoor-plants",     description: "Vibrant garden shrubs and trees",                image_url: null, parent_id: null, display_order: 2, is_active: true, created_at: "", updated_at: "" },
  { id: "cat-3", name: "Succulents & Cacti",   slug: "succulents-cacti",   description: "Low-maintenance desert beauty",                  image_url: null, parent_id: null, display_order: 3, is_active: true, created_at: "", updated_at: "" },
  { id: "cat-4", name: "Flowering Plants",     slug: "flowering-plants",   description: "Colorful seasonal blooms",                      image_url: null, parent_id: null, display_order: 4, is_active: true, created_at: "", updated_at: "" },
  { id: "cat-5", name: "Herbs & Edibles",      slug: "herbs-edibles",      description: "Grow your own fresh kitchen ingredients",        image_url: null, parent_id: null, display_order: 5, is_active: true, created_at: "", updated_at: "" },
  { id: "cat-6", name: "Planters & Pots",      slug: "planters-pots",      description: "Beautiful ceramic and clay housing",             image_url: null, parent_id: null, display_order: 6, is_active: true, created_at: "", updated_at: "" },
  { id: "cat-7", name: "Soil & Fertilizers",   slug: "soil-fertilizers",   description: "Nutrient-rich mixtures for healthy roots",       image_url: null, parent_id: null, display_order: 7, is_active: true, created_at: "", updated_at: "" },
  { id: "cat-8", name: "Tools & Accessories",  slug: "tools-accessories",  description: "Essential tools for gardening maintenance",      image_url: null, parent_id: null, display_order: 8, is_active: true, created_at: "", updated_at: "" },
];

export const MOCK_SELLERS: Record<string, Pick<SellerProfile, "id" | "business_name">> = {
  "sel-1": { id: "sel-1", business_name: "Green Leaf Nursery" },
  "sel-2": { id: "sel-2", business_name: "Nisarga Gardens" },
  "sel-3": { id: "sel-3", business_name: "Clay & Co." },
};
