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
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Verification Documents</h1>
        <p className="text-xs text-ink-400 mt-0.5">Manage business registration certificates, trade licenses, and nursery verification files.</p>
      </div>

      {/* Verification Status Banner */}
      <div className="bg-forest-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div className="flex gap-3">
          <ShieldCheck className="text-forest-200 flex-shrink-0 mt-1" size={24} />
          <div>
            <h2 className="font-serif text-base font-bold text-white">
              Nursery Account Status: {sellerProfile?.status ? sellerProfile.status.toUpperCase() : "PENDING"}
            </h2>
            <p className="text-xs text-cream-100/80 leading-relaxed mt-1">
              {sellerProfile?.status === "approved"
                ? "Your business onboarding credentials have been verified by Floria Administration. Your catalog is fully live for checkout."
                : "Upload your business registration documents for Floria compliance verification."}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <section className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-4">
        <h2 className="font-serif text-base font-bold text-ink-900 border-b border-ink-100 pb-3 flex items-center gap-2">
          <Upload size={18} className="text-forest-700" /> Upload New Document
        </h2>

        {error && (
          <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-xs text-error-700">
            {error}
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 bg-success-50 border border-success-100 rounded-xl text-xs text-success-700 font-medium">
            Document submitted successfully for administration review!
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1">Document Type *</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
              >
                <option value="gstin">GSTIN Certificate</option>
                <option value="business_license">Nursery Business License</option>
                <option value="pan_card">PAN Card / Identity Proof</option>
                <option value="trade_license">Municipal Trade License</option>
                <option value="other">Other Business Document</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1">Document Title *</label>
              <input
                type="text"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. GSTIN_Raipur_Branch.pdf"
                className="w-full px-3 py-2.5 rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1">Document URL / Storage Link *</label>
            <input
              type="text"
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://... or storage link"
              className="w-full px-3 py-2.5 rounded-xl border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 bg-forest-900 hover:bg-forest-800 text-white rounded-xl font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : "Submit Document"}
            </button>
          </div>
        </form>
      </section>

      {/* Document List */}
      <section className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-4">
        <h2 className="font-serif text-base font-bold text-ink-900 border-b border-ink-100 pb-3">Uploaded Verification Credentials</h2>

        {loading ? (
          <div className="py-8 flex justify-center text-ink-400">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-400">
            No verification documents uploaded yet. Submit your GSTIN or business license above.
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {documents.map((doc) => (
              <div key={doc.id} className="py-4 flex justify-between items-center text-xs">
                <div className="flex gap-3 items-center">
                  <div className="w-9 h-9 rounded-lg bg-cream-50 text-forest-700 flex items-center justify-center flex-shrink-0 border border-ink-100">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-ink-900">{doc.file_name}</p>
                    <p className="text-[10px] text-ink-400 mt-0.5">
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
