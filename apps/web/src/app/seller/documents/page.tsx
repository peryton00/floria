"use client";

import { useState, useEffect, useCallback } from "react";
import { useSeller } from "@/lib/contexts/SellerContext";
import { api, type SellerDocument } from "@/lib/api";
import { FileText, ShieldCheck, CheckCircle, Clock, AlertTriangle, Upload, Loader2 } from "lucide-react";

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
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-ui">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">Verification Documents</h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">Manage business registration certificates, botanical trade licenses, and nursery verification files.</p>
      </div>

      {/* Verification Status Banner */}
      <div className="bg-gradient-to-br from-[#183023] via-[#1E3A2B] to-[#254A37] text-white rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm border border-forest-700/50">
        <div className="flex gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white/15 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-white">
              Nursery Account Status: {sellerProfile?.status ? sellerProfile.status.toUpperCase() : "PENDING"}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed mt-1">
              {sellerProfile?.status === "approved"
                ? "Your business onboarding credentials have been verified by Floria Administration. Your catalog is fully live for marketplace checkout."
                : "Upload your business registration documents for compliance verification by the Floria horticultural team."}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <section className="bg-floria-linen rounded-3xl border border-floria-border p-6 sm:p-7 shadow-xs space-y-5">
        <h2 className="font-serif text-base sm:text-lg font-bold text-ink-900 border-b border-floria-border pb-3.5 flex items-center gap-2">
          <Upload size={18} className="text-forest-800" /> Upload Verification Document
        </h2>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 shadow-2xs">
            {error}
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3.5 bg-forest-50 border border-forest-200 rounded-2xl text-xs text-forest-800 font-bold shadow-2xs">
            ✓ Document submitted successfully for administration review!
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1.5">Document Type *</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900"
              >
                <option value="gstin">GSTIN Certificate</option>
                <option value="business_license">Nursery Business License</option>
                <option value="pan_card">PAN Card / Identity Proof</option>
                <option value="trade_license">Municipal Trade License</option>
                <option value="other">Other Business Document</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1.5">Document Title *</label>
              <input
                type="text"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. GSTIN_Raipur_Branch.pdf"
                className="w-full px-3.5 py-2.5 rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900 placeholder:text-ink-400"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1.5">Document URL / Storage Link *</label>
            <input
              type="text"
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://... or secure storage link"
              className="w-full px-3.5 py-2.5 rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900 placeholder:text-ink-400"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUploading}
              style={{ color: "#ffffff" }}
              className="px-6 py-3 bg-forest-800 hover:bg-forest-900 !text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs hover:shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : "Submit Document"}
            </button>
          </div>
        </form>
      </section>

      {/* Document List */}
      <section className="bg-floria-linen rounded-3xl border border-floria-border p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-base sm:text-lg font-bold text-ink-900 border-b border-floria-border pb-3.5">Uploaded Verification Credentials</h2>

        {loading ? (
          <div className="py-8 flex justify-center text-forest-800">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center text-xs font-medium text-ink-500 bg-floria-soft-sand rounded-2xl border border-floria-border">
            No verification documents uploaded yet. Submit your GSTIN or business license above.
          </div>
        ) : (
          <div className="divide-y divide-floria-border">
            {documents.map((doc) => (
              <div key={doc.id} className="py-4 flex justify-between items-center text-xs">
                <div className="flex gap-3.5 items-center">
                  <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center flex-shrink-0 border border-forest-200/70 shadow-2xs">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-ink-900 text-xs sm:text-sm">{doc.file_name}</p>
                    <p className="text-[10px] text-ink-400 mt-0.5 font-mono">
                      {doc.document_type.toUpperCase()} • {doc.mime_type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-ink-400 font-mono">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
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
