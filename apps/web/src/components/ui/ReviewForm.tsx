"use client";

import { useState } from "react";
import { StarIcon } from "@/components/ui/Icons";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating."); return; }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/catalog/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title: title.trim() || undefined, body: body.trim() || undefined }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error?.code === "ALREADY_REVIEWED") setError("You have already reviewed this product.");
        else if (json.error?.code === "NOT_ELIGIBLE") setError("You can only review products you have purchased and received.");
        else setError(json.error?.message ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
      onSuccess?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl bg-forest-50 border border-forest-200 p-4 text-center space-y-1">
        <p className="text-sm font-semibold text-forest-800">Review submitted!</p>
        <p className="text-xs text-forest-600">Thank you. Your review will appear after moderation.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-cream-50 rounded-xl border border-ink-100 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-600">Write a Review</p>

      {/* Star picker */}
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
          <span className="ml-2 text-xs text-ink-500 self-center">
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
        className="w-full px-3 py-2 text-sm rounded-lg border border-ink-200 bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 text-ink-900 placeholder:text-ink-300"
      />

      <textarea
        placeholder="Share your experience... (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={3}
        className="w-full px-3 py-2 text-sm rounded-lg border border-ink-200 bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 text-ink-900 placeholder:text-ink-300 resize-none"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

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
