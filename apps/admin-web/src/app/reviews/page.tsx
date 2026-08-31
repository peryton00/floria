"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { StarRating } from "@/components/ui/StarRating";
import { api } from "@/lib/api";
import type { ProductReview } from "@/lib/api";
import { FloriaIcon } from "@floria/icons";

type FilterStatus = "all" | "pending" | "approved" | "rejected" | "flagged";

const STATUS_TABS: { id: FilterStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "flagged", label: "Flagged" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending:  "bg-warning-50 text-warning-700",
    approved: "bg-forest-50 text-forest-700",
    rejected: "bg-red-50 text-red-600",
    flagged:  "bg-orange-50 text-orange-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls[status] ?? "bg-ink-50 text-ink-500"}`}>
      {status}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [page, setPage] = useState(1);
  const [moderating, setModerating] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteTarget, setNoteTarget] = useState<{ id: string; action: "approve" | "reject" | "hide" } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.adminGetReviews({
      status: filter === "all" ? undefined : filter,
      page,
      pageSize: 30,
    }).then((res) => {
      if (res.success && res.data) {
        setReviews(res.data.reviews);
        setTotal(res.data.total);
      }
    }).finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filter]);

  const moderate = async (reviewId: string, action: "approve" | "reject" | "hide", n?: string) => {
    setModerating(reviewId);
    const res = await api.adminModerateReview(reviewId, action, n);
    if (res.success) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setTotal((t) => t - 1);
    }
    setModerating(null);
    setNoteTarget(null);
    setNote("");
  };

  const pageSize = 30;
  const totalPages = Math.ceil(total / pageSize);

  function maskName(name: string | null | undefined) {
    if (!name) return "Customer";
    const parts = name.trim().split(" ");
    return parts.length === 1 ? (parts[0] ?? "Customer") : `${parts[0] ?? ""} ${(parts[parts.length - 1] ?? "")?.[0] ?? ""}.`;
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Customer Feedback & Reviews</h1>
          <p className="text-xs text-ink-400 mt-0.5">Moderate product ratings, approve customer testimonials, and manage flagged feedback.</p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 border-b border-ink-100 overflow-x-auto pb-px">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={[
                "px-4 py-2 text-xs font-semibold whitespace-nowrap relative transition-colors",
                filter === tab.id ? "text-forest-700" : "text-ink-400 hover:text-ink-800",
              ].join(" ")}
            >
              {tab.label}
              {filter === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest-700" />
              )}
            </button>
          ))}
        </div>

        {/* Review list */}
        {loading ? (
          <div className="py-12 text-center text-xs text-ink-400">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-ink-100 p-12 text-center shadow-xs space-y-3 max-w-md">
            <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
              <FloriaIcon name="star" size={24} />
            </div>
            <p className="font-serif text-lg font-bold text-ink-900">No {filter === "all" ? "" : filter} reviews</p>
            <p className="text-xs text-ink-500">
              {filter === "pending" ? "All caught up — no reviews awaiting moderation." : `No ${filter} reviews to show.`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-ink-100 shadow-xs divide-y divide-ink-50">
            {reviews.map((rev) => {
              const product = Array.isArray(rev.product) ? rev.product[0] : rev.product;
              const customer = Array.isArray(rev.customer) ? rev.customer[0] : rev.customer;
              return (
                <div key={rev.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    {/* Left: reviewer + rating */}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-ink-900">{maskName(customer?.full_name)}</p>
                        {rev.is_verified_purchase && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-forest-700 font-semibold">
                            <FloriaIcon name="shield_check" size={10} /> Verified
                          </span>
                        )}
                      </div>
                      <StarRating rating={rev.rating} size="sm" />
                      {product && (
                        <p className="text-[10px] text-ink-400">
                          Product: <span className="text-ink-700 font-semibold">{product.name}</span>
                        </p>
                      )}
                    </div>

                    {/* Right: status + date */}
                    <div className="text-right space-y-1 shrink-0">
                      <StatusBadge status={rev.status ?? "pending"} />
                      <p className="text-[10px] text-ink-400">
                        {new Date(rev.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {(rev.reported_count ?? 0) > 0 && (
                        <p className="text-[10px] text-orange-600 flex items-center gap-1 justify-end">
                          <FloriaIcon name="flag" size={10} /> {rev.reported_count} flag{(rev.reported_count ?? 0) !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {rev.title && <p className="text-xs font-semibold text-ink-800">{rev.title}</p>}
                  {rev.body && <p className="text-xs text-ink-500 leading-relaxed">{rev.body}</p>}
                  {rev.moderation_note && (
                    <p className="text-[10px] text-ink-400 italic">Admin note: {rev.moderation_note}</p>
                  )}

                  {/* Action buttons — only for pending/flagged */}
                  {(rev.status === "pending" || rev.status === "flagged") && (
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <button
                        onClick={() => moderate(rev.id, "approve")}
                        disabled={moderating === rev.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-forest-50 text-forest-700 hover:bg-forest-100 disabled:opacity-50 transition-colors border border-forest-200"
                      >
                        <FloriaIcon name="check" size={12} /> Approve
                      </button>
                      <button
                        onClick={() => setNoteTarget({ id: rev.id, action: "reject" })}
                        disabled={moderating === rev.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors border border-red-200"
                      >
                        <FloriaIcon name="close" size={12} /> Reject
                      </button>
                    </div>
                  )}

                  {/* Reject note inline form */}
                  {noteTarget?.id === rev.id && (
                    <div className="mt-2 space-y-2 bg-red-50 border border-red-100 rounded-lg p-3">
                      <p className="text-[11px] font-semibold text-red-700">Add a moderation note (optional)</p>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Reason for rejection…"
                        className="w-full px-3 py-1.5 text-xs rounded border border-red-200 bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => moderate(rev.id, noteTarget!.action, note)}
                          disabled={moderating === rev.id}
                          className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {moderating === rev.id ? "Rejecting…" : "Confirm Reject"}
                        </button>
                        <button
                          onClick={() => { setNoteTarget(null); setNote(""); }}
                          className="px-3 py-1.5 text-[11px] text-ink-500 hover:text-ink-900 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
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
    </AdminShell>
  );
}
