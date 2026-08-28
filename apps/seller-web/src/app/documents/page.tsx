"use client";

import { useState, useEffect, useCallback } from "react";
import { useSeller } from "@/lib/contexts/SellerContext";
import { api, type SellerDocument } from "@/lib/api";
import { FileText, ShieldCheck, CheckCircle, Clock, AlertTriangle, Upload, Loader2 } from "lucide-react";
import { MediaUploader } from "@/components/media/MediaUploader";

export default function SellerDocumentsPage() {
  const { sellerProfile } = useSeller();
  const [documents, setDocuments] = useState<SellerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload Form State
  const [documentType, setDocumentType] = useState("gstin");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSellerDocuments();
      if (res.success && res.data) {
        setDocuments(res.data);
      } else {
        setError(res.error?.message || "Failed to load verification documents.");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!fileName.trim() || !fileUrl.trim()) return;

    try {
      setIsUploading(true);
      setError(null);
      setUploadSuccess(false);

      const res = await api.uploadSellerDocument({
        documentType,
        fileName: fileName.trim(),
        fileUrl: fileUrl.trim(),
        fileSize: 1024 * 500, // 500 KB default metadata
        mimeType: fileUrl.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
      });

      if (res.success && res.data) {
        setUploadSuccess(true);
        setFileName("");
        setFileUrl("");
        fetchDocuments();
      } else {
        setError(res.error?.message || "Failed to upload document.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-success-50 text-success-700 border border-success-100">
            <CheckCircle size={10} /> Verified
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
            <Clock size={10} /> Under Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-error-50 text-error-700 border border-error-100">
            <AlertTriangle size={10} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-ink-100 text-ink-700 border border-ink-200">
            <Clock size={10} /> Pending Verification
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Compliance &amp; Verification Documents</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Manage business registration certificates, botanical trade licenses, and nursery verification files.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-1">
            Status: {sellerProfile?.status ? sellerProfile.status.toUpperCase() : "PENDING"}
          </span>
        </div>
      </div>

      {/* Verification Status Banner */}
      <div className="bg-white rounded border border-[#E2E8F0] p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div className="flex gap-3.5 items-start">
          <div className="w-9 h-9 rounded bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="font-sans font-bold text-sm text-[#0F172A]">
              Nursery Account Verification Status: {sellerProfile?.status ? sellerProfile.status.toUpperCase() : "PENDING"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              {sellerProfile?.status === "approved"
                ? "Your business onboarding credentials have been verified by Floria Administration. Your catalog is fully live for marketplace checkout."
                : "Upload your business registration documents for compliance verification by the Floria horticultural team."}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <section className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs space-y-4">
        <h2 className="font-sans text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 flex items-center gap-2">
          <Upload size={16} className="text-[#1B4D3E]" /> Upload Verification Document
        </h2>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs font-bold text-emerald-800">
            ✓ Document submitted successfully for administration review!
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">Document Type *</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
            >
              <option value="gstin">GSTIN Certificate</option>
              <option value="business_license">Nursery Business License</option>
              <option value="pan_card">PAN Card / Identity Proof</option>
              <option value="trade_license">Municipal Trade License</option>
              <option value="other">Other Business Document</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Upload Verification PDF / Image File *
            </label>
            <MediaUploader
              profile="DOCUMENT"
              accept="application/pdf,image/jpeg,image/png"
              maxSizeBytes={15 * 1024 * 1024}
              onUploadSuccess={async (res) => {
                try {
                  setIsUploading(true);
                  setError(null);
                  setUploadSuccess(false);

                  const attachRes = await api.attachSellerDocument(
                    documentType,
                    res.assetId
                  );

                  if (attachRes.success) {
                    setUploadSuccess(true);
                    fetchDocuments();
                  } else {
                    setError(attachRes.error?.message || "Failed to record seller document");
                  }
                } catch (err: any) {
                  setError(err.message || "Failed to record seller document");
                } finally {
                  setIsUploading(false);
                }
              }}
              label="Upload Document File (PDF / Image)"
            />
          </div>
        </div>
      </section>

      {/* Document List */}
      <section className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs space-y-4">
        <h2 className="font-sans text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">Uploaded Verification Credentials</h2>

        {loading ? (
          <div className="py-8 flex justify-center text-[#1B4D3E]">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-500 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
            No verification documents uploaded yet. Submit your GSTIN or business license above.
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {documents.map((doc) => (
              <div key={doc.id} className="py-3.5 flex justify-between items-center text-xs hover:bg-slate-50/80 transition-colors">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="w-8 h-8 rounded bg-forest-50 text-forest-700 flex items-center justify-center flex-shrink-0 border border-forest-100 shadow-xs">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#0F172A] truncate">{doc.file_name || doc.document_type.toUpperCase()}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {doc.document_type.toUpperCase()} • {doc.mime_type || "PDF/Image"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const linkRes = await api.getSignedDocumentUrl(doc.id);
                        if (linkRes.success && linkRes.data?.signedUrl) {
                          window.open(linkRes.data.signedUrl, "_blank");
                        } else {
                          alert("Failed to generate private document download URL");
                        }
                      } catch (e: any) {
                        alert(e.message || "Failed to fetch private document link");
                      }
                    }}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-mono font-bold text-[10px] text-slate-800 border border-slate-300 transition-colors flex items-center gap-1"
                  >
                    <Upload size={10} className="rotate-180" /> Secure Download
                  </button>
                  {getStatusBadge(doc.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

