import Link from "next/link";
import Image from "next/image";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { LeafIcon, MapPinIcon } from "@/components/ui/Icons";
import { StarRating } from "@/components/ui/StarRating";
import type { NurserySummary } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchNurseries(): Promise<NurserySummary[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/catalog/sellers`, {
      next: { revalidate: 300 }, // 5-minute ISR
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function NurseriesPage() {
  const nurseries = await fetchNurseries();

  return (
    <CustomerShell>
      <div className="space-y-8 py-4">
        {/* Header */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest-50 border border-forest-200 text-forest-800 rounded-full text-xs font-bold uppercase tracking-wider">
            <LeafIcon size={14} />
            <span>Verified Local Partners</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 leading-tight">
            Our Nursery Network
          </h1>
          <p className="text-sm text-ink-600 leading-relaxed">
            Floria connects you directly with top-rated local plant nurseries
            and ceramic artisans across India. Order from multiple nurseries in
            one smooth checkout!
          </p>
        </div>

        {nurseries.length === 0 ? (
          <div className="bg-floria-linen rounded-2xl border border-floria-border p-12 text-center shadow-xs max-w-lg mx-auto">
            <p className="font-serif text-lg font-bold text-ink-900">
              No nurseries available yet
            </p>
            <p className="text-xs text-ink-500 mt-2">
              Check back soon as our network of verified nurseries grows.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nurseries.map((nursery) => {
              const rs = Array.isArray(nursery.rating_summary)
                ? nursery.rating_summary[0]
                : nursery.rating_summary;
              const rating = rs?.avg_rating ?? 0;
              const reviewCount = rs?.review_count ?? 0;

              return (
                <div
                  key={nursery.id}
                  className="bg-floria-linen rounded-2xl border border-floria-border p-6 shadow-sm hover:border-forest-400 transition-all flex flex-col sm:flex-row gap-6 items-start"
                >
                  <div className="relative w-full sm:w-36 h-36 rounded-xl overflow-hidden bg-floria-natural-sand shrink-0 border border-floria-border">
                    {nursery.logo_url ? (
                      <Image
                        src={nursery.logo_url}
                        alt={nursery.business_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-forest-800/40">
                        <LeafIcon size={40} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-serif text-lg font-bold text-ink-900 truncate">
                        {nursery.business_name}
                      </h2>
                    </div>

                    {nursery.address && (
                      <div className="flex items-center gap-2 text-xs text-ink-500">
                        <MapPinIcon
                          size={14}
                          className="text-forest-700 shrink-0"
                        />
                        <span className="truncate">{nursery.address}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <StarRating rating={rating} size="sm" />
                      {rating > 0 && (
                        <>
                          <span className="text-xs font-bold text-ink-800">
                            {rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-ink-400">
                            ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                          </span>
                        </>
                      )}
                      {rating === 0 && (
                        <span className="text-xs text-ink-400">
                          New nursery
                        </span>
                      )}
                    </div>

                    {nursery.business_description && (
                      <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">
                        {nursery.business_description}
                      </p>
                    )}

                    <div className="pt-2">
                      <Link
                        href={`/shop?nursery=${nursery.id}`}
                        className="inline-flex items-center text-xs font-bold text-forest-800 hover:text-forest-950 transition-colors"
                      >
                        View Plant Catalog &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
