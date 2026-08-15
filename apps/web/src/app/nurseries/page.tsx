import Link from "next/link";
import Image from "next/image";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { LeafIcon, MapPinIcon } from "@/components/ui/Icons";
import { StarRating } from "@/components/ui/StarRating";

const NURSERIES = [
  {
    id: "green-leaf",
    name: "Green Leaf Nursery",
    city: "Bengaluru, Karnataka",
    rating: 4.9,
    reviewsCount: 142,
    specialty: "Exotic Indoor Plants & Monsteras",
    image: "/nursery-1.png",
    description: "Specializing in high-humidity indoor foliage, rare variegated plants, and organic potting mixes.",
  },
  {
    id: "clay-and-co",
    name: "Clay & Co. Artisans",
    city: "Pune, Maharashtra",
    rating: 4.8,
    reviewsCount: 98,
    specialty: "Handcrafted Terracotta & Ceramic Planters",
    image: "/nursery-2.png",
    description: "Premium handcrafted terracotta pots, modern ceramic planters, and sustainable garden accessories.",
  },
  {
    id: "nisarga-gardens",
    name: "Nisarga Botanical Gardens",
    city: "Nashik, Maharashtra",
    rating: 4.7,
    reviewsCount: 215,
    specialty: "Organic Fruit Trees & Culinary Herb Seeds",
    image: "/nursery-3.png",
    description: "Heirloom seeds, fruit-bearing saplings, organic fertilizers, and pest-prevention oils.",
  },
  {
    id: "sai-garden-center",
    name: "Sai Garden Center",
    city: "Hyderabad, Telangana",
    rating: 4.6,
    reviewsCount: 84,
    specialty: "Flowering Shrubs & Bonsai Collections",
    image: "/nursery-4.png",
    description: "Curated flowering plants, mature bonsai specimens, and drip irrigation kits.",
  },
];

export default function NurseriesPage() {
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
            Floria connects you directly with top-rated local plant nurseries and ceramic artisans across India. Order from multiple nurseries in one smooth checkout!
          </p>
        </div>

        {/* Nursery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {NURSERIES.map((nursery) => (
            <div
              key={nursery.id}
              className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6 items-start"
            >
              <div className="relative w-full sm:w-36 h-36 rounded-xl overflow-hidden bg-cream-100 shrink-0">
                <Image
                  src={nursery.image}
                  alt={nursery.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-serif text-lg font-bold text-ink-900 truncate">
                    {nursery.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-xs text-ink-500">
                  <MapPinIcon size={14} className="text-forest-700 shrink-0" />
                  <span>{nursery.city}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <StarRating rating={nursery.rating} size="sm" />
                  <span className="text-xs font-bold text-ink-800">{nursery.rating}</span>
                  <span className="text-xs text-ink-400">({nursery.reviewsCount} reviews)</span>
                </div>

                <p className="text-xs text-forest-700 font-bold">
                  {nursery.specialty}
                </p>

                <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">
                  {nursery.description}
                </p>

                <div className="pt-2">
                  <Link
                    href={`/shop?nursery=${nursery.id}`}
                    className="inline-flex items-center text-xs font-bold text-forest-700 hover:text-forest-900 transition-colors"
                  >
                    View Plant Catalog &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CustomerShell>
  );
}
