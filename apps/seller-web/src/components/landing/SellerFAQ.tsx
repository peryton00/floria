"use client";

import React, { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "eligibility",
    question: "Who can join Floria Business?",
    answer:
      "Any genuine botanical, floral, nursery, pottery, or gardening business based in India can join. This includes plant nurseries, urban flower boutiques, artisanal ceramic and planter workshops, organic soil and fertilizer producers, and gardening tool creators.",
  },
  {
    id: "types",
    question: "What types of businesses can sell on Floria?",
    answer:
      "We support the entire plant, flower, and gardening ecosystem — from retail storefronts and urban greenhouses to independent ceramic artisans and licensed growers.",
  },
  {
    id: "verification",
    question: "How does verification work?",
    answer:
      "After signing up, you complete a quick business profile with your location and store details. Our onboarding team reviews and approves verified profiles within 24 to 48 hours to ensure customer trust and authenticity.",
  },
  {
    id: "products",
    question: "How do I list my products?",
    answer:
      "Through your seller workspace, you can upload plant and product photos, set your prices, add care/sunlight tags, and specify current inventory stock in just a few clicks.",
  },
  {
    id: "orders",
    question: "How do orders and deliveries work?",
    answer:
      "When a nearby customer places an order, you receive an instant alert. Once packed and marked ready, a verified Floria delivery courier picks up the order directly from your store location and delivers it safely.",
  },
  {
    id: "fees",
    question: "Are there any upfront listing fees?",
    answer:
      "No. Floria has zero upfront joining or monthly listing fees. We only retain a small, transparent platform commission on successfully completed orders. You keep the full net base price you set.",
  },
  {
    id: "payments",
    question: "How and when are payments handled?",
    answer:
      "Earnings from fulfilled orders are automatically settled to your verified bank account on a regular weekly payout cycle, with clear itemized ledger statements visible in your portal.",
  },
  {
    id: "team",
    question: "Can multiple people manage my business account?",
    answer:
      "Yes. Floria Business provides granular role-based access so your store managers and fulfillment staff can update inventory and handle orders securely.",
  },
];

export function SellerFAQ() {
  const [openId, setOpenId] = useState<string | null>("eligibility");

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 sm:py-28 lg:py-32 bg-cream-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-14 sm:mb-20">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 leading-[1.12] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-lg sm:text-xl text-ink-600 font-normal leading-relaxed mt-4">
            Everything you need to know about partnering with Floria.
          </p>
        </div>

        {/* Clean Accordion (Minimal borders, no settings-page feel) */}
        <div className="divide-y divide-cream-300/80 border-y border-cream-300/80">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className="py-6 sm:py-8">
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer group"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-xl sm:text-2xl font-semibold text-ink-900 group-hover:text-forest-800 transition-colors pr-6">
                    {faq.question}
                  </span>
                  <div
                    className={`shrink-0 text-ink-600 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-forest-800" : ""
                    }`}
                  >
                    <CaretDown size={20} weight="bold" />
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 text-sm sm:text-base text-ink-600 font-normal leading-relaxed pr-8 animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
