"use client";

import React from "react";
import Image from "next/image";
import {
  Plant,
  FlowerTulip,
  Wrench,
  PottedPlant,
  Drop,
  ShieldCheck,
  Package,
  Sun,
} from "@phosphor-icons/react";

interface CategoryItem {
  id: string;
  name: string;
  tagline: string;
  icon: React.ElementType;
  image: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: "nurseries",
    name: "Plants & Nurseries",
    tagline: "Indoor plants, rare foliage, flowering species, outdoor shrubs & bonsai.",
    icon: Plant,
    image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "flowers",
    name: "Flowers & Bouquets",
    tagline: "Fresh cut flowers, occasion bouquets, exotic stems & floral decor.",
    icon: FlowerTulip,
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "tools",
    name: "Gardening Tools",
    tagline: "Pruners, shears, watering cans, trowels & essential gear.",
    icon: Wrench,
    image: "https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "pots",
    name: "Pots & Planters",
    tagline: "Handcrafted ceramics, terracotta planters, brass containers & hanging pots.",
    icon: PottedPlant,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "soils",
    name: "Soils & Fertilizers",
    tagline: "Organic potting mixes, vermicompost, perlite & plant nutrients.",
    icon: Drop,
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "supplies",
    name: "Garden Supplies & Decor",
    tagline: "Trellises, moss poles, grow lights, plant stands & balcony accessories.",
    icon: Package,
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80",
  },
];

export function BusinessCategories() {
  return (
    <section id="categories" className="py-16 sm:py-24 bg-cream-50 border-b border-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-forest-800 bg-forest-100/80 border border-forest-200 px-3.5 py-1.5 rounded-full shadow-2xs">
            Ecosystem Breadth
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 mt-4 leading-tight">
            Whatever you grow, make, or sell.
          </h2>
          <p className="text-base sm:text-lg text-ink-600 mt-4 leading-relaxed">
            Floria brings together the businesses that help people grow, garden,
            decorate, and celebrate with plants and flowers.
          </p>
        </div>

        {/* Categories Grid (1 col on mobile, 2 on tablet, 3 on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="bg-cream-100 rounded-2xl border border-cream-300/80 overflow-hidden shadow-xs hover:shadow-md hover:border-forest-400 transition-all flex flex-col group"
              >
                {/* Visual Header */}
                <div className="relative h-44 w-full bg-cream-300 overflow-hidden">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-950/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cream-50/95 backdrop-blur-xs text-forest-900 text-xs font-bold shadow-xs">
                    <Icon size={15} weight="duotone" className="text-forest-700" />
                    <span>{cat.name}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                    {cat.tagline}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
