"use client";

import React from "react";
import Image from "next/image";

interface OutcomeItem {
  id: string;
  title: string;
  description: string;
  image: string;
}

const OUTCOMES: OutcomeItem[] = [
  {
    id: "reach",
    title: "Reach more customers",
    description:
      "Get discovered by people actively looking for plants, flowers, gardening products and more in your neighborhood and city.",
    image: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "grow",
    title: "Grow locally",
    description:
      "Connect your business with customers around you, turning everyday local interest into dependable sales.",
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "trust",
    title: "Build trust",
    description:
      "Let your business reputation grow through real customer experiences, transparent ratings, and verified buyer reviews.",
    image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "manage",
    title: "Manage everything in one place",
    description:
      "Once you join, Floria Business gives you the tools to manage catalog, orders, and weekly payouts efficiently.",
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
  },
];

export function WhyFloria() {
  return (
    <section id="why-floria" className="py-20 sm:py-28 lg:py-32 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-24">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 leading-[1.12] tracking-tight">
            More than a marketplace.
          </h2>
          <p className="text-lg sm:text-xl text-ink-600 font-normal leading-relaxed mt-4">
            Floria brings local businesses and plant-loving customers together.
          </p>
        </div>

        {/* Large Editorial Outcome Blocks (2x2 Asymmetric Editorial Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {OUTCOMES.map((item, idx) => (
            <div
              key={item.id}
              className={`flex flex-col ${
                idx % 2 === 1 ? "md:translate-y-12" : ""
              }`}
            >
              {/* Image Block */}
              <div className="relative rounded-3xl overflow-hidden shadow-md bg-forest-900 aspect-[16/10] sm:aspect-[16/11] mb-6 sm:mb-8 group">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center group-hover:scale-103 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/30 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Text Block */}
              <div className="max-w-md">
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-ink-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-ink-600 font-normal leading-relaxed mt-3">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
