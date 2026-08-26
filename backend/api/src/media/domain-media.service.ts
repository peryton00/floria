// Floria Media Infrastructure — Domain Media Integration Service
import { getAdminDb } from "../config/database.js";
import { Errors } from "../utils/errors.js";
import type { AuthenticatedUser } from "../middleware/auth.js";
import { MediaResolverService } from "./media-resolver.service.js";

export class DomainMediaService {
  /**
   * 1. SELLER / NURSERY LOGO INTEGRATION
   */
  public static async updateSellerLogo(
    user: AuthenticatedUser,
    assetId: string
  ) {
    const adminDb = getAdminDb();
    const sellerId = user.sellerId;

    if (!sellerId) {
      throw Errors.forbidden("Seller profile required to update seller logo.");
    }

    // 1. Verify seller profile ownership
    const { data: seller, error: sErr } = await adminDb
      .from("seller_profiles")
      .select("id, user_id")
      .eq("id", sellerId)
      .maybeSingle();

    if (sErr || !seller) throw Errors.notFound("Seller profile");
    if (seller.user_id !== user.id && user.role !== "admin" && user.role !== "super_admin") {
      throw Errors.forbidden("You do not own this seller profile.");
    }

    // 2. Verify media asset eligibility
    const { data: asset, error: aErr } = await adminDb
      .from("media_assets")
      .select("id, seller_id, status, media_category, storage_bucket")
      .eq("id", assetId)
      .maybeSingle();

    if (aErr || !asset) throw Errors.notFound("Media asset");
    if (asset.seller_id && asset.seller_id !== sellerId) {
      throw Errors.forbidden("Cross-seller media asset attachment is prohibited.");
    }
    if (asset.status !== "READY") {
      throw Errors.validation("Media asset is not READY for logo attachment.");
    }
    if (asset.media_category !== "IMAGE") {
      throw Errors.validation("Only image assets can be used as seller logo.");
    }
    if (asset.storage_bucket !== "public-media") {
      throw Errors.validation("Only public-media assets can be used as seller logo.");
    }

    // 3. Resolve logo WebP URL
    const variantMap = await MediaResolverService.resolveAssetVariants([assetId]);
    const vars = variantMap.get(assetId) || {};
    const logoUrl = vars.standard || vars.medium || vars.thumbnail || "";

    // 4. Update seller profile
    const { data: updated, error: uErr } = await adminDb
      .from("seller_profiles")
      .update({
        logo_asset_id: assetId,
        logo_url: logoUrl || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sellerId)
      .select("*")
      .single();

    if (uErr || !updated) {
      throw Errors.database(`Failed to update seller logo: ${uErr?.message}`);
    }

    const [enriched] = await MediaResolverService.enrichSellerProfiles([updated]);
    return enriched;
  }

  /**
   * 2. USER AVATAR INTEGRATION
   */
  public static async updateUserAvatar(
    user: AuthenticatedUser,
    assetId: string
  ) {
    const adminDb = getAdminDb();

    // 1. Verify user profile existence
    const { data: profile, error: pErr } = await adminDb
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (pErr || !profile) throw Errors.notFound("User profile");

    // 2. Verify media asset eligibility
    const { data: asset, error: aErr } = await adminDb
      .from("media_assets")
      .select("id, uploaded_by_user_id, status, media_category, storage_bucket")
      .eq("id", assetId)
      .maybeSingle();

    if (aErr || !asset) throw Errors.notFound("Media asset");
    if (asset.uploaded_by_user_id !== user.id && user.role !== "admin" && user.role !== "super_admin") {
      throw Errors.forbidden("Cross-user media asset attachment is prohibited.");
    }
    if (asset.status !== "READY") {
      throw Errors.validation("Media asset is not READY for avatar attachment.");
    }
    if (asset.media_category !== "IMAGE") {
      throw Errors.validation("Only image assets can be used as avatar.");
    }
    if (asset.storage_bucket !== "public-media") {
      throw Errors.validation("Only public-media assets can be used as avatar.");
    }

    // 3. Resolve avatar WebP URL
    const variantMap = await MediaResolverService.resolveAssetVariants([assetId]);
    const vars = variantMap.get(assetId) || {};
    const avatarUrl = vars.avatar || vars.thumbnail || vars.medium || "";

    // 4. Update user profile
    const { data: updated, error: uErr } = await adminDb
      .from("user_profiles")
      .update({
        avatar_asset_id: assetId,
        avatar_url: avatarUrl || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (uErr || !updated) {
      throw Errors.database(`Failed to update user avatar: ${uErr?.message}`);
    }

    const [enriched] = await MediaResolverService.enrichUserProfiles([updated]);
    return enriched;
  }

  /**
   * 3. CATEGORY BANNER INTEGRATION (ADMIN ONLY)
   */
  public static async updateCategoryBanner(
    user: AuthenticatedUser,
    categoryId: string,
    assetId: string
  ) {
    const adminDb = getAdminDb();

    if (user.role !== "admin" && user.role !== "super_admin") {
      throw Errors.forbidden("Only administrators can update category banners.");
    }

    // 1. Verify category existence
    const { data: category, error: cErr } = await adminDb
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .maybeSingle();

    if (cErr || !category) throw Errors.notFound("Category");

    // 2. Verify media asset eligibility
    const { data: asset, error: aErr } = await adminDb
      .from("media_assets")
      .select("id, status, media_category, storage_bucket")
      .eq("id", assetId)
      .maybeSingle();

    if (aErr || !asset) throw Errors.notFound("Media asset");
    if (asset.status !== "READY") {
      throw Errors.validation("Media asset is not READY for category banner.");
    }
    if (asset.media_category !== "IMAGE") {
      throw Errors.validation("Only image assets can be used as category banner.");
    }
    if (asset.storage_bucket !== "public-media") {
      throw Errors.validation("Only public-media assets can be used as category banner.");
    }

    // 3. Resolve banner WebP URL
    const variantMap = await MediaResolverService.resolveAssetVariants([assetId]);
    const vars = variantMap.get(assetId) || {};
    const bannerUrl = vars.banner || vars.medium || vars.cover || "";

    // 4. Update category
    const { data: updated, error: uErr } = await adminDb
      .from("categories")
      .update({
        asset_id: assetId,
        banner_asset_id: assetId,
        image_url: bannerUrl || undefined,
        banner_url: bannerUrl || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", categoryId)
      .select("*")
      .single();

    if (uErr || !updated) {
      throw Errors.database(`Failed to update category banner: ${uErr?.message}`);
    }

    const [enriched] = await MediaResolverService.enrichCategories([updated]);
    return enriched;
  }

  /**
   * 4. REVIEW IMAGES INTEGRATION
   */
  public static async attachReviewImage(
    user: AuthenticatedUser,
    reviewId: string,
    assetId: string,
    displayOrder = 0
  ) {
    const adminDb = getAdminDb();

    // 1. Verify review ownership
    const { data: review, error: rErr } = await adminDb
      .from("product_reviews")
      .select("id, customer_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (rErr || !review) throw Errors.notFound("Product review");
    if (review.customer_id !== user.id && user.role !== "admin" && user.role !== "super_admin") {
      throw Errors.forbidden("You do not own this product review.");
    }

    // 2. Verify media asset eligibility & user ownership
    const { data: asset, error: aErr } = await adminDb
      .from("media_assets")
      .select("id, uploaded_by_user_id, status, media_category, storage_bucket")
      .eq("id", assetId)
      .maybeSingle();

    if (aErr || !asset) throw Errors.notFound("Media asset");
    if (asset.uploaded_by_user_id !== user.id && user.role !== "admin" && user.role !== "super_admin") {
      throw Errors.forbidden("Cross-user review image attachment is prohibited.");
    }
    if (asset.status !== "READY") {
      throw Errors.validation("Media asset is not READY for review image.");
    }
    if (asset.media_category !== "IMAGE") {
      throw Errors.validation("Only image assets can be attached to reviews.");
    }
    if (asset.storage_bucket !== "public-media") {
      throw Errors.validation("Only public-media assets can be attached to reviews.");
    }

    // 3. Upsert into review_media table
    const { data: attached, error: insErr } = await adminDb
      .from("review_media")
      .insert({
        review_id: reviewId,
        asset_id: assetId,
        display_order: displayOrder,
      })
      .select("*")
      .single();

    if (insErr || !attached) {
      throw Errors.database(`Failed to attach review image: ${insErr?.message}`);
    }

    const [enriched] = await MediaResolverService.enrichReviewMedia([attached]);
    return enriched;
  }

  /**
   * 5. SELLER PRIVATE DOCUMENTS INTEGRATION
   */
  public static async attachSellerDocument(
    user: AuthenticatedUser,
    documentType: string,
    fileAssetId: string
  ) {
    const adminDb = getAdminDb();
    const sellerId = user.sellerId;

    if (!sellerId) {
      throw Errors.forbidden("Seller profile required to upload seller documents.");
    }

    // 1. Verify media asset in private-documents
    const { data: asset, error: aErr } = await adminDb
      .from("media_assets")
      .select("id, seller_id, status, media_category, storage_bucket, original_path, original_filename, mime_type, file_size_bytes")
      .eq("id", fileAssetId)
      .maybeSingle();

    if (aErr || !asset) throw Errors.notFound("Media asset");
    if (asset.seller_id && asset.seller_id !== sellerId) {
      throw Errors.forbidden("Cross-seller document upload is prohibited.");
    }
    if (asset.storage_bucket !== "private-documents") {
      throw Errors.validation("Seller documents must be stored in 'private-documents' bucket.");
    }

    // 2. Create seller_documents record
    const { data: doc, error: dErr } = await adminDb
      .from("seller_documents")
      .insert({
        seller_id: sellerId,
        document_type: documentType,
        file_asset_id: fileAssetId,
        document_url: asset.original_path,
      })
      .select("*")
      .single();

    if (dErr || !doc) {
      throw Errors.database(`Failed to record seller document: ${dErr?.message}`);
    }

    return doc;
  }

  /**
   * 5B. PRIVATE DOCUMENT SIGNED RETRIEVAL (SECURITY ENFORCED)
   */
  public static async getSignedDocumentUrl(
    user: AuthenticatedUser,
    documentId: string
  ): Promise<{ signedUrl: string; filename?: string }> {
    const adminDb = getAdminDb();

    // 1. Query document & seller ownership
    const { data: doc, error: dErr } = await adminDb
      .from("seller_documents")
      .select("*, seller:seller_profiles(user_id)")
      .eq("id", documentId)
      .maybeSingle();

    if (dErr || !doc) throw Errors.notFound("Seller document");

    // Security check: Only seller owner or admin can access private document
    const sellerUserId = (doc.seller as any)?.user_id;
    if (sellerUserId !== user.id && user.role !== "admin" && user.role !== "super_admin") {
      throw Errors.forbidden("Unauthorized access to private seller document.");
    }

    // 2. Get storage path from asset or document record
    let storagePath = doc.document_url || doc.file_url;
    if (doc.file_asset_id) {
      const { data: asset } = await adminDb
        .from("media_assets")
        .select("original_path")
        .eq("id", doc.file_asset_id)
        .maybeSingle();
      if (asset?.original_path) {
        storagePath = asset.original_path;
      }
    }

    if (!storagePath) {
      throw Errors.notFound("Document storage path");
    }

    // 3. Generate 60-minute signed URL for private download
    const { data: urlData, error: sErr } = await adminDb.storage
      .from("private-documents")
      .createSignedUrl(storagePath, 3600);

    if (sErr || !urlData?.signedUrl) {
      throw Errors.database(`Failed to generate signed document URL: ${sErr?.message}`);
    }

    return {
      signedUrl: urlData.signedUrl,
      filename: `${doc.document_type}.pdf`,
    };
  }

  /**
   * 6. NURSERY PROFILE / SHOWCASE MEDIA INTEGRATION
   */
  public static async updateNurseryBanner(
    user: AuthenticatedUser,
    assetId: string
  ) {
    const adminDb = getAdminDb();
    const sellerId = user.sellerId;

    if (!sellerId) {
      throw Errors.forbidden("Seller profile required to update nursery banner.");
    }

    // 1. Verify seller profile ownership
    const { data: seller, error: sErr } = await adminDb
      .from("seller_profiles")
      .select("id, user_id")
      .eq("id", sellerId)
      .maybeSingle();

    if (sErr || !seller) throw Errors.notFound("Seller profile");
    if (seller.user_id !== user.id && user.role !== "admin" && user.role !== "super_admin") {
      throw Errors.forbidden("You do not own this nursery profile.");
    }

    // 2. Verify media asset eligibility
    const { data: asset, error: aErr } = await adminDb
      .from("media_assets")
      .select("id, seller_id, status, media_category, storage_bucket")
      .eq("id", assetId)
      .maybeSingle();

    if (aErr || !asset) throw Errors.notFound("Media asset");
    if (asset.seller_id && asset.seller_id !== sellerId) {
      throw Errors.forbidden("Cross-seller media asset attachment is prohibited.");
    }
    if (asset.status !== "READY") {
      throw Errors.validation("Media asset is not READY for nursery banner.");
    }
    if (asset.media_category !== "IMAGE") {
      throw Errors.validation("Only image assets can be used as nursery banner.");
    }
    if (asset.storage_bucket !== "public-media") {
      throw Errors.validation("Only public-media assets can be used as nursery banner.");
    }

    // 3. Resolve nursery cover WebP URL
    const variantMap = await MediaResolverService.resolveAssetVariants([assetId]);
    const vars = variantMap.get(assetId) || {};
    const bannerUrl = vars.cover || vars.card || vars.medium || "";

    // 4. Update seller profile nursery cover/logo
    const { data: updated, error: uErr } = await adminDb
      .from("seller_profiles")
      .update({
        logo_asset_id: assetId,
        logo_url: bannerUrl || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sellerId)
      .select("*")
      .single();

    if (uErr || !updated) {
      throw Errors.database(`Failed to update nursery banner: ${uErr?.message}`);
    }

    const [enriched] = await MediaResolverService.enrichSellerProfiles([updated]);
    return enriched;
  }
}
