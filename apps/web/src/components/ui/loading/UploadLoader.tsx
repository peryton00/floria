import React from "react";
import { CheckCircle2, AlertCircle, UploadCloud } from "lucide-react";
import { Spinner } from "./Spinner";

export interface UploadLoaderProps {
  fileName?: string;
  fileSize?: string;
  progress?: number;
  status?: "uploading" | "success" | "error";
  errorMessage?: string;
  previewUrl?: string;
}

export function UploadLoader({
  fileName = "document.pdf",
  fileSize = "1.2 MB",
  progress = 0,
  status = "uploading",
  errorMessage,
  previewUrl,
}: UploadLoaderProps) {
  const isUploading = status === "uploading";
  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <div
      role="status"
      aria-label={`Upload status for ${fileName}`}
      className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs space-y-3 max-w-md w-full"
    >
      <div className="flex items-center gap-3">
        {previewUrl ? (
          <img src={previewUrl} alt={fileName} className="w-10 h-10 object-cover rounded-lg border border-stone-200" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
            <UploadCloud className="w-5 h-5" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-stone-900 truncate">{fileName}</p>
          <p className="text-[11px] text-stone-500">{fileSize}</p>
        </div>

        <div>
          {isUploading && (
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-forest-700">
              <Spinner size="xs" ariaHidden />
              {Math.min(100, Math.max(0, progress))}%
            </span>
          )}
          {isSuccess && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Done
            </span>
          )}
          {isError && (
            <span className="flex items-center gap-1 text-xs font-bold text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600" /> Failed
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-forest-700 transition-all duration-200 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {isError && errorMessage && (
        <p className="text-[11px] text-red-600 font-medium">{errorMessage}</p>
      )}
    </div>
  );
}
