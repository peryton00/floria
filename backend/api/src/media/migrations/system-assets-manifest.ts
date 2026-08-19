// Floria Media Infrastructure — System Assets Migration Manifest
import path from "path";
import type { ImageProfileName } from "../image-engine/image-engine.types.js";

export interface SystemAssetDefinition {
  legacyPath: string; // Relative path in apps/web/public/
  originalFilename: string;
  profile: ImageProfileName;
  description: string;
}

export const SYSTEM_ASSETS_MANIFEST: SystemAssetDefinition[] = [
  // Categories (5 assets)
  {
    legacyPath: "cat-plants.png",
    originalFilename: "cat-plants.png",
    profile: "CATEGORY",
    description: "Category Banner: Plants & Indoor Foliage",
  },
  {
    legacyPath: "cat-seeds.png",
    originalFilename: "cat-seeds.png",
    profile: "CATEGORY",
    description: "Category Banner: Seeds & Culinary Herbs",
  },
  {
    legacyPath: "cat-pots.png",
    originalFilename: "cat-pots.png",
    profile: "CATEGORY",
    description: "Category Banner: Pots & Planters",
  },
  {
    legacyPath: "cat-fertilizers.png",
    originalFilename: "cat-fertilizers.png",
    profile: "CATEGORY",
    description: "Category Banner: Fertilizers & Soil",
  },
  {
    legacyPath: "cat-tools.png",
    originalFilename: "cat-tools.png",
    profile: "CATEGORY",
    description: "Category Banner: Gardening Tools",
  },

  // Nurseries (4 assets)
  {
    legacyPath: "nursery-1.png",
    originalFilename: "nursery-1.png",
    profile: "NURSERY",
    description: "Nursery Banner: Green Leaf Nursery Showcase",
  },
  {
    legacyPath: "nursery-2.png",
    originalFilename: "nursery-2.png",
    profile: "NURSERY",
    description: "Nursery Banner: Nisarga Gardens Showcase",
  },
  {
    legacyPath: "nursery-3.png",
    originalFilename: "nursery-3.png",
    profile: "NURSERY",
    description: "Nursery Banner: Clay & Co. Showcase",
  },
  {
    legacyPath: "nursery-4.png",
    originalFilename: "nursery-4.png",
    profile: "NURSERY",
    description: "Nursery Banner: Sai Garden Center Showcase",
  },

  // Hero Image (1 asset)
  {
    legacyPath: "hero-plants.png",
    originalFilename: "hero-plants.png",
    profile: "NURSERY", // Generates cover (1920x1080) and card (640x360) for homepage hero
    description: "Homepage Hero Banner: Botanical Showcase",
  },
];
