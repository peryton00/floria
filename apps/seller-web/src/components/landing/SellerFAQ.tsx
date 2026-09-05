"use client";

import React, { useState } from "react";
import { CaretDown, Question } from "@phosphor-icons/react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "eligibility",
    question: "Who can become a Floria Business seller?",
    answer:
      "Any genuine botanical, floral, nursery, or gardening business based in India can apply. This includes plant nurseries, florists, bouquet makers, pottery and planter artisans, soil and fertilizer producers, and gardening tool suppliers.",
  },
  {
    id: "store",
    question: "Do I need a physical retail storefront to join?",
    answer:
      "No. While many of our partners operate retail nurseries or flower boutiques, independent home growers, urban greenhouses, and artisanal pottery workshops with valid identity and business verification are welcome.",
  },
  {
    id: "verification",
    question: "How does the seller verification process work?",
    answer:
      "After submitting your registration with basic business details, our partner onboarding team reviews your store profile, location, and photos within 24 to 48 hours to ensure customer trust and authenticity.",
  },
  {
    id: "delivery",
    question: "How does delivery and courier pickup work?",
    answer:
      "When a customer orders from your store, you pack and mark the items as 'Ready for Pickup' in your seller dashboard. A verified Floria delivery courier is automatically assigned to pick up the package from your location and deliver it promptly to the customer.",
  },
  {
    id: "commission",
    question: "What are the charges and commissions on Floria?",
    answer:
      "There are zero upfront joining or listing fees. Floria only retains a small, transparent commission on successfully fulfilled orders based on our standard platform pricing governance. You keep the full net base price you set for your products.",
  },
  {
    id: "payouts",
    question: "How and when are seller earnings paid out?",
    answer:
      "Earnings from fulfilled orders are automatically settled to your verified bank account on a regular weekly payout cycle. You can view itemized ledger breakdowns and downloadable invoices directly in your seller portal.",
  },
  {
    id: "management",
    question: "Can I manage inventory and pricing on my mobile phone?",
    answer:
      "Yes. The Floria Seller web portal is fully responsive across mobile, tablet, and desktop devices, allowing you to update stock, adjust pricing, and accept orders on the go.",
  },
];

export function SellerFAQ() {
  const [openId, setOpenId] = useState<string | null>("eligibility");

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 bg-cream-50 border-b border-cream-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-forest-800 bg-forest-100/80 border border-forest-200 px-3.5 py-1.5 rounded-full shadow-2xs">
            Frequently Asked Questions
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 mt-4 leading-tight">
            Got questions? We've got answers.
          </h2>
          <p className="text-base text-ink-600 mt-3">
            Everything you need to know about partnering with Floria.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-cream-100 rounded-2xl border border-cream-300/80 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left focus:outline-none focus-visible:bg-cream-200 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-base sm:text-lg font-bold text-ink-900 pr-4">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center text-forest-800 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-forest-100 text-forest-900" : ""
                    }`}
                  >
                    <CaretDown size={16} weight="bold" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-sm text-ink-600 leading-relaxed border-t border-cream-200/60 pt-4 animate-fadeIn">
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
