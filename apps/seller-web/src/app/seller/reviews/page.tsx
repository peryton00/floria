"use client";

import { useState, useEffect } from "react";
import { FloriaIcon } from "@floria/icons";
import { api } from "@/lib/api";
import { StarRating } from "@/components/ui/StarRating";
import type { ProductReview, ReviewSummary } from "@/lib/api";

export default function SellerReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [flagging, setFlagging] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getSellerReviews({ page })
      .then((res) => {
        if (res.success && res.data) {
          setReviews(res.data.reviews);
          setTotal(res.data.total);
          if (res.data.summary) setSummary(res.data.summary);
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  const handleFlag = async (reviewId: string) => {
    setFlagging(reviewId);
    await api.flagReview(reviewId);
    setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, status: "flagged" as const } : r));
    setFlagging(null);
  };

  const avgRating = summary?.avg_rating ?? 0;
  const reviewCount = summary?.review_count ?? total;

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  function maskName(name: string | null | undefined) {
    if (!name) return "Customer";
    const parts = name.trim().split(" ");
    return parts.length === 1 ? (parts[0] ?? "Customer") : `${parts[0] ?? ""} ${(parts[parts.length - 1] ?? "")?.[0] ?? ""}.`;
  }

  return (
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Customer Reviews &amp; Ratings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Monitor buyer feedback, plant condition ratings, and botanical quality reviews.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-1">
            {reviewCount} Verified Reviews
          </span>
        </div>
      </div>

      {/* Summary card */}
      {reviewCount > 0 && summary && (
        <div className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="text-center shrink-0 w-full sm:w-auto p-4 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
            <p className="font-mono text-4xl font-bold text-[#0F172A]">{avgRating.toFixed(1)}</p>
            <div className="flex justify-center my-1.5">
              <StarRating rating={avgRating} size="md" />
            </div>
            <p className="text-xs text-slate-500 font-medium">{reviewCount} verified review{reviewCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex-1 w-full space-y-2 pt-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = (summary as any)[`star_${star}_count`] as number ?? 0;
              const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 font-bold w-3">{star}★</span>
                  <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 font-mono w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews table / empty state */}
      {loading ? (
        <div className="py-12 text-center text-xs font-semibold text-slate-500">Loading verified customer reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded border border-[#E2E8F0] p-12 text-center shadow-xs max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center mx-auto shadow-xs">
            <FloriaIcon name="chat" size={20} />
          </div>
          <h2 className="font-sans text-base font-bold text-[#0F172A]">No Reviews Recorded Yet</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Customer ratings and botanical quality reviews will automatically populate here once clients receive plant deliveries from your nursery.
          </p>
          <div className="pt-2 flex justify-center gap-1.5 text-amber-400">
            {[...Array(5)].map((_, i) => <FloriaIcon key={i} name="star_fill" size={16} />)}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded border border-[#E2E8F0] shadow-xs divide-y divide-[#E2E8F0] overflow-hidden">
          {reviews.map((rev) => {
            const product = Array.isArray(rev.product) ? rev.product[0] : rev.product;
            const customer = Array.isArray(rev.customer) ? rev.customer[0] : rev.customer;
            return (
              <div key={rev.id} className="p-5 space-y-2 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-[#0F172A]">{maskName(customer?.full_name)}</p>
                    <StarRating rating={rev.rating} size="sm" />
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-[10px] text-slate-400 font-mono">
                      {new Date(rev.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {product && (
                      <p className="text-xs text-[#1B4D3E] font-bold truncate max-w-[160px]">
                        {product.name}
                      </p>
                    )}
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider border ${
                      rev.status === "approved" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                      rev.status === "flagged"  ? "bg-amber-50 text-amber-800 border-amber-200" :
                      "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {rev.status}
                    </span>
                  </div>
                </div>

                {rev.title && <p className="text-xs sm:text-sm font-bold text-[#0F172A]">{rev.title}</p>}
                {rev.body && <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{rev.body}</p>}

                {rev.status === "approved" && (
                  <div className="pt-1">
                    <button
                      onClick={() => handleFlag(rev.id)}
                      disabled={flagging === rev.id}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-amber-700 transition-colors disabled:opacity-50"
                    >
                      <FloriaIcon name="flag" size={12} />
                      {flagging === rev.id ? "Flagging review…" : "Flag for moderation review"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 flex items-center justify-center gap-3 bg-[#F8FAFC] border-t border-[#E2E8F0]">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded border border-[#E2E8F0] bg-white font-bold text-slate-700 disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors"
              >
                ‹ Prev
              </button>
              <span className="text-xs font-semibold text-slate-600 font-mono">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded border border-[#E2E8F0] bg-white font-bold text-slate-700 disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
