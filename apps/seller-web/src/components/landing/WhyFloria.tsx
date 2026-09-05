"use client";

import React from "react";
import {
  Users,
  TrendUp,
  Star,
  SquaresFour,
  ArrowRight,
} from "@phosphor-icons/react";
import Link from "next/link";

interface ValueProp {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  highlight: string;
}

const VALUE_PROPS: ValueProp[] = [
  {
    id: "discovery",
    icon: Users,
    title: "More customers discover your business",
    description:
      "Put your storefront in front of nearby homeowners, plant lovers, and event planners actively searching for quality greenery, bouquets, and gardening supplies.",
    highlight: "Targeted botanical audience",
  },
  {
    id: "sales",
    icon: TrendUp,
    title: "Turn local demand into daily sales",
    description:
      "Seamless customer checkout and verified same-day delivery logistics make it effortless for neighborhood shoppers to buy directly from your store.",
    highlight: "Integrated delivery & fast payouts",
  },
  {
    id: "reputation",
    icon: Star,
    title: "Build a trusted brand reputation",
    description:
      "Showcase verified customer reviews, transparent ratings, and your unique nursery or floral story to turn first-time buyers into loyal repeat customers.",
    highlight: "Verified buyer reviews",
  },
  {
    id: "management",
    icon: SquaresFour,
    title: "Manage everything in one simple place",
    description:
      "A dedicated seller workspace to update product availability, track live orders, inspect customer feedback, and view weekly earnings without friction.",
    highlight: "Real-time orders & inventory",
  },
];

export function WhyFloria() {
  return (
    <section id="why-floria" className="py-16 sm:py-24 bg-cream-100 border-b border-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-forest-800 bg-forest-100/80 border border-forest-200 px-3.5 py-1.5 rounded-full shadow-2xs">
            Why Floria Business
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 mt-4 leading-tight">
            Built to help your local botanical business thrive.
          </h2>
          <p className="text-base sm:text-lg text-ink-600 mt-4 leading-relaxed">
            Floria is not just a software tool — it is a dedicated local marketplace
            engineered to connect your craft with people who value it.
          </p>
        </div>

        {/* Value Proposition Grid (2x2 on desktop, stacked on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {VALUE_PROPS.map((prop) => {
            const Icon = prop.icon;
            return (
              <div
                key={prop.id}
                className="bg-cream-50 rounded-3xl border border-cream-300/80 p-8 sm:p-10 flex flex-col justify-between hover:border-forest-500/50 hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-forest-100/90 flex items-center justify-center text-forest-900 border border-forest-200 group-hover:bg-forest-800 group-hover:text-cream-50 transition-colors">
                      <Icon size={26} weight="duotone" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800 bg-forest-50 border border-forest-200/60 px-2.5 py-1 rounded-full">
                      {prop.highlight}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-900 leading-snug">
                    {prop.title}
                  </h3>
                  <p className="text-sm sm:text-base text-ink-600 mt-3 leading-relaxed">
                    {prop.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-cream-200/80 flex items-center gap-1.5 text-xs font-semibold text-forest-800 group-hover:text-forest-900">
                  <span>Learn how it works</span>
                  <ArrowRight size={13} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Supporting Callout */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-forest-900 text-cream-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-lg">
          <div className="space-y-1">
            <h4 className="font-serif text-xl sm:text-2xl font-bold">
              Ready to expand your local footprint?
            </h4>
            <p className="text-sm text-forest-200">
              Join trusted nurseries and florists growing their sales on Floria.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cream-50 hover:bg-cream-100 text-forest-900 text-sm font-bold rounded-xl shadow-xs transition-all active:scale-98 shrink-0"
          >
            <span>Start Selling Today</span>
            <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  );
}
