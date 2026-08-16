"use client";

import { useState, useCallback } from "react";
import { StarRating } from "@/components/ui/StarRating";
import type { ProductReview, ReviewSummary } from "@/lib/api";
import { ThumbsUp, ShieldCheck } from "lucide-react";

interface ReviewListProps {
  reviews: ProductReview[];
  total: number;
  summary: ReviewSummary | null | undefined;
  productId: string;
  page: number;
  onPageChange: (page: number) => void;
}

const PAGE_SIZE = 10;

export function ReviewList({ reviews, total, summary, productId, page, onPageChange }: ReviewListProps) {
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});

  const handleHelpful = useCallback(async (reviewId: string) => {
    try {
      await fetch(`/api/v1/catalog/products/${productId}/reviews/${reviewId}/helpful`, {
        method: "POST",
        credentials: "include",
      });
      setHelpfulVotes((v) => ({ ...v, [reviewId]: !v[reviewId] }));
    } catch { /* silent */ }
  }, [productId]);

  if (!reviews.length && !summary?.review_count) {
    return (
      <p className="text-xs text-ink-400 py-4">
        No reviews yet. Be the first to review this product!
      </p>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Masked customer name: "Rahul S."
  function maskName(fullName: string | null | undefined): string {
    if (!fullName) return "Customer";
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0] ?? "Customer";
    return `${parts[0] ?? ""} ${(parts[parts.length - 1] ?? "")?.[0] ?? ""}.`;
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {summary && summary.review_count > 0 && (
        <div className="flex items-center gap-4 p-3 bg-cream-50 rounded-xl border border-ink-100">
          <div className="text-center shrink-0">
            <p className="font-serif text-3xl font-bold text-ink-900">
              {summary.avg_rating.toFixed(1)}
            </p>
            <StarRating rating={summary.avg_rating} size="sm" />
            <p className="text-[10px] text-ink-400 mt-0.5">{summary.review_count} reviews</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary[`star_${star}_count` as keyof ReviewSummary] as number;
              const pct = summary.review_count > 0 ? (count / summary.review_count) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-[10px] text-ink-500 w-2 shrink-0">{star}</span>
                  <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-ink-400 w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review list */}
      <div className="divide-y divide-ink-100">
        {reviews.map((rev) => (
          <div key={rev.id} className="py-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink-900">
                    {maskName(rev.customer?.full_name)}
                  </span>
                  {rev.is_verified_purchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-forest-700 font-semibold">
                      <ShieldCheck size={10} />
                      Verified Purchase
                    </span>
                  )}
                </div>
                <StarRating rating={rev.rating} size="sm" />
              </div>
              <span className="text-[10px] text-ink-300 shrink-0">
                {new Date(rev.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>

            {rev.title && (
              <p className="text-xs font-semibold text-ink-800">{rev.title}</p>
            )}
            {rev.body && (
              <p className="text-xs text-ink-500 leading-relaxed">{rev.body}</p>
            )}

            {/* Seller reply */}
            {rev.seller_reply && (
              <div className="mt-2 pl-3 border-l-2 border-forest-200 bg-forest-50/50 rounded-r-lg p-2 space-y-0.5">
                <p className="text-[10px] font-bold text-forest-700 uppercase tracking-wide">Nursery Reply</p>
                <p className="text-xs text-ink-600">{rev.seller_reply}</p>
              </div>
            )}

            {/* Helpful */}
            <button
              onClick={() => handleHelpful(rev.id)}
              className="inline-flex items-center gap-1.5 text-[10px] text-ink-400 hover:text-forest-700 transition-colors"
              aria-label="Mark review as helpful"
            >
              <ThumbsUp size={11} className={helpfulVotes[rev.id] ? "text-forest-700" : ""} />
              Helpful ({rev.helpful_count + (helpfulVotes[rev.id] ? 1 : 0)})
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 text-xs rounded border border-ink-200 disabled:opacity-40 hover:bg-ink-50 transition-colors"
          >
            ‹ Prev
          </button>
          <span className="text-xs text-ink-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 text-xs rounded border border-ink-200 disabled:opacity-40 hover:bg-ink-50 transition-colors"
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
