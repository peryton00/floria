// Floria ImageEngine — Node.js + TypeScript + Sharp Core Processing Engine

import sharp from "sharp";
import { PROFILES } from "./profiles.js";
import type {
  ImageEngineResult,
  ImageProfileName,
  InputImageMeta,
  ProcessedVariant,
  VariantSpec,
} from "./image-engine.types.js";
import {
  CorruptImageError,
  EmptyInputError,
  ExcessiveDimensionsError,
  FileTooLargeError,
  PixelLimitExceededError,
  ProcessingFailureError,
  UnsupportedFormatError,
} from "./image-engine.errors.js";

export const MAX_INPUT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_DIMENSION_PX = 16384;
export const MAX_INPUT_PIXELS = 268435456; // 16384 x 16384

export const SUPPORTED_INPUT_FORMATS = new Set([
  "jpeg",
  "jpg",
  "png",
  "webp",
  "heic",
  "heif",
]);

export class ImageEngine {
  /**
   * Evaluates runtime HEIC/HEIF decoding support in installed Sharp / libvips binary.
   */
  public static isHeicSupported(): boolean {
    const formats = sharp.format;
    return Boolean(
      formats.heif && formats.heif.input && formats.heif.input.buffer,
    );
  }

  /**
   * Core entry point: Accepts input file buffer and target profile, validates binary,
   * normalizes orientation & color space, strips EXIF metadata, and generates WebP variants.
   */
  public static async process(
    inputBuffer: Buffer,
    profileName: ImageProfileName,
  ): Promise<ImageEngineResult> {
    // 1. Validate Input Buffer presence & Size Limit
    if (!inputBuffer || inputBuffer.length === 0) {
      throw new EmptyInputError();
    }

    if (inputBuffer.length > MAX_INPUT_FILE_SIZE_BYTES) {
      throw new FileTooLargeError();
    }

    const profile = PROFILES[profileName];
    if (!profile) {
      throw new Error(`Unknown image profile: '${profileName}'`);
    }

    // 2. Decode & Inspect Metadata safely
    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(inputBuffer, {
        limitInputPixels: MAX_INPUT_PIXELS,
      }).metadata();
    } catch (err: any) {
      throw new CorruptImageError(
        err?.message || "Failed to parse image headers",
      );
    }

    const format = (metadata.format || "").toLowerCase();
    if (!format || !SUPPORTED_INPUT_FORMATS.has(format)) {
      throw new UnsupportedFormatError(format || "unknown");
    }

    // Explicit HEIC runtime check
    if (
      (format === "heic" || format === "heif") &&
      !ImageEngine.isHeicSupported()
    ) {
      throw new UnsupportedFormatError(
        "heic/heif (libvips HEIC decoder is not compiled into the current Sharp runtime)",
      );
    }

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width <= 0 || height <= 0) {
      throw new CorruptImageError(
        "Invalid image dimensions (width or height <= 0)",
      );
    }

    if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
      throw new ExcessiveDimensionsError(width, height);
    }

    const totalPixels = width * height;
    if (totalPixels > MAX_INPUT_PIXELS) {
      throw new PixelLimitExceededError(totalPixels);
    }

    const inputMeta: InputImageMeta = {
      width,
      height,
      format,
      sizeBytes: inputBuffer.length,
      hasAlpha: Boolean(metadata.hasAlpha),
      orientation: metadata.orientation,
    };

    // 3. Process Each Variant for Profile
    const variants: ProcessedVariant[] = [];

    for (const variantSpec of profile.variants) {
      try {
        const variant = await ImageEngine.processVariant(
          inputBuffer,
          variantSpec,
        );
        variants.push(variant);
      } catch (err: any) {
        throw new ProcessingFailureError(variantSpec.name, err);
      }
    }

    return {
      input: inputMeta,
      variants,
    };
  }

  /**
   * Transforms input buffer into a specific WebP variant based on VariantSpec.
   */
  private static async processVariant(
    inputBuffer: Buffer,
    spec: VariantSpec,
  ): Promise<ProcessedVariant> {
    // Pipeline: Initialize Sharp with pixel bomb guard
    let pipeline = sharp(inputBuffer, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate() // Physical EXIF orientation normalization & stripping
      .toColorspace("srgb"); // Normalize color space to sRGB

    // Resize logic with withoutEnlargement to prevent unwanted upscaling
    if (spec.fit === "COVER") {
      pipeline = pipeline.resize(spec.targetWidth, spec.targetHeight, {
        fit: "cover",
        position: "center",
        withoutEnlargement: true,
      });
    } else if (spec.fit === "FIT") {
      pipeline = pipeline.resize(spec.targetWidth, spec.targetHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    } else if (spec.fit === "CONTAIN") {
      pipeline = pipeline.resize(spec.targetWidth, spec.targetHeight, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background padding
        withoutEnlargement: true,
      });
    }

    // Encode to WebP with specified quality & transparency preservation
    const outputBuffer = await pipeline
      .webp({
        quality: spec.quality,
        effort: 4,
        alphaQuality: 80,
      })
      .toBuffer();

    // Inspect processed output metadata
    const outMeta = await sharp(outputBuffer).metadata();

    return {
      variantName: spec.name,
      format: "webp",
      buffer: outputBuffer,
      width: outMeta.width || 0,
      height: outMeta.height || 0,
      sizeBytes: outputBuffer.length,
      contentType: "image/webp",
    };
  }
}
