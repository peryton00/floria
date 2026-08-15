"use client";

import { useSeller } from "@/lib/contexts/SellerContext";
import { FileText, ShieldCheck, Clock, CheckCircle } from "lucide-react";

export default function SellerDocumentsPage() {
  const { sellerProfile } = useSeller();

  const mockDocuments = [
    { name: "GSTIN Certificate", type: "PDF Document", size: "1.2 MB", status: "Approved", date: "Aug 12, 2026" },
    { name: "Nursery Business License", type: "PDF Document", size: "840 KB", status: "Approved", date: "Aug 12, 2026" },
    { name: "PAN Card / Identity Proof", type: "JPEG Image", size: "2.1 MB", status: "Approved", date: "Aug 12, 2026" }
  ];

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
            <h2 className="font-serif text-base font-bold text-white">Nursery Account Status: Approved</h2>
            <p className="text-xs text-cream-100/80 leading-relaxed mt-1">
              Your business onboarding credentials have been verified by Floria Administration. Your catalog is fully live for checkout.
            </p>
          </div>
        </div>
      </div>

      {/* Document list */}
      <section className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs space-y-4">
        <h2 className="font-serif text-base font-bold text-ink-900 border-b border-ink-100 pb-3">Uploaded Verification Credentials</h2>

        <div className="divide-y divide-ink-100">
          {mockDocuments.map((doc, idx) => (
            <div key={idx} className="py-4 flex justify-between items-center text-xs">
              <div className="flex gap-3 items-center">
                <div className="w-9 h-9 rounded-lg bg-cream-50 text-forest-700 flex items-center justify-center flex-shrink-0 border border-ink-100">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="font-bold text-ink-900">{doc.name}</p>
                  <p className="text-[10px] text-ink-400 mt-0.5">{doc.type} • {doc.size}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-ink-400 font-mono">Approved {doc.date}</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-success-50 text-success-700 border border-success-100">
                  <CheckCircle size={10} /> Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
