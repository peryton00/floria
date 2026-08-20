// Floria ImageEngine — Variant Profile Configurations

import type { ImageProfileName, ProfileSpec } from "./image-engine.types.js";

export const PROFILES: Record<ImageProfileName, ProfileSpec> = {
  PRODUCT: {
    profileName: "PRODUCT",
    variants: [
      {
        name: "thumbnail",
        targetWidth: 250,
        targetHeight: 250,
        fit: "COVER",
        quality: 75,
        format: "webp",
      },
      {
        name: "medium",
        targetWidth: 800,
        targetHeight: 800,
        fit: "FIT",
        quality: 80,
        format: "webp",
      },
      {
        name: "large",
        targetWidth: 1600,
        targetHeight: 1600,
        fit: "FIT",
        quality: 82,
        format: "webp",
      },
    ],
  },
  NURSERY: {
    profileName: "NURSERY",
    variants: [
      {
        name: "card",
        targetWidth: 640,
        targetHeight: 360,
        fit: "COVER",
        quality: 80,
        format: "webp",
      },
      {
        name: "cover",
        targetWidth: 1920,
        targetHeight: 1080,
        fit: "COVER",
        quality: 82,
        format: "webp",
      },
    ],
  },
  SELLER_LOGO: {
    profileName: "SELLER_LOGO",
    variants: [
      {
        name: "standard",
        targetWidth: 400,
        targetHeight: 400,
        fit: "CONTAIN",
        quality: 85,
        format: "webp",
      },
    ],
  },
  USER_AVATAR: {
    profileName: "USER_AVATAR",
    variants: [
      {
        name: "avatar",
        targetWidth: 200,
        targetHeight: 200,
        fit: "COVER",
        quality: 80,
        format: "webp",
      },
    ],
  },
  CATEGORY: {
    profileName: "CATEGORY",
    variants: [
      {
        name: "banner",
        targetWidth: 1200,
        targetHeight: 400,
        fit: "COVER",
        quality: 82,
        format: "webp",
      },
    ],
  },
  REVIEW_IMAGE: {
    profileName: "REVIEW_IMAGE",
    variants: [
      {
        name: "display",
        targetWidth: 1000,
        targetHeight: 1000,
        fit: "FIT",
        quality: 78,
        format: "webp",
      },
    ],
  },
  DOCUMENT: {
    profileName: "DOCUMENT",
    variants: [],
  },
};
