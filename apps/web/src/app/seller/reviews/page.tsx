"use client";

import { Star, MessageSquare } from "lucide-react";

export default function SellerReviewsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Customer Reviews</h1>
        <p className="text-xs text-ink-400 mt-0.5">Monitor client feedback, plant ratings, and product quality reviews left by customers.</p>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 p-12 text-center shadow-xs max-w-lg mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-cream-100 text-forest-700 flex items-center justify-center mx-auto">
          <MessageSquare size={24} />
        </div>
        
        <h2 className="font-serif text-lg font-bold text-ink-900">No Reviews Recorded Yet</h2>
        <p className="text-xs text-ink-500 max-w-sm mx-auto leading-relaxed">
          Customer ratings and quality reviews will populate here once clients submit feedback for purchases made from your nursery.
        </p>

        <div className="pt-2 flex justify-center gap-1 text-warning-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={18} fill="currentColor" />
          ))}
        </div>
      </div>
    </div>
  );
}
