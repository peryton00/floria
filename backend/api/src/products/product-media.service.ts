// Floria API — Product Media Integration Service
import crypto from "crypto";
import { getAdminDb } from "../config/database.js";
import { Errors } from "../utils/errors.js";
import { productRepository } from "../database/repositories/product.repository.js";

export interface AttachProductImageInput {
  assetId: string;
  altText?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

export interface ImageOrderInput {
  imageId: string;
  displayOrder: number;
}

export class ProductMediaService {
  /**
   * Attaches a READY media_assets record to a product with 10-step server-side security checks.
   */
  public static async attachMediaAssetToProduct(
    sellerId: string,
    productId: string,
    input: AttachProductImageInput,
  ) {
    const db = getAdminDb();

    // 1 & 2. Verify product existence & seller ownership
    const { data: product, error: prodErr } = await db
      .from("products")
      .select("id, name, seller_id")
      .eq("id", productId)
      .maybeSingle();

    if (prodErr || !product) {
      throw Errors.notFound("Product");
    }

    if (product.seller_id !== sellerId) {
      throw Errors.forbidden("You do not own this product.");
    }

    // 3. Query media_asset
    const { data: asset, error: assetErr } = await db
      .from("media_assets")
      .select("id, seller_id, status, media_category, storage_bucket")
      .eq("id", input.assetId)
      .maybeSingle();

    if (assetErr || !asset) {
      throw Errors.notFound("Media asset");
    }

    // 4. Verify seller ownership of asset (Cross-seller protection)
    if (asset.seller_id !== sellerId) {
      throw Errors.forbidden(
        "Cross-seller media asset attachment is prohibited.",
      );
    }

    // 5. Verify asset status = READY
    if (asset.status !== "READY") {
      throw Errors.validation(
        "Media asset is not READY for product attachment.",
      );
    }

    // 6 & 7. Verify media_category = IMAGE and storage_bucket = public-media
    if (asset.media_category !== "IMAGE") {
      throw Errors.validation("Only image assets can be attached to products.");
    }

    if (asset.storage_bucket !== "public-media") {
      throw Errors.validation(
        "Only public-media assets can be attached to products.",
      );
    }

    // 8 & 9. Verify asset is not retired/deleted/document
    if (asset.status === "RETIRED" || asset.status === "DELETED") {
      throw Errors.validation("Cannot attach retired or deleted media asset.");
    }

    // 10. Compute display_order & is_primary
    const { data: existingImages } = await db
      .from("product_images")
      .select("id, display_order, is_primary")
      .eq("product_id", productId)
      .order("display_order", { ascending: true });

    const currentCount = existingImages ? existingImages.length : 0;
    const nextDisplayOrder = input.displayOrder ?? currentCount + 1;
    const setAsPrimary = input.isPrimary || currentCount === 0;

    // Build WebP medium variant URL for legacy url column compatibility
    const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.co";
    const legacyUrl = `${supabaseUrl}/storage/v1/object/public/public-media/products/${sellerId}/${asset.id}/medium.webp`;

    // If setAsPrimary is true, unset existing primary flag
    if (setAsPrimary && currentCount > 0) {
      await db
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId);
    }

    // Insert product_images association
    const imageId = crypto.randomUUID();
    const { data: newImage, error: insertErr } = await db
      .from("product_images")
      .insert({
        id: imageId,
        product_id: productId,
        asset_id: asset.id,
        url: legacyUrl,
        alt_text: input.altText?.trim() || product.name,
        display_order: nextDisplayOrder,
        is_primary: setAsPrimary,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (insertErr || !newImage) {
      throw Errors.database(
        `Failed to attach image to product: ${insertErr?.message}`,
      );
    }

    // Return enriched product
    return productRepository.findById(productId);
  }

  /**
   * Removes a product image association.
   * NOTE: Does NOT delete media_assets or media_variants per domain rules.
   */
  public static async removeProductImage(
    sellerId: string,
    productId: string,
    imageId: string,
  ) {
    const db = getAdminDb();

    // Verify product ownership
    const { data: product } = await db
      .from("products")
      .select("id, seller_id")
      .eq("id", productId)
      .maybeSingle();

    if (!product || product.seller_id !== sellerId) {
      throw Errors.forbidden("You do not own this product.");
    }

    // Fetch target image
    const { data: targetImage } = await db
      .from("product_images")
      .select("*")
      .eq("id", imageId)
      .eq("product_id", productId)
      .maybeSingle();

    if (!targetImage) {
      throw Errors.notFound("Product image");
    }

    // Delete association
    const { error: delErr } = await db
      .from("product_images")
      .delete()
      .eq("id", imageId);

    if (delErr) {
      throw Errors.database(
        `Failed to remove product image: ${delErr.message}`,
      );
    }

    // If removed image was primary, set the next image (by display_order) as primary
    if (targetImage.is_primary) {
      const { data: remaining } = await db
        .from("product_images")
        .select("id")
        .eq("product_id", productId)
        .order("display_order", { ascending: true })
        .limit(1);

      if (remaining && remaining.length > 0) {
        await db
          .from("product_images")
          .update({ is_primary: true })
          .eq("id", remaining[0].id);
      }
    }

    return productRepository.findById(productId);
  }

  /**
   * Reorders product images based on client displayOrder array.
   */
  public static async reorderProductImages(
    sellerId: string,
    productId: string,
    imageOrders: ImageOrderInput[],
  ) {
    if (!Array.isArray(imageOrders) || imageOrders.length === 0) {
      throw Errors.validation("imageOrders must be a non-empty array.");
    }

    const db = getAdminDb();

    // Verify product ownership
    const { data: product } = await db
      .from("products")
      .select("id, seller_id")
      .eq("id", productId)
      .maybeSingle();

    if (!product || product.seller_id !== sellerId) {
      throw Errors.forbidden("You do not own this product.");
    }

    for (const item of imageOrders) {
      if (item.imageId && typeof item.displayOrder === "number") {
        await db
          .from("product_images")
          .update({ display_order: item.displayOrder })
          .eq("id", item.imageId)
          .eq("product_id", productId);
      }
    }

    return productRepository.findById(productId);
  }

  /**
   * Sets a specific image as the primary image for a product.
   */
  public static async setPrimaryProductImage(
    sellerId: string,
    productId: string,
    imageId: string,
  ) {
    const db = getAdminDb();

    // Verify product ownership
    const { data: product } = await db
      .from("products")
      .select("id, seller_id")
      .eq("id", productId)
      .maybeSingle();

    if (!product || product.seller_id !== sellerId) {
      throw Errors.forbidden("You do not own this product.");
    }

    // Verify image belongs to product
    const { data: img } = await db
      .from("product_images")
      .select("id")
      .eq("id", imageId)
      .eq("product_id", productId)
      .maybeSingle();

    if (!img) {
      throw Errors.notFound("Product image");
    }

    // Unset primary for all images of this product
    await db
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", productId);

    // Set primary for target image
    await db
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", imageId);

    return productRepository.findById(productId);
  }

  /**
   * Replaces an existing product image with a new READY media asset.
   */
  public static async replaceProductImage(
    sellerId: string,
    productId: string,
    imageId: string,
    newAssetId: string,
    options?: { altText?: string },
  ) {
    const db = getAdminDb();

    // Verify product & image
    const { data: product } = await db
      .from("products")
      .select("id, name, seller_id")
      .eq("id", productId)
      .maybeSingle();

    if (!product || product.seller_id !== sellerId) {
      throw Errors.forbidden("You do not own this product.");
    }

    const { data: existingImg } = await db
      .from("product_images")
      .select("*")
      .eq("id", imageId)
      .eq("product_id", productId)
      .maybeSingle();

    if (!existingImg) {
      throw Errors.notFound("Product image");
    }

    // Verify new asset
    const { data: asset } = await db
      .from("media_assets")
      .select("id, seller_id, status, media_category, storage_bucket")
      .eq("id", newAssetId)
      .maybeSingle();

    if (!asset || asset.seller_id !== sellerId) {
      throw Errors.forbidden(
        "Cross-seller media asset attachment is prohibited.",
      );
    }

    if (
      asset.status !== "READY" ||
      asset.media_category !== "IMAGE" ||
      asset.storage_bucket !== "public-media"
    ) {
      throw Errors.validation(
        "Target media asset is not a valid READY public image.",
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.co";
    const legacyUrl = `${supabaseUrl}/storage/v1/object/public/public-media/products/${sellerId}/${asset.id}/medium.webp`;

    await db
      .from("product_images")
      .update({
        asset_id: asset.id,
        url: legacyUrl,
        alt_text:
          options?.altText?.trim() || existingImg.alt_text || product.name,
      })
      .eq("id", imageId);

    return productRepository.findById(productId);
  }
}
