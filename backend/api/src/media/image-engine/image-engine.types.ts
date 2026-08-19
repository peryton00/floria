// Floria ImageEngine — Types & Interfaces

export type ImageProfileName =
  | "PRODUCT"
  | "NURSERY"
  | "SELLER_LOGO"
  | "USER_AVATAR"
  | "CATEGORY"
  | "REVIEW_IMAGE";

export type FitBehavior = "FIT" | "COVER" | "CONTAIN";

export interface VariantSpec {
  name: string;
  targetWidth: number;
  targetHeight: number;
  fit: FitBehavior;
  quality: number;
  format: "webp";
}

export interface ProfileSpec {
  profileName: ImageProfileName;
  variants: VariantSpec[];
}

export interface ProcessedVariant {
  variantName: string;
  format: "webp";
  buffer: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
  contentType: "image/webp";
}

export interface InputImageMeta {
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
  hasAlpha: boolean;
  orientation?: number;
}

export interface ImageEngineResult {
  input: InputImageMeta;
  variants: ProcessedVariant[];
}
