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
  profile: "PRODUCT" | "NURSERY" | "SELLER_LOGO" | "USER_AVATAR" | "CATEGORY" | "REVIEW_IMAGE" | "DOCUMENT";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setStatusText("Creating session...");

    try {
      // 1. Validate size
      if (file.size > maxSizeBytes) {
        throw new Error(`File '${file.name}' exceeds maximum size of ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`);
      }

      // Local preview
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // 2. Request Media Upload Session
      const sessionRes = await api.createMediaUploadSession({
        profile,
        filename: file.name,
        mimeType: file.type || "image/jpeg",
        sizeBytes: file.size,
      });

      if (!sessionRes.success || !sessionRes.data) {
        throw new Error(sessionRes.error?.message || "Failed to create upload session");
      }

      const { sessionId, stagingPath } = sessionRes.data;
      setStatusText("Uploading to staging...");

      // 3. Binary Upload to Supabase media-staging bucket via presigned signed upload URL
      const uploadTarget = sessionRes.data.upload;
      let uploadSuccess = false;
      let uploadErrText = "";

      if (uploadTarget?.url) {
        try {
          const putRes = await fetch(uploadTarget.url, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "image/jpeg",
            },
            body: file,
          });

          if (putRes.ok) {
            uploadSuccess = true;
          } else {
            const errBody = await putRes.text();
            uploadErrText = `HTTP ${putRes.status}: ${errBody}`;
          }
        } catch (fErr: any) {
          uploadErrText = fErr.message || "Network error during upload";
        }
      }

      if (!uploadSuccess) {
        const supabase = getSupabaseBrowserClient();
        const token = (uploadTarget as any)?.token;
        if (token) {
          const { error: sErr } = await supabase.storage
            .from("media-staging")
            .uploadToSignedUrl(stagingPath, token, file, {
              contentType: file.type || "image/jpeg",
            });
          if (sErr) {
            throw new Error(`Staging upload failed: ${sErr.message}`);
          }
        } else {
          const { error: uploadErr } = await supabase.storage
            .from("media-staging")
            .upload(stagingPath, file, {
              contentType: file.type || "image/jpeg",
              upsert: true,
            });

          if (uploadErr) {
            throw new Error(`Staging upload failed: ${uploadErr.message || uploadErrText}`);
          }
        }
      }

      setStatusText("Processing WebP variants...");

      // 4. Complete session
      const compRes = await api.completeMediaUploadSession(sessionId);
      if (!compRes.success || !compRes.data) {
        throw new Error(compRes.error?.message || "Failed to finalize upload session");
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
          if (statusRes.data.assetStatus === "READY") {
            assetReady = true;
            finalVariants = statusRes.data.variants || {};
          } else if (statusRes.data.assetStatus === "FAILED") {
            throw new Error(statusRes.data.failureReason || "Async image processing failed");
          }
        }
        attempts++;
      }

      // 6. Resolve final variant URL
      const resolvedUrl =
        finalVariants.medium ||
        finalVariants.avatar ||
        finalVariants.standard ||
        finalVariants.banner ||
        finalVariants.cover ||
        finalVariants.display ||
        finalVariants.thumbnail ||
        localPreview;

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
          <div className="w-12 h-12 rounded-lg border border-stone-200 overflow-hidden bg-stone-100 flex-shrink-0 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-3.5 py-2 text-xs font-semibold text-stone-800 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-50 transition-all shadow-xs"
        >
          {uploading ? statusText || "Uploading..." : label}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium mt-1">{error}</p>
      )}
    </div>
  );
}
