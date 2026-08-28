"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductMediaService = void 0;
// Floria API — Product Media Integration Service
const crypto_1 = __importDefault(require("crypto"));
const database_js_1 = require("../config/database.js");
const errors_js_1 = require("../utils/errors.js");
const product_repository_js_1 = require("../database/repositories/product.repository.js");
class ProductMediaService {
    /**
     * Attaches a READY media_assets record to a product with 10-step server-side security checks.
     */
    static async attachMediaAssetToProduct(sellerId, productId, input) {
        const db = (0, database_js_1.getAdminDb)();
        // 1 & 2. Verify product existence & seller ownership
        const { data: product, error: prodErr } = await db
            .from("products")
            .select("id, name, seller_id")
            .eq("id", productId)
            .maybeSingle();
        if (prodErr || !product) {
            throw errors_js_1.Errors.notFound("Product");
        }
        if (product.seller_id !== sellerId) {
            throw errors_js_1.Errors.forbidden("You do not own this product.");
        }
        // 3. Query media_asset
        const { data: asset, error: assetErr } = await db
            .from("media_assets")
            .select("id, seller_id, status, media_category, storage_bucket")
            .eq("id", input.assetId)
            .maybeSingle();
        if (assetErr || !asset) {
            throw errors_js_1.Errors.notFound("Media asset");
        }
        // 4. Verify seller ownership of asset (Cross-seller protection)
        if (asset.seller_id !== sellerId) {
            throw errors_js_1.Errors.forbidden("Cross-seller media asset attachment is prohibited.");
        }
        // 5. Verify asset status = READY
        if (asset.status !== "READY") {
            throw errors_js_1.Errors.validation("Media asset is not READY for product attachment.");
        }
        // 6 & 7. Verify media_category = IMAGE and storage_bucket = public-media
        if (asset.media_category !== "IMAGE") {
            throw errors_js_1.Errors.validation("Only image assets can be attached to products.");
        }
        if (asset.storage_bucket !== "public-media") {
            throw errors_js_1.Errors.validation("Only public-media assets can be attached to products.");
        }
        // 8 & 9. Verify asset is not retired/deleted/document
        if (asset.status === "RETIRED" || asset.status === "DELETED") {
            throw errors_js_1.Errors.validation("Cannot attach retired or deleted media asset.");
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
        const imageId = crypto_1.default.randomUUID();
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
            throw errors_js_1.Errors.database(`Failed to attach image to product: ${insertErr?.message}`);
        }
        // Return enriched product
        return product_repository_js_1.productRepository.findById(productId);
    }
    /**
     * Removes a product image association.
     * NOTE: Does NOT delete media_assets or media_variants per domain rules.
     */
    static async removeProductImage(sellerId, productId, imageId) {
        const db = (0, database_js_1.getAdminDb)();
        // Verify product ownership
        const { data: product } = await db
            .from("products")
            .select("id, seller_id")
            .eq("id", productId)
            .maybeSingle();
        if (!product || product.seller_id !== sellerId) {
            throw errors_js_1.Errors.forbidden("You do not own this product.");
        }
        // Fetch target image
        const { data: targetImage } = await db
            .from("product_images")
            .select("*")
            .eq("id", imageId)
            .eq("product_id", productId)
            .maybeSingle();
        if (!targetImage) {
            throw errors_js_1.Errors.notFound("Product image");
        }
        // Delete association
        const { error: delErr } = await db
            .from("product_images")
            .delete()
            .eq("id", imageId);
        if (delErr) {
            throw errors_js_1.Errors.database(`Failed to remove product image: ${delErr.message}`);
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
        return product_repository_js_1.productRepository.findById(productId);
    }
    /**
     * Reorders product images based on client displayOrder array.
     */
    static async reorderProductImages(sellerId, productId, imageOrders) {
        if (!Array.isArray(imageOrders) || imageOrders.length === 0) {
            throw errors_js_1.Errors.validation("imageOrders must be a non-empty array.");
        }
        const db = (0, database_js_1.getAdminDb)();
        // Verify product ownership
        const { data: product } = await db
            .from("products")
            .select("id, seller_id")
            .eq("id", productId)
            .maybeSingle();
        if (!product || product.seller_id !== sellerId) {
            throw errors_js_1.Errors.forbidden("You do not own this product.");
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
        return product_repository_js_1.productRepository.findById(productId);
    }
    /**
     * Sets a specific image as the primary image for a product.
     */
    static async setPrimaryProductImage(sellerId, productId, imageId) {
        const db = (0, database_js_1.getAdminDb)();
        // Verify product ownership
        const { data: product } = await db
            .from("products")
            .select("id, seller_id")
            .eq("id", productId)
            .maybeSingle();
        if (!product || product.seller_id !== sellerId) {
            throw errors_js_1.Errors.forbidden("You do not own this product.");
        }
        // Verify image belongs to product
        const { data: img } = await db
            .from("product_images")
            .select("id")
            .eq("id", imageId)
            .eq("product_id", productId)
            .maybeSingle();
        if (!img) {
            throw errors_js_1.Errors.notFound("Product image");
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
        return product_repository_js_1.productRepository.findById(productId);
    }
    /**
     * Replaces an existing product image with a new READY media asset.
     */
    static async replaceProductImage(sellerId, productId, imageId, newAssetId, options) {
        const db = (0, database_js_1.getAdminDb)();
        // Verify product & image
        const { data: product } = await db
            .from("products")
            .select("id, name, seller_id")
            .eq("id", productId)
            .maybeSingle();
        if (!product || product.seller_id !== sellerId) {
            throw errors_js_1.Errors.forbidden("You do not own this product.");
        }
        const { data: existingImg } = await db
            .from("product_images")
            .select("*")
            .eq("id", imageId)
            .eq("product_id", productId)
            .maybeSingle();
        if (!existingImg) {
            throw errors_js_1.Errors.notFound("Product image");
        }
        // Verify new asset
        const { data: asset } = await db
            .from("media_assets")
            .select("id, seller_id, status, media_category, storage_bucket")
            .eq("id", newAssetId)
            .maybeSingle();
        if (!asset || asset.seller_id !== sellerId) {
            throw errors_js_1.Errors.forbidden("Cross-seller media asset attachment is prohibited.");
        }
        if (asset.status !== "READY" ||
            asset.media_category !== "IMAGE" ||
            asset.storage_bucket !== "public-media") {
            throw errors_js_1.Errors.validation("Target media asset is not a valid READY public image.");
        }
        const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.co";
        const legacyUrl = `${supabaseUrl}/storage/v1/object/public/public-media/products/${sellerId}/${asset.id}/medium.webp`;
        await db
            .from("product_images")
            .update({
            asset_id: asset.id,
            url: legacyUrl,
            alt_text: options?.altText?.trim() || existingImg.alt_text || product.name,
        })
            .eq("id", imageId);
        return product_repository_js_1.productRepository.findById(productId);
    }
}
exports.ProductMediaService = ProductMediaService;
