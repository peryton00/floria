"use client";

import React from "react";
import {
  UserPlus,
  IdentificationCard,
  Tag,
  TrendUp,
  ArrowRight,
} from "@phosphor-icons/react";
import Link from "next/link";

interface Step {
  step: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  {
    step: "01",
    title: "Join",
    description: "Create your Floria Business account in less than two minutes.",
    icon: UserPlus,
  },
  {
    step: "02",
    title: "Set up",
    description: "Tell us about your business, nursery or shop and complete quick verification.",
    icon: IdentificationCard,
  },
  {
    step: "03",
    title: "Start selling",
    description: "Publish your plants, bouquets, tools, pricing, and live inventory.",
    icon: Tag,
  },
  {
    step: "04",
    title: "Grow",
    description: "Receive orders, delight local customers, and earn reliable weekly payouts.",
    icon: TrendUp,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-cream-100 border-b border-cream-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-forest-800 bg-forest-100/80 border border-forest-200 px-3.5 py-1.5 rounded-full shadow-2xs">
            Simple 4-Step Process
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 mt-4 leading-tight">
            How selling on Floria works
          </h2>
          <p className="text-base sm:text-lg text-ink-600 mt-4 leading-relaxed">
            Get your business online, verified, and ready to receive customer orders in just a few steps.
          </p>
        </div>

        {/* 4-Column Progression Grid (Stacked on Mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="bg-cream-50 rounded-3xl border border-cream-300/80 p-6 sm:p-7 flex flex-col justify-between hover:border-forest-500/60 hover:shadow-md transition-all relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif text-2xl font-bold text-forest-800">
                      {s.step}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800 group-hover:bg-forest-800 group-hover:text-cream-50 transition-colors">
                      <Icon size={22} weight="duotone" />
                    </div>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-ink-900 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-cream-200/80 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-forest-800">
                  <span>Step {idx + 1} of 4</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-4 bg-forest-800 hover:bg-forest-900 text-cream-50 text-base font-semibold rounded-xl shadow-md transition-all active:scale-98"
          >
            <span>Create Your Seller Account</span>
            <ArrowRight size={17} weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  );
}
