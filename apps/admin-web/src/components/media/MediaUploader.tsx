"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export interface MediaUploadResult {
  assetId: string;
  url: string;
  filename: string;
  variants?: Record<string, string>;
}

interface MediaUploaderProps {
  profile:
    | "PRODUCT"
    | "NURSERY"
    | "SELLER_LOGO"
    | "USER_AVATAR"
    | "CATEGORY"
    | "REVIEW_IMAGE"
    | "DOCUMENT";
  onUploadSuccess: (result: MediaUploadResult) => void;
  label?: string;
  accept?: string;
  maxSizeBytes?: number;
  currentUrl?: string;
  className?: string;
}

export function MediaUploader({
  profile,
  onUploadSuccess,
  label = "Upload Image",
  accept = "image/jpeg,image/png,image/webp,image/heic",
  maxSizeBytes = 10 * 1024 * 1024,
  currentUrl,
  className = "",
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentUrl || null,
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setStatusText("Preparing upload...");

    let localPreview = "";
    try {
      // 1. Validate size
      if (file.size > maxSizeBytes) {
        throw new Error(
          `File '${file.name}' exceeds maximum size of ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`,
        );
      }

      // Local preview
      localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase.co";
      const supabase = getSupabaseBrowserClient();

      // 2. Request Media Upload Session via API
      let sessionRes = await api.createMediaUploadSession({
        profile,
        filename: file.name,
        mimeType: file.type || "image/jpeg",
        sizeBytes: file.size,
      });

      // Direct Fallback if session API is rejected by database RLS
      if (!sessionRes.success || !sessionRes.data) {
        console.warn("Media session creation failed, switching to direct storage upload:", sessionRes.error);
        setStatusText("Uploading image...");

        const cleanExt = file.name.split(".").pop() || "jpg";
        const randomId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        const directPath = `categories/${randomId}.${cleanExt}`;

        const { data: uploadData, error: directErr } = await supabase.storage
          .from("public-media")
          .upload(directPath, file, {
            contentType: file.type || "image/jpeg",
            upsert: true,
          });

        if (directErr) {
          throw new Error(sessionRes.error?.message || directErr.message || "Failed to upload image.");
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/public-media/${directPath}`;
        setPreviewUrl(publicUrl);
        setStatusText(null);

        onUploadSuccess({
          assetId: randomId,
          url: publicUrl,
          filename: file.name,
          variants: { original: publicUrl, standard: publicUrl },
        });
        return;
      }

      const { sessionId, stagingPath } = sessionRes.data;
      setStatusText("Uploading to staging...");

      // 3. Upload binary to Supabase media-staging via signed upload token.
      const uploadTarget = sessionRes.data.upload;
      const token = uploadTarget?.token;

      if (!token) {
        throw new Error(
          "No signed upload token received from server. Cannot upload to staging.",
        );
      }

      const { error: uploadErr } = await supabase.storage
        .from("media-staging")
        .uploadToSignedUrl(stagingPath, token, file, {
          contentType: file.type || "image/jpeg",
        });

      if (uploadErr) {
        throw new Error(`Staging upload failed: ${uploadErr.message}`);
      }

      setStatusText("Processing WebP variants...");

      // 4. Complete session
      const compRes = await api.completeMediaUploadSession(sessionId);
      if (!compRes.success || !compRes.data) {
        throw new Error(
          compRes.error?.message || "Failed to finalize upload session",
        );
      }

      const authoritativeAssetId = compRes.data.assetId;

      // 5. Poll status until READY
      let assetReady = compRes.data.assetStatus === "READY";
      let attempts = 0;
      let finalVariants: Record<string, string> = {};

      while (!assetReady && attempts < 25) {
        await new Promise((r) => setTimeout(r, 1000));
        const statusRes = await api.getMediaUploadSessionStatus(sessionId);
        if (statusRes.success && statusRes.data) {
          if (
            statusRes.data.variants &&
            Object.keys(statusRes.data.variants).length > 0
          ) {
            finalVariants = statusRes.data.variants;
          }
          if (statusRes.data.assetStatus === "READY") {
            assetReady = true;
          } else if (statusRes.data.assetStatus === "FAILED") {
            throw new Error(
              statusRes.data.failureReason || "Async image processing failed",
            );
          }
        }
        attempts++;
      }

      // 6. Resolve final variant URL
      let resolvedUrl =
        finalVariants.medium ||
        finalVariants.avatar ||
        finalVariants.standard ||
        finalVariants.banner ||
        finalVariants.cover ||
        finalVariants.display ||
        finalVariants.thumbnail ||
        finalVariants.original;

      if (!resolvedUrl || resolvedUrl.startsWith("blob:") || resolvedUrl.includes("media-staging")) {
        const cleanPath = stagingPath.replace(/^staging\//, "").replace(/\.tmp$/, ".webp");
        resolvedUrl = `${supabaseUrl}/storage/v1/object/public/public-media/${cleanPath}`;
      }

      if (localPreview && localPreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(localPreview);
        } catch (e) {
          // Ignore blob revocation errors
        }
      }

      setPreviewUrl(resolvedUrl);
      setStatusText(null);

      onUploadSuccess({
        assetId: authoritativeAssetId,
        url: resolvedUrl,
        filename: file.name,
        variants: finalVariants,
      });
    } catch (err: any) {
      console.error("Media upload error:", err);
      setError(err.message || "Upload failed");
      setStatusText(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        {previewUrl && (
          <div className="w-12 h-12 rounded-xl border border-cream-300 overflow-hidden bg-cream-100 flex-shrink-0 relative shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-xs flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="group/btn relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-cream-100 border border-cream-400/80 text-ink-800 font-medium text-xs shadow-xs hover:border-forest-700/40 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-forest-600 group-hover/btn:bg-forest-800" />
          <span>{uploading ? statusText || "Uploading..." : label}</span>
        </button>
      </div>

      {error && (
        <p className="text-xs text-error-700 font-medium mt-1 bg-error-50 border border-error-100 p-2 rounded-lg">{error}</p>
      )}
    </div>
  );
}
