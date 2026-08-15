"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { AlertIcon, StarIcon } from "@/components/ui/Icons";

export default function AdminReviewsPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Customer Feedback & Reviews</h1>
          <p className="text-xs text-ink-400 mt-0.5">Moderate product ratings, check customer testimonials, and review flagged feedback.</p>
        </div>

        {/* Not yet available notice */}
        <div className="bg-white rounded-xl border border-ink-100 p-8 shadow-xs max-w-2xl space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-warning-50 text-warning-700 flex items-center justify-center flex-shrink-0 animate-pulse">
              <StarIcon size={24} />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-lg font-bold text-ink-900 leading-tight">Module: Reviews & Ratings — Future Module Placeholder</h2>
              <p className="text-xs text-ink-500 leading-relaxed">
                The product feedback module is designed to list customer reviews, allow flagging/moderation of inappropriate comments, and display average ratings. However, the system is currently disabled because the database schema does not have the tables required to store user feedback.
              </p>
            </div>
          </div>

          <hr className="border-ink-100" />

          {/* Missing dependencies explanation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-700">Planned Database Schema Requirements</h3>
            <ul className="space-y-2.5 text-xs text-ink-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-ink-800">Reviews & Ratings Table:</span> A schema definition (e.g. `product_reviews`) mapping `id`, `product_id` (foreign key), `customer_id` (foreign key), `rating` (integer 1-5), `comment` (text), `is_visible` (boolean default true), and `created_at` timestamp.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-ink-800">API Controller Endpoints:</span> Endpoints under `/api/v1/catalog/products/:id/reviews` (public read) and `/api/v1/admin/reviews` (for hiding/restoring/flagging comments).
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-ink-800">Fulfillment Verification Constraint:</span> A database check ensuring users can only submit a review for products they have successfully purchased and had delivered (derived from the `orders` and `order_items` tables).
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
