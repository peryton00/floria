"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPublicVariantPath = buildPublicVariantPath;
function buildPublicVariantPath(profile, sellerId, uploadedByUserId, assetId, variantName) {
    const sellerPathSegment = sellerId || "system";
    switch (profile) {
        case "PRODUCT":
            return `products/${sellerPathSegment}/${assetId}/${variantName}.webp`;
        case "NURSERY":
            return `nurseries/${sellerPathSegment}/${assetId}/${variantName}.webp`;
        case "SELLER_LOGO":
            return `sellers/${sellerPathSegment}/${assetId}/${variantName}.webp`;
        case "CATEGORY":
            return `categories/${assetId}/${variantName}.webp`;
        case "USER_AVATAR":
            return `avatars/${uploadedByUserId}/${assetId}/${variantName}.webp`;
        case "REVIEW_IMAGE":
            return `reviews/${uploadedByUserId}/${assetId}/${variantName}.webp`;
        default:
            return `system/${assetId}/${variantName}.webp`;
    }
}
