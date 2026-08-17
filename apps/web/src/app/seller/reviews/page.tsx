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
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-ui">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">Customer Reviews</h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">Monitor buyer feedback, plant condition ratings, and botanical quality reviews.</p>
      </div>

      {/* Summary card */}
      {reviewCount > 0 && summary && (
        <div className="bg-floria-linen rounded-3xl border border-floria-border p-6 shadow-xs flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="text-center shrink-0 w-full sm:w-auto p-4 bg-floria-soft-sand rounded-2xl border border-floria-border/70">
            <p className="font-serif text-4xl sm:text-5xl font-bold text-ink-900">{avgRating.toFixed(1)}</p>
            <div className="flex justify-center my-1.5">
              <StarRating rating={avgRating} size="md" />
            </div>
            <p className="text-xs text-ink-500 font-medium">{reviewCount} verified review{reviewCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex-1 w-full space-y-2 pt-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = (summary as any)[`star_${star}_count`] as number ?? 0;
              const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs text-ink-600 font-bold w-3">{star}★</span>
                  <div className="flex-1 h-2.5 bg-floria-sand rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-ink-400 font-mono w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews table / empty state */}
      {loading ? (
        <div className="py-12 text-center text-xs text-ink-400">Loading verified customer reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="bg-floria-linen rounded-3xl border border-floria-border p-12 text-center shadow-xs max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest-800 border border-forest-200/70 flex items-center justify-center mx-auto shadow-2xs">
            <MessageSquare size={24} />
          </div>
          <h2 className="font-serif text-xl font-bold text-ink-900">No Reviews Recorded Yet</h2>
          <p className="text-xs sm:text-sm text-ink-500 max-w-sm mx-auto leading-relaxed">
            Customer ratings and botanical quality reviews will automatically populate here once clients receive plant deliveries from your nursery.
          </p>
          <div className="pt-2 flex justify-center gap-1.5 text-amber-400">
            {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
          </div>
        </div>
      ) : (
        <div className="bg-floria-linen rounded-3xl border border-floria-border shadow-xs divide-y divide-floria-border overflow-hidden">
          {reviews.map((rev) => {
            const product = Array.isArray(rev.product) ? rev.product[0] : rev.product;
            const customer = Array.isArray(rev.customer) ? rev.customer[0] : rev.customer;
            return (
              <div key={rev.id} className="p-5 space-y-2 hover:bg-floria-soft-sand/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-ink-900">{maskName(customer?.full_name)}</p>
                    <StarRating rating={rev.rating} size="sm" />
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-[10px] text-ink-400 font-mono">
                      {new Date(rev.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {product && (
                      <p className="text-xs text-forest-800 font-bold truncate max-w-[160px]">
                        {product.name}
                      </p>
                    )}
                    <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      rev.status === "approved" ? "bg-forest-50 text-forest-800 border border-forest-200" :
                      rev.status === "flagged"  ? "bg-amber-50 text-amber-800 border border-amber-200" :
                      "bg-floria-sand text-ink-600 border border-floria-border"
                    }`}>
                      {rev.status}
                    </span>
                  </div>
                </div>

                {rev.title && <p className="text-xs sm:text-sm font-bold text-ink-900">{rev.title}</p>}
                {rev.body && <p className="text-xs sm:text-sm text-ink-600 leading-relaxed line-clamp-3">{rev.body}</p>}

                {rev.status === "approved" && (
                  <div className="pt-1">
                    <button
                      onClick={() => handleFlag(rev.id)}
                      disabled={flagging === rev.id}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-400 hover:text-amber-800 transition-colors disabled:opacity-50"
                    >
                      <Flag size={12} />
                      {flagging === rev.id ? "Flagging review…" : "Flag for moderation review"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 flex items-center justify-center gap-3 bg-floria-soft-sand border-t border-floria-border">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-floria-border bg-floria-linen font-bold text-ink-700 disabled:opacity-40 hover:bg-floria-sand transition-colors"
              >
                ‹ Prev
              </button>
              <span className="text-xs font-semibold text-ink-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-floria-border bg-floria-linen font-bold text-ink-700 disabled:opacity-40 hover:bg-floria-sand transition-colors"
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
