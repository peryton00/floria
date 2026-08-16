"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StarIcon } from "@/components/ui/Icons";
import { StarRating } from "@/components/ui/StarRating";
import { api, type ProductReview } from "@/lib/api";
import { useToast } from "@/lib/contexts/ToastContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useOrders } from "@/lib/contexts/OrderContext";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const { toast } = useToast();
  const { orders } = useOrders();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [checking, setChecking] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [userReview, setUserReview] = useState<ProductReview | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkEligibility() {
      setChecking(true);

      // Check local order state first
      const hasLocalDeliveredOrder = orders.some(
        (o) =>
          ["delivered", "picked_up", "order placed", "nursery confirmed", "preparing", "ready for pickup", "out for delivery"].includes(
            (o.status || "").toLowerCase()
          ) &&
          o.nurseryGroups.some((g) =>
            g.items.some(
              (i) => i.product?.id === productId || i.product?.slug === productId
            )
          )
      );

      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (isMounted) {
            setIsEligible(hasLocalDeliveredOrder);
            setChecking(false);
          }
          return;
        }

        const res = await api.getReviewEligibility(productId);
        if (isMounted) {
          if (res.data?.userReview) {
            setUserReview(res.data.userReview);
            setIsEligible(false);
          } else if (res.success && res.data?.canReview) {
            setIsEligible(true);
          } else {
            setIsEligible(hasLocalDeliveredOrder);
          }
          setChecking(false);
        }
      } catch {
        if (isMounted) {
          setIsEligible(hasLocalDeliveredOrder);
          setChecking(false);
        }
      }
    }

    checkEligibility();

    return () => {
      isMounted = false;
    };
  }, [productId, orders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.submitReview(productId, {
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      });

      if (!res.success) {
        if (res.error?.code === "ALREADY_REVIEWED") {
          setError("You have already reviewed this product.");
        } else if (res.error?.code === "NOT_ELIGIBLE") {
          setError("You can only review products you have purchased and received.");
        } else {
          setError(res.error?.message ?? "Something went wrong. Please try again.");
        }
        return;
      }

      setSubmitted(true);
      setUserReview({
        id: res.data?.id || "new",
        product_id: productId,
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        is_verified_purchase: true,
        helpful_count: 0,
        created_at: new Date().toISOString(),
      });
      toast.success(
        "Review submitted",
        "Thank you for your feedback! Your review will appear after moderation."
      );
      onSuccess?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // While checking eligibility, do not render to avoid layout flicker
  if (checking) {
    return null;
  }

  // Read-only card showing the user's submitted rating & review on product page (NO edit button here)
  if (userReview || submitted) {
    const rev = userReview || { rating, title, body };
    return (
      <div className="rounded-xl bg-cream-50/80 border border-ink-100 p-4 space-y-2 font-ui">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-forest-800 uppercase tracking-wider">
            Your Rating for this Product
          </span>
          <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
            Verified Purchase
          </span>
        </div>

        <div className="flex items-center gap-2">
          <StarRating rating={rev.rating || rating} size="sm" />
          <span className="text-xs font-bold text-ink-900">{rev.rating || rating} out of 5 stars</span>
        </div>

        {rev.title && <p className="text-xs font-bold text-ink-900">{rev.title}</p>}
        {rev.body && <p className="text-xs text-ink-600 leading-relaxed">{rev.body}</p>}

        <p className="text-[11px] text-ink-400 pt-1">
          To edit your review, please visit your{" "}
          <Link href="/account" className="text-forest-700 font-semibold underline hover:text-forest-900">
            Account Dashboard
          </Link>.
        </p>
      </div>
    );
  }

  // If user has NOT purchased and received the product, do NOT show the review form block
  if (!isEligible) {
    return (
      <div className="rounded-xl bg-cream-50/70 border border-ink-100 p-3.5 text-center text-xs text-ink-500 font-ui space-y-0.5">
        <p className="font-semibold text-ink-700">Verified Customer Reviews Only</p>
        <p className="text-ink-400">You can only review products you have purchased and received.</p>
      </div>
    );
  }

  // Render review form block ONLY for verified buyers who received the item and haven't reviewed it yet
  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-cream-50 rounded-xl border border-ink-100 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-600">Write a Review</p>

      {/* Star rating picker */}
      <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 rounded"
          >
            <StarIcon
              size={24}
              className={
                star <= (hovered || rating)
                  ? "text-amber-400 fill-amber-400"
                  : "text-ink-200"
              }
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-xs text-ink-500 self-center font-ui">
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
          </span>
        )}
      </div>

      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        className="w-full px-3 py-2 text-sm rounded-lg border border-ink-200 bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 text-ink-900 placeholder:text-ink-300 font-ui"
      />

      <textarea
        placeholder="Share your experience... (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={3}
        className="w-full px-3 py-2 text-sm rounded-lg border border-ink-200 bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 text-ink-900 placeholder:text-ink-300 resize-none font-ui"
      />

      {error && <p className="text-xs text-red-600 font-ui">{error}</p>}

      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="px-4 py-2 text-xs font-bold rounded-lg bg-forest-700 text-white hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
