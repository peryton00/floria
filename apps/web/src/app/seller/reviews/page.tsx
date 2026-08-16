"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Flag } from "lucide-react";
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
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Customer Reviews</h1>
        <p className="text-xs text-ink-400 mt-0.5">Monitor client feedback, plant ratings, and product quality reviews left by customers.</p>
      </div>

      {/* Summary card */}
      {reviewCount > 0 && summary && (
        <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs flex gap-6 items-start">
          <div className="text-center shrink-0">
            <p className="font-serif text-4xl font-bold text-ink-900">{avgRating.toFixed(1)}</p>
            <StarRating rating={avgRating} size="md" />
            <p className="text-[11px] text-ink-400 mt-1">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex-1 space-y-1.5 pt-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = (summary as any)[`star_${star}_count`] as number ?? 0;
              const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-[11px] text-ink-500 w-2">{star}</span>
                  <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] text-ink-400 w-5 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews table / empty state */}
      {loading ? (
        <div className="py-12 text-center text-xs text-ink-400">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-100 p-12 text-center shadow-xs max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-cream-100 text-forest-700 flex items-center justify-center mx-auto">
            <MessageSquare size={24} />
          </div>
          <h2 className="font-serif text-lg font-bold text-ink-900">No Reviews Yet</h2>
          <p className="text-xs text-ink-500 max-w-sm mx-auto leading-relaxed">
            Customer ratings and quality reviews will populate here once clients submit feedback for purchases made from your nursery.
          </p>
          <div className="pt-2 flex justify-center gap-1 text-warning-400">
            {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-100 shadow-xs divide-y divide-ink-50">
          {reviews.map((rev) => {
            const product = Array.isArray(rev.product) ? rev.product[0] : rev.product;
            const customer = Array.isArray(rev.customer) ? rev.customer[0] : rev.customer;
            return (
              <div key={rev.id} className="p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-ink-900">{maskName(customer?.full_name)}</p>
                    <StarRating rating={rev.rating} size="sm" />
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-[10px] text-ink-400">
                      {new Date(rev.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {product && (
                      <p className="text-[10px] text-forest-700 font-semibold truncate max-w-[140px]">
                        {product.name}
                      </p>
                    )}
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      rev.status === "approved" ? "bg-forest-50 text-forest-700" :
                      rev.status === "flagged"  ? "bg-warning-50 text-warning-700" :
                      "bg-ink-50 text-ink-500"
                    }`}>
                      {rev.status}
                    </span>
                  </div>
                </div>

                {rev.title && <p className="text-xs font-semibold text-ink-800">{rev.title}</p>}
                {rev.body && <p className="text-xs text-ink-500 leading-relaxed line-clamp-3">{rev.body}</p>}

                {rev.status === "approved" && (
                  <button
                    onClick={() => handleFlag(rev.id)}
                    disabled={flagging === rev.id}
                    className="inline-flex items-center gap-1.5 text-[10px] text-ink-400 hover:text-warning-600 transition-colors disabled:opacity-50"
                  >
                    <Flag size={11} />
                    {flagging === rev.id ? "Flagging…" : "Flag for review"}
                  </button>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded border border-ink-200 disabled:opacity-40 hover:bg-ink-50"
              >
                ‹ Prev
              </button>
              <span className="text-xs text-ink-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded border border-ink-200 disabled:opacity-40 hover:bg-ink-50"
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
