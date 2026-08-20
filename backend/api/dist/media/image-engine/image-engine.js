"use strict";
// Floria ImageEngine — Node.js + TypeScript + Sharp Core Processing Engine
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageEngine = exports.SUPPORTED_INPUT_FORMATS = exports.MAX_INPUT_PIXELS = exports.MAX_DIMENSION_PX = exports.MAX_INPUT_FILE_SIZE_BYTES = void 0;
const sharp_1 = __importDefault(require("sharp"));
const profiles_js_1 = require("./profiles.js");
const image_engine_errors_js_1 = require("./image-engine.errors.js");
exports.MAX_INPUT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
exports.MAX_DIMENSION_PX = 16384;
exports.MAX_INPUT_PIXELS = 268435456; // 16384 x 16384
exports.SUPPORTED_INPUT_FORMATS = new Set([
    "jpeg",
    "jpg",
    "png",
    "webp",
    "heic",
    "heif",
]);
class ImageEngine {
    /**
     * Evaluates runtime HEIC/HEIF decoding support in installed Sharp / libvips binary.
     */
    static isHeicSupported() {
        const formats = sharp_1.default.format;
        return Boolean(formats.heif && formats.heif.input && formats.heif.input.buffer);
    }
    /**
     * Core entry point: Accepts input file buffer and target profile, validates binary,
     * normalizes orientation & color space, strips EXIF metadata, and generates WebP variants.
     */
    static async process(inputBuffer, profileName) {
        // 1. Validate Input Buffer presence & Size Limit
        if (!inputBuffer || inputBuffer.length === 0) {
            throw new image_engine_errors_js_1.EmptyInputError();
        }
        if (inputBuffer.length > exports.MAX_INPUT_FILE_SIZE_BYTES) {
            throw new image_engine_errors_js_1.FileTooLargeError();
        }
        const profile = profiles_js_1.PROFILES[profileName];
        if (!profile) {
            throw new Error(`Unknown image profile: '${profileName}'`);
        }
        // 2. Decode & Inspect Metadata safely
        let metadata;
        try {
            metadata = await (0, sharp_1.default)(inputBuffer, { limitInputPixels: exports.MAX_INPUT_PIXELS }).metadata();
        }
        catch (err) {
            throw new image_engine_errors_js_1.CorruptImageError(err?.message || "Failed to parse image headers");
        }
        const format = (metadata.format || "").toLowerCase();
        if (!format || !exports.SUPPORTED_INPUT_FORMATS.has(format)) {
            throw new image_engine_errors_js_1.UnsupportedFormatError(format || "unknown");
        }
        // Explicit HEIC runtime check
        if ((format === "heic" || format === "heif") && !ImageEngine.isHeicSupported()) {
            throw new image_engine_errors_js_1.UnsupportedFormatError("heic/heif (libvips HEIC decoder is not compiled into the current Sharp runtime)");
        }
        const width = metadata.width || 0;
        const height = metadata.height || 0;
        if (width <= 0 || height <= 0) {
            throw new image_engine_errors_js_1.CorruptImageError("Invalid image dimensions (width or height <= 0)");
        }
        if (width > exports.MAX_DIMENSION_PX || height > exports.MAX_DIMENSION_PX) {
            throw new image_engine_errors_js_1.ExcessiveDimensionsError(width, height);
        }
        const totalPixels = width * height;
        if (totalPixels > exports.MAX_INPUT_PIXELS) {
            throw new image_engine_errors_js_1.PixelLimitExceededError(totalPixels);
        }
        const inputMeta = {
            width,
            height,
            format,
            sizeBytes: inputBuffer.length,
            hasAlpha: Boolean(metadata.hasAlpha),
            orientation: metadata.orientation,
        };
        // 3. Process Each Variant for Profile
        const variants = [];
        for (const variantSpec of profile.variants) {
            try {
                const variant = await ImageEngine.processVariant(inputBuffer, variantSpec);
                variants.push(variant);
            }
            catch (err) {
                throw new image_engine_errors_js_1.ProcessingFailureError(variantSpec.name, err);
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
    static async processVariant(inputBuffer, spec) {
        // Pipeline: Initialize Sharp with pixel bomb guard
        let pipeline = (0, sharp_1.default)(inputBuffer, { limitInputPixels: exports.MAX_INPUT_PIXELS })
            .rotate() // Physical EXIF orientation normalization & stripping
            .toColorspace("srgb"); // Normalize color space to sRGB
        // Resize logic with withoutEnlargement to prevent unwanted upscaling
        if (spec.fit === "COVER") {
            pipeline = pipeline.resize(spec.targetWidth, spec.targetHeight, {
                fit: "cover",
                position: "center",
                withoutEnlargement: true,
            });
        }
        else if (spec.fit === "FIT") {
            pipeline = pipeline.resize(spec.targetWidth, spec.targetHeight, {
                fit: "inside",
                withoutEnlargement: true,
            });
        }
        else if (spec.fit === "CONTAIN") {
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
        const outMeta = await (0, sharp_1.default)(outputBuffer).metadata();
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
exports.ImageEngine = ImageEngine;
