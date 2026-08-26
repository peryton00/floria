// Floria API — Admin Media Management Service
import crypto from "crypto";
import { getAdminDb } from "../config/database.js";
import { Errors } from "../utils/errors.js";
import { auditRepository } from "../database/repositories/audit.repository.js";
import { ImageEngine } from "../media/image-engine/image-engine.js";
import type { ImageProfileName } from "../media/image-engine/image-engine.types.js";

export interface ListAdminMediaParams {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class AdminMediaService {
  async listMedia(params: ListAdminMediaParams) {
    const db = getAdminDb();
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 30));
    const offset = (page - 1) * limit;

    // Fetch media_assets joined with variants, uploaded_by_user, seller_profile
    let query = db
      .from("media_assets")
      .select(`
        *,
        media_variants(*),
        uploader:user_profiles!uploaded_by_user_id(id, full_name, email),
        seller:seller_profiles!seller_id(id, business_name)
      `, { count: "exact" });

    if (params.category && params.category !== "ALL" && params.category !== "LEGACY") {
      query = query.eq("media_category", params.category);
    }

    if (params.status && params.status !== "ALL") {
      query = query.eq("status", params.status);
    }

    if (params.search?.trim()) {
      const s = params.search.trim().toLowerCase();
      query = query.or(`original_filename.ilike.%${s}%,id.ilike.%${s}%`);
    }

    const { data: assets, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[AdminMediaService] listMedia query notice:", error.message);
    }

    // Also fetch legacy product_images if category is 'ALL' or 'LEGACY'
    let legacyImages: any[] = [];
    if (!params.category || params.category === "ALL" || params.category === "LEGACY") {
      const legacyQuery = db
        .from("product_images")
        .select(`
          id, product_id, url, alt_text, display_order, is_primary, created_at, asset_id,
          product:products(id, name, slug, seller:seller_profiles(id, business_name))
        `)
        .is("asset_id", null);

      const { data: legData } = await legacyQuery.limit(50);
      if (legData) {
        legacyImages = legData.map((img: any) => ({
          id: `legacy_${img.id}`,
          legacy_product_image_id: img.id,
          is_legacy: true,
          original_filename: img.product?.name ? `${img.product.name} (Legacy Product Image)` : `Legacy Product Image #${img.id.slice(0, 8)}`,
          media_category: "PRODUCT",
          mime_type: "image/jpeg",
          file_size_bytes: 150000,
          status: "READY",
          storage_bucket: "public-media",
          created_at: img.created_at || new Date().toISOString(),
          public_url: img.url,
          product_id: img.product_id,
          product_name: img.product?.name,
          seller_name: img.product?.seller?.business_name,
          alt_text: img.alt_text,
          variants: { medium: img.url, thumbnail: img.url },
        }));
      }
    }

    // Compute stats
    const { count: totalAssetsCount } = await db.from("media_assets").select("id", { count: "exact", head: true });
    const { count: readyAssetsCount } = await db.from("media_assets").select("id", { count: "exact", head: true }).eq("status", "READY");
    const { data: variantsData } = await db.from("media_variants").select("size_bytes");

    const totalStorageBytes = (variantsData || []).reduce((acc: number, r: any) => acc + (Number(r.size_bytes) || 0), 0);
    const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.co";

    const formattedAssets = (assets || []).map((asset: any) => {
      const variantsMap: Record<string, string> = {};
      (asset.media_variants || []).forEach((v: any) => {
        variantsMap[v.variant_name] = `${supabaseUrl}/storage/v1/object/public/${v.storage_bucket}/${v.storage_path}`;
      });

      const primaryUrl =
        variantsMap.medium ||
        variantsMap.large ||
        variantsMap.thumbnail ||
        variantsMap.standard ||
        variantsMap.avatar ||
        variantsMap.banner ||
        (asset.original_path ? `${supabaseUrl}/storage/v1/object/public/${asset.storage_bucket}/${asset.original_path}` : "/floria-logo.png");

      return {
        id: asset.id,
        is_legacy: false,
        original_filename: asset.original_filename,
        media_category: asset.media_category,
        mime_type: asset.mime_type,
        file_size_bytes: Number(asset.file_size_bytes) || 0,
        status: asset.status,
        storage_bucket: asset.storage_bucket,
        created_at: asset.created_at,
        uploader_name: asset.uploader?.full_name || asset.uploader?.email || "System",
        seller_name: asset.seller?.business_name || null,
        public_url: primaryUrl,
        variants: variantsMap,
      };
    });

    const combined = params.category === "LEGACY" ? legacyImages : [...formattedAssets, ...legacyImages];

    return {
      items: combined,
      pagination: {
        page,
        limit,
        total: (count || 0) + legacyImages.length,
        totalPages: Math.ceil(((count || 0) + legacyImages.length) / limit),
      },
      stats: {
        totalAssets: (totalAssetsCount || 0) + legacyImages.length,
        readyAssets: (readyAssetsCount || 0) + legacyImages.length,
        totalStorageBytes,
        totalStorageMb: Number((totalStorageBytes / (1024 * 1024)).toFixed(2)),
      },
    };
  }

  async updateMedia(assetId: string, updates: { filename?: string; altText?: string; category?: string }) {
    const db = getAdminDb();

    if (assetId.startsWith("legacy_")) {
      const legId = assetId.replace("legacy_", "");
      if (updates.altText !== undefined) {
        await db.from("product_images").update({ alt_text: updates.altText }).eq("id", legId);
      }
      return { success: true, message: "Legacy product image updated" };
    }

    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.filename) payload.original_filename = updates.filename.trim();
    if (updates.category) payload.media_category = updates.category;

    const { data: updated, error } = await db
      .from("media_assets")
      .update(payload)
      .eq("id", assetId)
      .select()
      .maybeSingle();

    if (error || !updated) {
      throw Errors.notFound("Media asset");
    }

    if (updates.altText !== undefined) {
      await db.from("product_images").update({ alt_text: updates.altText }).eq("asset_id", assetId);
    }

    return updated;
  }

  async deleteMedia(assetId: string, adminUserId: string) {
    const db = getAdminDb();

    // Legacy product image deletion
    if (assetId.startsWith("legacy_")) {
      const legId = assetId.replace("legacy_", "");
      await db.from("product_images").delete().eq("id", legId);
      await auditRepository.log({
        actor_user_id: adminUserId,
        actor_role: "admin",
        action: "ADMIN_MEDIA_DELETED",
        resource_type: "legacy_product_image",
        resource_id: legId,
        metadata: { deleted_by: adminUserId },
      });
      return { success: true, message: "Legacy image deleted" };
    }

    const { data: asset } = await db
      .from("media_assets")
      .select("*, media_variants(*)")
      .eq("id", assetId)
      .maybeSingle();

    if (!asset) {
      throw Errors.notFound("Media asset");
    }

    // 1. Storage object deletion
    const bucket = asset.storage_bucket || "public-media";
    const storagePaths: string[] = [];
    if (asset.original_path) storagePaths.push(asset.original_path);
    (asset.media_variants || []).forEach((v: any) => {
      if (v.storage_path) storagePaths.push(v.storage_path);
    });

    if (storagePaths.length > 0) {
      try {
        await db.storage.from(bucket).remove(storagePaths);
      } catch (stErr: any) {
        console.warn("[AdminMediaService] Storage deletion warning:", stErr?.message || stErr);
      }
    }

    // 2. Unlink references in dependent tables
    await Promise.all([
      db.from("product_images").delete().eq("asset_id", assetId),
      db.from("categories").update({ asset_id: null }).eq("asset_id", assetId),
      db.from("categories").update({ banner_asset_id: null }).eq("banner_asset_id", assetId),
      db.from("seller_profiles").update({ logo_asset_id: null }).eq("logo_asset_id", assetId),
      db.from("seller_profiles").update({ banner_asset_id: null }).eq("banner_asset_id", assetId),
      db.from("user_profiles").update({ avatar_asset_id: null }).eq("avatar_asset_id", assetId),
      db.from("seller_documents").update({ file_asset_id: null }).eq("file_asset_id", assetId),
    ]);

    // 3. Database record deletion
    await db.from("media_variants").delete().eq("asset_id", assetId);
    await db.from("media_assets").delete().eq("id", assetId);

    // 4. Audit Log
    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "ADMIN_MEDIA_DELETED",
      resource_type: "media_asset",
      resource_id: assetId,
      metadata: { original_filename: asset.original_filename, category: asset.media_category },
    });

    return { success: true, message: "Media asset and files deleted successfully" };
  }

  async uploadDirectAdminMedia(
    adminUserId: string,
    input: { filename: string; mimeType: string; base64Data: string; profile?: ImageProfileName }
  ) {
    const db = getAdminDb();
    const profile: ImageProfileName = input.profile || "CATEGORY";

    const cleanBase64 = input.base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");

    if (!buffer || buffer.length === 0) {
      throw Errors.validation("Invalid or empty image file data.");
    }

    const result = await ImageEngine.process(buffer, profile);

    const assetId = crypto.randomUUID();
    const storageBucket = "public-media";
    const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.co";

    const variantInsertRows: any[] = [];
    const variantsMap: Record<string, string> = {};

    for (const v of result.variants) {
      const storagePath = `admin-uploads/${profile.toLowerCase()}/${assetId}/${v.variantName}.webp`;
      const { error: upErr } = await db.storage
        .from(storageBucket)
        .upload(storagePath, v.buffer, {
          contentType: "image/webp",
          upsert: true,
        });

      if (!upErr) {
        variantInsertRows.push({
          asset_id: assetId,
          variant_name: v.variantName,
          format: "webp",
          width: v.width,
          height: v.height,
          size_bytes: v.sizeBytes,
          storage_bucket: storageBucket,
          storage_path: storagePath,
        });

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${storageBucket}/${storagePath}`;
        variantsMap[v.variantName] = publicUrl;
      }
    }

    const { data: newAsset, error: assetErr } = await db
      .from("media_assets")
      .insert({
        id: assetId,
        uploaded_by_user_id: adminUserId,
        original_filename: input.filename || "admin-image.webp",
        media_category: profile,
        mime_type: input.mimeType || "image/webp",
        file_size_bytes: buffer.length,
        sha256_hash: crypto.createHash("sha256").update(buffer).digest("hex"),
        status: "READY",
        storage_bucket: storageBucket,
        original_path: `admin-uploads/${profile.toLowerCase()}/${assetId}/original.webp`,
      })
      .select()
      .single();

    if (assetErr || !newAsset) {
      throw new Error(`Media asset creation failed: ${assetErr?.message}`);
    }

    if (variantInsertRows.length > 0) {
      await db.from("media_variants").insert(variantInsertRows);
    }

    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "ADMIN_MEDIA_UPLOADED",
      resource_type: "media_asset",
      resource_id: assetId,
      metadata: { filename: input.filename, profile },
    });

    const primaryUrl = variantsMap.medium || variantsMap.large || variantsMap.thumbnail || Object.values(variantsMap)[0];

    return {
      asset: newAsset,
      publicUrl: primaryUrl,
      variants: variantsMap,
    };
  }
}

export const adminMediaService = new AdminMediaService();
