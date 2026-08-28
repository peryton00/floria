"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  UploadIcon,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export interface ImageItem {
  id?: string;
  assetId: string;
  url: string;
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
  status?: "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  sessionId?: string;
  errorMessage?: string;
}

interface ProductImageUploaderProps {
  productId?: string;
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
}

export function ProductImageUploader({
  images,
  onChange,
  maxImages = 6,
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

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    for (const file of files) {
      if (!validTypes.includes(file.type.toLowerCase())) {
        setError(
          `File '${file.name}' has unsupported type. Allowed: JPEG, PNG, WebP.`,
        );
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(`File '${file.name}' exceeds maximum allowed size of 10 MB.`);
        continue;
      }

      try {
        // 1. Create upload session
        const sessionRes = await api.createUploadSession({
          profile: "PRODUCT",
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });

        if (!sessionRes.success || !sessionRes.data) {
          throw new Error(
            sessionRes.error?.message || "Failed to create upload session",
          );
        }

        const { sessionId, stagingPath } = sessionRes.data;

        // 2. Upload to Supabase storage staging
        const supabase = getSupabaseBrowserClient();
        const { error: uploadErr } = await supabase.storage
          .from("media-staging")
          .upload(stagingPath, file, { contentType: file.type, upsert: true });

        if (uploadErr) {
          throw new Error(`Upload error: ${uploadErr.message}`);
        }

        // 3. Complete upload session
        const completeRes = await api.completeUploadSession(sessionId);
        if (!completeRes.success || !completeRes.data) {
          throw new Error(completeRes.error?.message || "Processing failed");
        }

        const assetId = completeRes.data.assetId;
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/public-media/products/${assetId}.webp`;

        onChange([
          ...images,
          {
            assetId,
            url: publicUrl,
            altText: file.name,
            isPrimary: images.length === 0,
            status: "READY",
          },
        ]);
      } catch (err: any) {
        setError(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-700">
          Product Images ({images.length}/{maxImages})
        </label>
        {error && (
          <span className="text-xs text-error-600 font-semibold">{error}</span>
        )}
      </div>

      {/* Grid of Images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img, idx) => (
          <div
            key={img.assetId || idx}
            className={`relative rounded-xl overflow-hidden border bg-cream-200 aspect-square group ${
              img.isPrimary
                ? "border-forest-800 ring-2 ring-forest-700/30"
                : "border-cream-300"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.altText || "Product"}
              className="w-full h-full object-cover"
            />

            {img.isPrimary && (
              <span className="absolute top-2 left-2 bg-forest-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                Primary
              </span>
            )}

            <div className="absolute inset-0 bg-ink-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {!img.isPrimary && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(idx)}
                  className="p-1.5 bg-white text-forest-800 rounded-lg hover:bg-forest-50 transition-colors"
                  title="Make primary photo"
                >
                  <Check size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1.5 bg-white text-error-600 rounded-lg hover:bg-error-50 transition-colors"
                title="Remove photo"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="border-2 border-dashed border-cream-400 hover:border-forest-700 bg-cream-50/80 hover:bg-cream-100 rounded-xl aspect-square flex flex-col items-center justify-center gap-2 text-ink-500 hover:text-forest-800 transition-all cursor-pointer p-4 text-center disabled:opacity-50"
          >
            {uploading ? (
              <RefreshCw className="animate-spin text-forest-700" size={24} />
            ) : (
              <UploadIcon size={24} className="text-forest-700" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">
              {uploading ? "Processing..." : "Add Photos"}
            </span>
            <span className="text-[10px] text-ink-400">
              JPEG, PNG, WebP (Max 10MB)
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
