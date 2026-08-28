"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export interface ImageItem {
  id?: string; // product_images.id if attached
  assetId: string;
  url: string; // resolved WebP URL or preview URL
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
  status?: "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  sessionId?: string;
  errorMessage?: string;
}

interface ProductImageUploaderProps {
  productId?: string; // If editing existing product
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
}

export function ProductImageUploader({
  productId,
  images,
  onChange,
  maxImages = 8,
}: ProductImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed per product.`);
      return;
    }

    setError(null);
    setUploading(true);

    let workingImages = [...images];
    const tasks: { file: File; tempIndex: number }[] = [];

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    for (const file of files) {
      if (!validTypes.includes(file.type.toLowerCase())) {
        setError(`File '${file.name}' has unsupported type. Allowed: JPEG, PNG, WebP, HEIC.`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(`File '${file.name}' exceeds maximum allowed size of 10 MB.`);
        continue;
      }

      const tempIndex = workingImages.length;
      const tempItem: ImageItem = {
        assetId: "",
        url: URL.createObjectURL(file),
        altText: file.name,
        isPrimary: tempIndex === 0,
        status: "UPLOADING",
      };

      workingImages.push(tempItem);
      tasks.push({ file, tempIndex });
    }

    onChange([...workingImages]);

    await Promise.all(
      tasks.map(async ({ file, tempIndex }) => {
        try {
          // 1. Request Media Upload Session
          const sessionRes = await api.createMediaUploadSession({
            profile: "PRODUCT",
            filename: file.name,
            mimeType: file.type || "image/jpeg",
            sizeBytes: file.size,
          });

          if (!sessionRes.success || !sessionRes.data) {
            throw new Error(sessionRes.error?.message || "Failed to create upload session");
          }

          const { sessionId, stagingPath } = sessionRes.data;

          // 2. Upload binary to Supabase media-staging via signed upload token.
          // media-staging is a PRIVATE bucket — must use uploadToSignedUrl with the token
          // returned by the backend createSignedUploadUrl call. Raw PUT to signedUrl does not
          // work on private buckets; only the token-authenticated path works.
          const uploadTarget = sessionRes.data.upload;
          const supabase = getSupabaseBrowserClient();
          const token = uploadTarget?.token;

          if (!token) {
            throw new Error("No signed upload token received from server. Cannot upload to staging.");
          }

          const { error: uploadErr } = await supabase.storage
            .from("media-staging")
            .uploadToSignedUrl(stagingPath, token, file, {
              contentType: file.type || "image/jpeg",
            });

          if (uploadErr) {
            throw new Error(`Staging upload failed: ${uploadErr.message}`);
          }

          // Update UI status to PROCESSING
          const item = workingImages[tempIndex];
          if (item) {
            item.status = "PROCESSING";
            item.sessionId = sessionId;
            onChange([...workingImages]);
          }

          // 3. Complete session
          const compRes = await api.completeMediaUploadSession(sessionId);
          if (!compRes.success || !compRes.data) {
            throw new Error(compRes.error?.message || "Failed to finalize upload session");
          }

          const authoritativeAssetId = compRes.data.assetId;
          if (item) {
            item.assetId = authoritativeAssetId;
          }

          // 4. Poll status until READY
          let assetReady = compRes.data.assetStatus === "READY";
          let attempts = 0;
          let finalVariants: Record<string, string> = {};

          while (!assetReady && attempts < 20) {
            await new Promise((r) => setTimeout(r, 1000));
            const statusRes = await api.getMediaUploadSessionStatus(sessionId);
            if (statusRes.success && statusRes.data) {
              if (statusRes.data.variants && Object.keys(statusRes.data.variants).length > 0) {
                finalVariants = statusRes.data.variants;
              }
              if (statusRes.data.assetStatus === "READY") {
                assetReady = true;
              } else if (statusRes.data.assetStatus === "FAILED") {
                throw new Error(statusRes.data.failureReason || "Async image processing failed");
              }
            }
            attempts++;
          }

          // 5. Update UI with READY asset and permanent HTTPS URL
          if (item) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase.co";
            let resolvedUrl =
              finalVariants.medium ||
              finalVariants.large ||
              finalVariants.thumbnail;

            if (!resolvedUrl || resolvedUrl.startsWith("blob:") || resolvedUrl.includes("/media-staging/")) {
              resolvedUrl = `${supabaseUrl}/storage/v1/object/public/public-media/products/s-1/${authoritativeAssetId}/medium.webp`;
            }

            // Revoke temporary browser blob URL to free memory and prevent dead blob reference leaks
            if (item.url && item.url.startsWith("blob:")) {
              try {
                URL.revokeObjectURL(item.url);
              } catch (e) {
                // Ignore blob revocation errors
              }
            }

            item.url = resolvedUrl;
            item.status = "READY";

            // If editing existing product, attach to product immediately via API
            if (productId) {
              const attachRes = await api.attachProductImage(productId, {
                assetId: authoritativeAssetId,
                altText: file.name,
                isPrimary: item.isPrimary,
              });

              if (attachRes.success && attachRes.data?.id) {
                item.id = attachRes.data.id;
              }
            }

            onChange([...workingImages]);
          }
        } catch (err: any) {
          console.error(`Product image upload error for ${file.name}:`, err);
          const item = workingImages[tempIndex];
          if (item) {
            item.status = "FAILED";
            item.errorMessage = err.message || "Upload failed";
            onChange([...workingImages]);
          }
        }
      })
    );

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = async (index: number) => {
    const target = images[index];
    if (!target) return;

    if (productId && target.id) {
      try {
        const res = await api.removeProductImage(productId, target.id);
        if (!res.success) {
          setError(res.error?.message || "Failed to remove image");
          return;
        }
      } catch (err: any) {
        setError(err.message || "Failed to remove image");
        return;
      }
    }

    const updated = images.filter((_, i) => i !== index);
    // Ensure one primary image remains if array non-empty
    if (updated.length > 0 && updated[0] && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleSetPrimary = async (index: number) => {
    const target = images[index];
    if (!target) return;

    if (productId && target.id) {
      try {
        const res = await api.setPrimaryProductImage(productId, target.id);
        if (!res.success) {
          setError(res.error?.message || "Failed to set primary image");
          return;
        }
      } catch (err: any) {
        setError(err.message || "Failed to set primary image");
        return;
      }
    }

    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const [movedItem] = updated.splice(index, 1);
    if (movedItem) {
      updated.splice(targetIndex, 0, movedItem);
    }

    if (productId) {
      const orders = updated.map((img, i) => ({
        imageId: img.id || "",
        displayOrder: i + 1,
      })).filter((o) => !!o.imageId);

      if (orders.length > 0) {
        await api.reorderProductImages(productId, orders);
      }
    }

    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-semibold text-stone-900">
            Product Images ({images.length}/{maxImages})
          </label>
          <p className="text-xs text-stone-500">
            Upload high quality plant or product photos. Images are automatically optimized into high-performance WebP variants.
          </p>
        </div>
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
          >
            {uploading ? "Processing Upload..." : "+ Add Images"}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Grid Display */}
      {images.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-stone-800">Click to upload product media</p>
          <p className="text-xs text-stone-500 mt-1">PNG, JPG, WebP up to 10MB</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div
              key={img.id || img.assetId || idx}
              className={`relative group rounded-xl border overflow-hidden bg-stone-50 transition-all ${
                img.isPrimary ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-stone-200"
              }`}
            >
              <div className="aspect-square relative flex items-center justify-center bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.altText || `Product image ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Status Overlay */}
                {img.status && img.status !== "READY" && (
                  <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2 text-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                    <span className="text-[10px] font-semibold tracking-wider uppercase">
                      {img.status === "UPLOADING" ? "Uploading..." : "Processing WebP..."}
                    </span>
                  </div>
                )}

                {/* Primary Tag */}
                {img.isPrimary && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold text-white bg-emerald-600 rounded-md shadow-xs">
                    Primary
                  </span>
                )}

                {/* Action Hover Bar */}
                <div className="absolute inset-0 bg-stone-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      className="px-2 py-1 text-[10px] font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
                      title="Set as Primary Image"
                    >
                      Make Primary
                    </button>
                  )}
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "up")}
                      className="p-1 text-stone-700 bg-white rounded-md hover:bg-stone-100"
                      title="Move Left"
                    >
                      ←
                    </button>
                  )}
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "down")}
                      className="p-1 text-stone-700 bg-white rounded-md hover:bg-stone-100"
                      title="Move Right"
                    >
                      →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-red-600 bg-white rounded-md hover:bg-red-50"
                    title="Remove Image"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
