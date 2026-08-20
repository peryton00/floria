
// Floria Media Infrastructure — Media API Service
import crypto from "crypto";
import { getAdminDb } from "../config/database.js";
import { Errors } from "../utils/errors.js";
import type { AuthenticatedUser } from "../middleware/auth.js";
import type { ImageProfileName } from "./image-engine/image-engine.types.js";
import { enqueueMediaJob } from "./queue/media.queue.js";
import { ImageEngine } from "./image-engine/image-engine.js";
import { buildPublicVariantPath } from "./worker/path-builder.js";
import type {
  CreateSessionInput,
  UploadSessionDto,
  CompleteSessionDto,
  UploadSessionStatusDto,
} from "./media.types.js";

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

export const VALID_PROFILES: Set<ImageProfileName> = new Set([
  "PRODUCT",
  "NURSERY",
  "SELLER_LOGO",
  "USER_AVATAR",
  "CATEGORY",
  "REVIEW_IMAGE",
  "DOCUMENT",
]);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const SESSION_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

export class MediaService {
  /**
   * Creates a single media upload session with server-side security enforcement.
   */
  public static async createUploadSession(
    user: AuthenticatedUser,
    input: CreateSessionInput
  ): Promise<UploadSessionDto> {
    const adminDb = getAdminDb();

    // 1. Profile Validation
    if (!input.profile || !VALID_PROFILES.has(input.profile)) {
      throw Errors.validation(
        `Invalid profile '${input.profile}'. Must be one of [${Array.from(VALID_PROFILES).join(", ")}].`
      );
    }

    // 2. MIME & File Size Validation
    const mime = (input.mimeType || "").toLowerCase().trim();
    if (!mime || !ALLOWED_MIME_TYPES.has(mime)) {
      throw Errors.validation(
        `Unsupported MIME type '${input.mimeType}'. Allowed types: JPEG, PNG, WebP, HEIC/HEIF.`
      );
    }

    if (!input.sizeBytes || input.sizeBytes <= 0) {
      throw Errors.validation("File sizeBytes must be greater than 0.");
    }

    if (input.sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw Errors.validation("File size exceeds maximum allowed ceiling of 10 MB.");
    }

    // 3. Profile Authorization Rules
    let sellerId: string | null = null;

    if (input.profile === "PRODUCT" || input.profile === "NURSERY" || input.profile === "SELLER_LOGO") {
      if (user.role !== "seller" && user.role !== "admin" && user.role !== "super_admin") {
        throw Errors.forbidden("Seller role required to create seller-owned media upload sessions.");
      }
      if (!user.sellerId && user.role === "seller") {
        throw Errors.forbidden("No seller profile associated with user account.");
      }
      sellerId = user.sellerId || null;
    } else if (input.profile === "CATEGORY") {
      if (user.role !== "admin" && user.role !== "super_admin") {
        throw Errors.forbidden("Admin role required to create category media upload sessions.");
      }
    }

    // 4. Server-Generated Security Tokens & Paths
    const sessionId = crypto.randomUUID();
    const assetId = crypto.randomUUID();
    const sanitizedFilename = (input.filename || "image.jpg")
      .replace(/[\/\\]/g, "")
      .substring(0, 100);

    const ownerPathSegment = sellerId || user.id;
    const stagingPath = `staging/${ownerPathSegment}/${sessionId}/${assetId}.tmp`;
    const expiresAt = new Date(Date.now() + SESSION_EXPIRATION_MS).toISOString();

    // 5. Insert Record into media_upload_sessions
    const { error: insertErr } = await adminDb.from("media_upload_sessions").insert({
      id: sessionId,
      seller_id: sellerId,
      uploaded_by_user_id: user.id,
      target_domain: input.profile,
      media_category: "IMAGE",
      original_filename: sanitizedFilename,
      expected_mime_type: mime,
      expected_size_bytes: input.sizeBytes,
      staging_path: stagingPath,
      status: "CREATED",
      expires_at: expiresAt,
    });

    if (insertErr) {
      throw Errors.database(`Failed to create upload session: ${insertErr.message}`);
    }

    // Construct Presigned Staging Upload URL or Staging Path
    const { data: urlData } = await adminDb.storage
      .from("media-staging")
      .createSignedUploadUrl(stagingPath);

    const uploadUrl = urlData?.signedUrl || `/api/v1/media/staging/${stagingPath}`;

    return {
      sessionId,
      assetId,
      status: "CREATED",
      profile: input.profile,
      expiresAt,
      bucket: "media-staging",
      stagingPath,
      upload: {
        method: "PUT",
        url: uploadUrl,
        token: urlData?.token || null,
      },
    };
  }

  /**
   * Creates a batch of upload sessions (up to 10 images max per request).
   */
  public static async createBatchUploadSessions(
    user: AuthenticatedUser,
    inputs: CreateSessionInput[]
  ): Promise<UploadSessionDto[]> {
    if (!Array.isArray(inputs) || inputs.length === 0) {
      throw Errors.validation("Batch upload input must be a non-empty array.");
    }

    if (inputs.length > 10) {
      throw Errors.validation("Maximum batch size is 10 upload sessions per request.");
    }

    const sessions: UploadSessionDto[] = [];
    for (const input of inputs) {
      const session = await MediaService.createUploadSession(user, input);
      sessions.push(session);
    }
    return sessions;
  }

  /**
   * Finalizes an upload session after client uploads binary to staging.
   * Performs binary verification, SHA-256 deduplication, asset creation, and BullMQ enqueueing.
   */
  public static async completeUploadSession(
    user: AuthenticatedUser,
    sessionId: string
  ): Promise<CompleteSessionDto> {
    const adminDb = getAdminDb();

    // 1. Query Upload Session Record
    const { data: session, error: sessionErr } = await adminDb
      .from("media_upload_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionErr || !session) {
      throw Errors.notFound("Upload session");
    }

    // Ownership Verification
    if (session.uploaded_by_user_id !== user.id && user.role !== "admin" && user.role !== "super_admin") {
      throw Errors.forbidden("You do not have permission to finalize this upload session.");
    }

    // Idempotency: If already COMPLETED, return current state
    if (session.status === "COMPLETED" || session.status === "UPLOADED") {
      return {
        sessionId: session.id,
        assetId: session.resolved_asset_id || session.id,
        sessionStatus: session.status,
        assetStatus: "QUEUED",
        deduplicated: false,
      };
    }

    if (session.status !== "CREATED" && session.status !== "UPLOADING") {
      throw Errors.invalidTransition(session.status, "COMPLETED");
    }

    // Expiration Check
    if (new Date(session.expires_at) < new Date()) {
      await adminDb
        .from("media_upload_sessions")
        .update({ status: "EXPIRED", updated_at: new Date().toISOString() })
        .eq("id", sessionId);
      throw Errors.validation("Upload session has expired. Please create a new upload session.");
    }

    // 2. Storage Binary Inspection in media-staging
    const { data: fileData, error: downloadErr } = await adminDb.storage
      .from("media-staging")
      .download(session.staging_path);

    if (downloadErr || !fileData) {
      throw Errors.validation("Uploaded binary not found in staging storage. Upload may have failed.");
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      throw Errors.validation("Uploaded binary is empty (0 bytes).");
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw Errors.validation("Uploaded binary size exceeds 10 MB ceiling.");
    }

    // 3. SHA-256 Binary Hash Calculation
    const sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");

    // 4. SHA-256 Deduplication Check (for READY assets owned by same seller/system)
    let dedupQuery = adminDb
      .from("media_assets")
      .select("id, status")
      .eq("sha256_hash", sha256Hash)
      .eq("status", "READY");

    if (session.seller_id) {
      dedupQuery = dedupQuery.eq("seller_id", session.seller_id);
    } else {
      dedupQuery = dedupQuery.is("seller_id", null);
    }

    const { data: existingAsset } = await dedupQuery.maybeSingle();

    if (existingAsset) {
      // Deduplicate! Reuse existing asset, complete session, purge staging binary
      await adminDb
        .from("media_assets")
        .update({
          storage_bucket: "public-media",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAsset.id);

      await adminDb
        .from("media_upload_sessions")
        .update({
          status: "COMPLETED",
          completed_at: new Date().toISOString(),
          resolved_asset_id: existingAsset.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      await adminDb.storage.from("media-staging").remove([session.staging_path]);

      return {
        sessionId,
        assetId: existingAsset.id,
        sessionStatus: "COMPLETED",
        assetStatus: "READY",
        deduplicated: true,
      };
    }

    // 5. Create media_assets Record in PostgreSQL
    const assetId = crypto.randomUUID();
    const { error: assetInsertErr } = await adminDb.from("media_assets").insert({
      id: assetId,
      seller_id: session.seller_id,
      uploaded_by_user_id: session.uploaded_by_user_id,
      session_id: sessionId,
      media_category: "IMAGE",
      original_filename: session.original_filename,
      mime_type: session.expected_mime_type,
      file_size_bytes: buffer.length,
      sha256_hash: sha256Hash,
      storage_bucket: "media-staging",
      status: "QUEUED",
      is_system_seeded: false,
    });

    if (assetInsertErr) {
      throw Errors.database(`Failed to create media_assets record: ${assetInsertErr.message}`);
    }

    // 6. Direct Inline WebP Processing & Upload to public-media bucket
    let finalAssetStatus = "QUEUED";
    try {
      if (session.target_domain === "DOCUMENT") {
        const privatePath = `private/seller_${session.seller_id || "admin"}/${assetId}/document.pdf`;
        await adminDb.storage.from("private-documents").upload(privatePath, buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

        await adminDb
          .from("media_assets")
          .update({
            status: "READY",
            storage_bucket: "private-documents",
            original_path: privatePath,
            updated_at: new Date().toISOString(),
          })
          .eq("id", assetId);

        finalAssetStatus = "READY";
      } else {
        const engineResult = await ImageEngine.process(buffer, session.target_domain);
        const variantRecords: any[] = [];

        for (const variant of engineResult.variants) {
          const publicPath = buildPublicVariantPath(
            session.target_domain,
            session.seller_id,
            session.uploaded_by_user_id,
            assetId,
            variant.variantName
          );

          const { error: uploadErr } = await adminDb.storage
            .from("public-media")
            .upload(publicPath, variant.buffer, {
              contentType: "image/webp",
              cacheControl: "public, max-age=31536000, immutable",
              upsert: true,
            });

          if (!uploadErr) {
            variantRecords.push({
              asset_id: assetId,
              variant_name: variant.variantName,
              format: variant.format,
              width: variant.width,
              height: variant.height,
              size_bytes: variant.sizeBytes,
              storage_bucket: "public-media",
              storage_path: publicPath,
            });
          }
        }

        if (variantRecords.length > 0) {
          await adminDb.from("media_variants").insert(variantRecords);
          await adminDb
            .from("media_assets")
            .update({
              status: "READY",
              storage_bucket: "public-media",
              updated_at: new Date().toISOString(),
            })
            .eq("id", assetId);

          finalAssetStatus = "READY";
        }
      }

      // Cleanup staging file
      await adminDb.storage.from("media-staging").remove([session.staging_path]);
    } catch (procErr: any) {
      console.warn(`[MediaService] Inline processing warning for session '${sessionId}':`, procErr.message);
      // Fallback: Enqueue BullMQ Media Job if inline processing failed
      try {
        await enqueueMediaJob({
          assetId,
          sessionId,
          sellerId: session.seller_id,
          uploadedByUserId: session.uploaded_by_user_id,
          profile: session.target_domain,
          stagingPath: session.staging_path,
        });
      } catch (qErr: any) {
        // Ignore queue fallback error
      }
    }

    // 7. Update Session Status to COMPLETED
    await adminDb
      .from("media_upload_sessions")
      .update({
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
        resolved_asset_id: assetId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    return {
      sessionId,
      assetId,
      sessionStatus: "COMPLETED",
      assetStatus: finalAssetStatus,
      deduplicated: false,
    };
  }

  /**
   * Retrieves upload session status, asset status, and processed variants if READY.
   */
  public static async getUploadSessionStatus(
    user: AuthenticatedUser,
    sessionId: string
  ): Promise<UploadSessionStatusDto> {
    const adminDb = getAdminDb();

    // 1. Fetch Upload Session
    const { data: session, error: sessionErr } = await adminDb
      .from("media_upload_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionErr || !session) {
      throw Errors.notFound("Upload session");
    }

    // Authorization: Owner or Admin only
    if (session.uploaded_by_user_id !== user.id && user.role !== "admin" && user.role !== "super_admin") {
      throw Errors.forbidden("You do not have permission to view this upload session.");
    }

    let assetStatus = "NOT_CREATED";
    let failureReason: string | undefined = undefined;
    const variants: Record<string, string> = {};

    const targetAssetId = session.resolved_asset_id;

    const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.co";

    if (targetAssetId) {
      const { data: asset } = await adminDb
        .from("media_assets")
        .select("id, status, failure_message")
        .eq("id", targetAssetId)
        .maybeSingle();

      if (asset) {
        assetStatus = asset.status;
        failureReason = asset.failure_message || undefined;

        if (asset.status === "READY") {
          const { data: variantRows } = await adminDb
            .from("media_variants")
            .select("variant_name, storage_bucket, storage_path")
            .eq("asset_id", targetAssetId);

          if (variantRows) {
            for (const v of variantRows) {
              const publicUrl = `${supabaseUrl}/storage/v1/object/public/${v.storage_bucket}/${v.storage_path}`;
              variants[v.variant_name] = publicUrl;
            }
          }
        }
      }
    }

    // Fallback: If variants are not in media_variants table yet, provide canonical public-media WebP URL
    if (!variants.medium && !variants.thumbnail && targetAssetId) {
      const sellerSegment = session.uploaded_by_seller_id || "system";
      variants.medium = `${supabaseUrl}/storage/v1/object/public/public-media/products/${sellerSegment}/${targetAssetId}/medium.webp`;
      variants.thumbnail = `${supabaseUrl}/storage/v1/object/public/public-media/products/${sellerSegment}/${targetAssetId}/thumbnail.webp`;
    }

    return {
      sessionId: session.id,
      assetId: targetAssetId || null,
      sessionStatus: session.status,
      assetStatus,
      profile: session.expected_profile,
      createdAt: session.created_at,
      completedAt: session.completed_at || null,
      failureReason,
      variants,
    };
  }
}
