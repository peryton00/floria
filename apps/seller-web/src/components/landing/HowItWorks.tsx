"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

interface Step {
  number: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Join",
    description: "Create your Floria Business account in less than two minutes.",
  },
  {
    number: "02",
    title: "Set up",
    description: "Tell us about your business, nursery or shop and complete quick verification.",
  },
  {
    number: "03",
    title: "Start selling",
    description: "Publish your plants, bouquets, tools, pricing, and live inventory.",
  },
  {
    number: "04",
    title: "Grow",
    description: "Receive orders, delight local customers, and earn reliable weekly payouts.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 lg:py-32 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-24">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 leading-[1.12] tracking-tight">
            How selling on Floria works
          </h2>
          <p className="text-lg sm:text-xl text-ink-600 font-normal leading-relaxed mt-4">
            A simple, four-step path to bringing your botanical store to thousands of local customers.
          </p>
        </div>

        {/* Clean Editorial Timeline (Whitespace + Large Numbers) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-8 lg:gap-12">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col">
              {/* Large Display Number */}
              <div className="font-serif text-5xl sm:text-6xl font-normal text-forest-800 tracking-tight mb-4">
                {step.number}
              </div>

              {/* Short Title */}
              <h3 className="font-serif text-2xl font-semibold text-ink-900 mb-2">
                {step.title}
              </h3>

              {/* Concise Sentence */}
              <p className="text-sm sm:text-base text-ink-600 font-normal leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Editorial Link */}
        <div className="mt-16 sm:mt-20 pt-8 border-t border-cream-300/80">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-base font-semibold text-forest-800 hover:text-forest-900 transition-colors group"
          >
            <span>Ready to get started? Create your account</span>
            <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
