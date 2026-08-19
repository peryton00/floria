// Floria ImageEngine Unit Test Suite (Stage 3 Corrections)
import { describe, it, expect, beforeAll } from "vitest";
import sharp from "sharp";
import { ImageEngine } from "../src/media/image-engine/image-engine.js";
import {
  CorruptImageError,
  EmptyInputError,
  ExcessiveDimensionsError,
  FileTooLargeError,
  PixelLimitExceededError,
  UnsupportedFormatError,
} from "../src/media/image-engine/image-engine.errors.js";

describe("ImageEngine — Core Security & Input Format Safeguards", () => {
  it("rejects empty buffer with EmptyInputError", async () => {
    await expect(ImageEngine.process(Buffer.alloc(0), "PRODUCT")).rejects.toThrow(
      EmptyInputError
    );
  });

  it("rejects buffer > 10 MB with FileTooLargeError", async () => {
    const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024 + 1);
    await expect(ImageEngine.process(oversizedBuffer, "PRODUCT")).rejects.toThrow(
      FileTooLargeError
    );
  });

  it("rejects corrupt/garbage binary buffer with CorruptImageError", async () => {
    const garbageBuffer = Buffer.from("NOT_AN_IMAGE_FILE_HEADER_BINARY_DATA");
    await expect(ImageEngine.process(garbageBuffer, "PRODUCT")).rejects.toThrow(
      CorruptImageError
    );
  });

  it("explicitly rejects GIF format with UnsupportedFormatError", async () => {
    const gifBuffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .gif()
      .toBuffer();

    await expect(ImageEngine.process(gifBuffer, "PRODUCT")).rejects.toThrow(
      UnsupportedFormatError
    );
  });

  it("explicitly rejects SVG format with UnsupportedFormatError", async () => {
    const svgBuffer = Buffer.from(
      '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="blue"/></svg>'
    );

    await expect(ImageEngine.process(svgBuffer, "PRODUCT")).rejects.toThrow(
      UnsupportedFormatError
    );
  });

  it("gracefully reports HEIC runtime support status", () => {
    const isSupported = ImageEngine.isHeicSupported();
    expect(typeof isSupported).toBe("boolean");
  });

  it("rejects HEIC if Sharp libvips runtime does not support it", async () => {
    if (!ImageEngine.isHeicSupported()) {
      const fakeHeic = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
      await expect(ImageEngine.process(fakeHeic, "PRODUCT")).rejects.toThrow();
    }
  });
});

describe("ImageEngine — Decoded Pixel & Excessive Dimension Security Tests", () => {
  it("rejects image with width > 16,384 with ExcessiveDimensionsError", async () => {
    // Small byte size input (<100KB) but metadata width > 16,384
    const excessiveWidthBuffer = await sharp({
      create: { width: 16385, height: 100, channels: 3, background: { r: 0, g: 255, b: 0 } },
    })
      .jpeg({ quality: 10 })
      .toBuffer();

    expect(excessiveWidthBuffer.length).toBeLessThan(10 * 1024 * 1024); // File size is small (<10MB)
    await expect(ImageEngine.process(excessiveWidthBuffer, "PRODUCT")).rejects.toThrow(
      ExcessiveDimensionsError
    );
  });

  it("rejects image with height > 16,384 with ExcessiveDimensionsError", async () => {
    const excessiveHeightBuffer = await sharp({
      create: { width: 100, height: 16385, channels: 3, background: { r: 0, g: 255, b: 0 } },
    })
      .jpeg({ quality: 10 })
      .toBuffer();

    expect(excessiveHeightBuffer.length).toBeLessThan(10 * 1024 * 1024);
    await expect(ImageEngine.process(excessiveHeightBuffer, "PRODUCT")).rejects.toThrow(
      ExcessiveDimensionsError
    );
  });

  it("accepts valid high-resolution image within dimension limits (1920x1080)", async () => {
    const validLargeBuffer = await sharp({
      create: { width: 1920, height: 1080, channels: 3, background: { r: 120, g: 120, b: 120 } },
    })
      .jpeg()
      .toBuffer();

    const res = await ImageEngine.process(validLargeBuffer, "PRODUCT");
    expect(res.input.width).toBe(1920);
    expect(res.input.height).toBe(1080);
  });
});

describe("ImageEngine — Exhaustive Test Matrix for All 9 Approved Profiles", () => {
  let sourceJpegBuffer: Buffer;
  let sourcePngTransparentBuffer: Buffer;
  let sourceWebpBuffer: Buffer;

  beforeAll(async () => {
    sourceJpegBuffer = await sharp({
      create: { width: 2000, height: 1500, channels: 3, background: { r: 40, g: 140, b: 40 } },
    })
      .jpeg({ quality: 100 })
      .toBuffer();

    sourcePngTransparentBuffer = await sharp({
      create: { width: 500, height: 500, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0.8 } },
    })
      .png()
      .toBuffer();

    sourceWebpBuffer = await sharp({
      create: { width: 800, height: 600, channels: 3, background: { r: 80, g: 80, b: 200 } },
    })
      .webp()
      .toBuffer();
  });

  // PRODUCT (3 variants)
  it("1. PRODUCT: thumbnail (250x250, COVER, quality 75, WebP)", async () => {
    const res = await ImageEngine.process(sourceJpegBuffer, "PRODUCT");
    const v = res.variants.find((item) => item.variantName === "thumbnail")!;
    expect(v.format).toBe("webp");
    expect(v.contentType).toBe("image/webp");
    expect(v.width).toBe(250);
    expect(v.height).toBe(250);
    expect(v.sizeBytes).toBeGreaterThan(0);
  });

  it("2. PRODUCT: medium (800x800 max, FIT, quality 80, WebP)", async () => {
    const res = await ImageEngine.process(sourceJpegBuffer, "PRODUCT");
    const v = res.variants.find((item) => item.variantName === "medium")!;
    expect(v.format).toBe("webp");
    expect(v.contentType).toBe("image/webp");
    expect(v.width).toBe(800);
    expect(v.height).toBe(600); // 4:3 preserved aspect ratio
    expect(v.sizeBytes).toBeGreaterThan(0);
  });

  it("3. PRODUCT: large (1600x1600 max, FIT, quality 82, WebP)", async () => {
    const res = await ImageEngine.process(sourceJpegBuffer, "PRODUCT");
    const v = res.variants.find((item) => item.variantName === "large")!;
    expect(v.format).toBe("webp");
    expect(v.contentType).toBe("image/webp");
    expect(v.width).toBe(1600);
    expect(v.height).toBe(1200); // 4:3 preserved aspect ratio
    expect(v.sizeBytes).toBeGreaterThan(0);
  });

  // NURSERY (2 variants)
  it("4. NURSERY: card (640x360, COVER 16:9, quality 80, WebP)", async () => {
    const res = await ImageEngine.process(sourceJpegBuffer, "NURSERY");
    const v = res.variants.find((item) => item.variantName === "card")!;
    expect(v.format).toBe("webp");
    expect(v.contentType).toBe("image/webp");
    expect(v.width).toBe(640);
    expect(v.height).toBe(360);
    expect(v.sizeBytes).toBeGreaterThan(0);
  });

  it("5. NURSERY: cover (1920x1080, COVER 16:9, quality 82, WebP)", async () => {
    const res = await ImageEngine.process(sourceJpegBuffer, "NURSERY");
    const v = res.variants.find((item) => item.variantName === "cover")!;
    expect(v.format).toBe("webp");
    expect(v.contentType).toBe("image/webp");
    expect(v.width).toBe(1920);
    expect(v.height).toBe(1080);
    expect(v.sizeBytes).toBeGreaterThan(0);
  });

  // SELLER_LOGO (1 variant)
  it("6. SELLER_LOGO: standard (400x400, CONTAIN 1:1, quality 85, WebP)", async () => {
    const res = await ImageEngine.process(sourcePngTransparentBuffer, "SELLER_LOGO");
    const v = res.variants.find((item) => item.variantName === "standard")!;
    expect(v.format).toBe("webp");
    expect(v.contentType).toBe("image/webp");
    expect(v.width).toBe(400);
    expect(v.height).toBe(400);
    expect(v.sizeBytes).toBeGreaterThan(0);

    const meta = await sharp(v.buffer).metadata();
    expect(meta.hasAlpha).toBe(true);
  });

  // USER_AVATAR (1 variant)
  it("7. USER_AVATAR: avatar (200x200, COVER 1:1, quality 80, WebP)", async () => {
    const res = await ImageEngine.process(sourceWebpBuffer, "USER_AVATAR");
    const v = res.variants.find((item) => item.variantName === "avatar")!;
    expect(v.format).toBe("webp");
    expect(v.contentType).toBe("image/webp");
    expect(v.width).toBe(200);
    expect(v.height).toBe(200);
    expect(v.sizeBytes).toBeGreaterThan(0);
  });

  // CATEGORY (1 variant)
  it("8. CATEGORY: banner (1200x400, COVER 3:1, quality 82, WebP)", async () => {
    const res = await ImageEngine.process(sourceJpegBuffer, "CATEGORY");
    const v = res.variants.find((item) => item.variantName === "banner")!;
    expect(v.format).toBe("webp");
    expect(v.contentType).toBe("image/webp");
    expect(v.width).toBe(1200);
    expect(v.height).toBe(400);
    expect(v.sizeBytes).toBeGreaterThan(0);
  });

  // REVIEW_IMAGE (1 variant)
  it("9. REVIEW_IMAGE: display (1000x1000 max, FIT, quality 78, WebP)", async () => {
    const res = await ImageEngine.process(sourceJpegBuffer, "REVIEW_IMAGE");
    const v = res.variants.find((item) => item.variantName === "display")!;
    expect(v.format).toBe("webp");
    expect(v.contentType).toBe("image/webp");
    expect(v.width).toBe(1000);
    expect(v.height).toBe(750); // 4:3 aspect ratio preserved
    expect(v.sizeBytes).toBeGreaterThan(0);
  });
});

describe("ImageEngine — Compression Optimization & Worker Metadata Exposure", () => {
  it("compresses raw high-quality input image (input.sizeBytes > output.sizeBytes)", async () => {
    const rawUncompressedJpeg = await sharp({
      create: { width: 1600, height: 1200, channels: 3, background: { r: 200, g: 50, b: 50 } },
    })
      .jpeg({ quality: 100 })
      .toBuffer();

    const res = await ImageEngine.process(rawUncompressedJpeg, "PRODUCT");
    const medium = res.variants.find((v) => v.variantName === "medium")!;

    expect(res.input.sizeBytes).toBeGreaterThan(medium.sizeBytes);
  });

  it("exposes all metadata fields required for background worker compression logs", async () => {
    const rawImage = await sharp({
      create: { width: 800, height: 600, channels: 3, background: { r: 100, g: 100, b: 100 } },
    })
      .jpeg()
      .toBuffer();

    const res = await ImageEngine.process(rawImage, "PRODUCT");

    // Input metadata fields
    expect(res.input).toHaveProperty("width");
    expect(res.input).toHaveProperty("height");
    expect(res.input).toHaveProperty("format");
    expect(res.input).toHaveProperty("sizeBytes");
    expect(res.input).toHaveProperty("hasAlpha");

    // Variant metadata fields
    for (const variant of res.variants) {
      expect(variant).toHaveProperty("variantName");
      expect(variant).toHaveProperty("format");
      expect(variant).toHaveProperty("buffer");
      expect(variant).toHaveProperty("width");
      expect(variant).toHaveProperty("height");
      expect(variant).toHaveProperty("sizeBytes");
      expect(variant).toHaveProperty("contentType");
      expect(Buffer.isBuffer(variant.buffer)).toBe(true);
    }
  });
});
