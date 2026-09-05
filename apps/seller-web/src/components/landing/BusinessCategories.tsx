"use client";

import React from "react";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
}

const CATEGORIES: Category[] = [
  {
    id: "plants",
    name: "Plants & Nurseries",
    description: "Indoor plants, rare foliage, flowering species, outdoor shrubs & bonsai.",
    image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "flowers",
    name: "Flowers & Bouquets",
    description: "Fresh cut flowers, occasion bouquets, exotic stems & floral arrangements.",
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "tools",
    name: "Gardening Tools",
    description: "Pruners, shears, watering cans, trowels, sprayers & essential gear.",
    image: "https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "pots",
    name: "Pots & Planters",
    description: "Handcrafted ceramics, terracotta planters, brass containers & hanging pots.",
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "soils",
    name: "Soils & Fertilizers",
    description: "Organic potting mixes, vermicompost, perlite, coco peat & nutrients.",
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "care",
    name: "Plant Care",
    description: "Organic neem spray, pest repellents, moisture meters & leaf shine.",
    image: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "supplies",
    name: "Garden Supplies",
    description: "Trellises, moss poles, grow lights, plant stands & balcony accessories.",
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "more",
    name: "And More",
    description: "Seeds, propagation vessels, terrariums, decorative stones & botanical craft.",
    image: "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=700&q=80",
  },
];

export function BusinessCategories() {
  return (
    <section id="categories" className="py-20 sm:py-28 lg:py-32 bg-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-20">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 leading-[1.12] tracking-tight">
            Whatever you grow, make, or sell.
          </h2>
          <p className="text-lg sm:text-xl text-ink-600 font-normal leading-relaxed mt-4">
            From a neighborhood nursery to a flower studio or gardening supply
            store, there's a place for your business on Floria.
          </p>
        </div>

        {/* Large Editorial Category Tiles Grid (2 on mobile, 4 on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col group cursor-default"
            >
              {/* Image Tile */}
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-forest-900 aspect-[4/3] sm:aspect-square mb-4 shadow-xs group-hover:shadow-md transition-shadow">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-center group-hover:scale-104 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/50 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Title & Description */}
              <h3 className="font-serif text-xl font-semibold text-ink-900 group-hover:text-forest-800 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs sm:text-sm text-ink-600 font-normal leading-relaxed mt-1">
                {cat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
