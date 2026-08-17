"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { SearchIcon, ShieldIcon, LeafIcon, TruckIcon } from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";

const HELP_FAQS = [
  {
    category: "Orders & Delivery",
    question: "How do multi-nursery orders work on Floria?",
    answer:
      "When you add plants from different local nurseries to your cart, Floria accepts your order in one simple checkout. Behind the scenes, each nursery prepares their specific items with utmost care, and Floria coordinates safe delivery to your doorstep.",
  },
  {
    category: "Orders & Delivery",
    question: "How can I track my live order?",
    answer:
      "You can track your order status anytime by visiting My Orders from your account menu. Each order displays a real-time tracking timeline from Nursery Confirmation to Out for Delivery.",
  },
  {
    category: "Payments & Refunds",
    question: "What payment methods are supported?",
    answer:
      "Floria supports Online Payments via UPI, Credit/Debit Cards, Net Banking, and Wallets, as well as Cash on Delivery (COD) for eligible pin codes.",
  },
  {
    category: "Payments & Refunds",
    question: "How do refunds work for damaged plants?",
    answer:
      "If a plant arrives damaged or unhealthy, simply report it within 7 days of delivery under My Orders. Once verified, refunds are credited back to your original payment method within 3–5 business days.",
  },
  {
    category: "Returns & Plant Guarantee",
    question: "What is Floria's 7-Day Healthy Plant Guarantee?",
    answer:
      "Every plant shipped through Floria comes directly from verified local nurseries with green packaging. If your plant shows signs of severe distress within 7 days, we provide a free replacement or full refund.",
  },
  {
    category: "Plant Care & Quality",
    question: "Do plants come with pots and care guides?",
    answer:
      "Yes! Product listing descriptions specify whether a nursery pot is included. Every plant detail page also features a dedicated Care Guide tab with watering, sunlight, and soil instructions.",
  },
];

export default function HelpPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "Orders & Delivery", "Payments & Refunds", "Returns & Plant Guarantee", "Plant Care & Quality"];

  const filteredFaqs = HELP_FAQS.filter((faq) => {
    const matchesCat = activeCategory === "All" || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <CustomerShell>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-400 mb-6">
        <Link href="/" className="hover:text-forest-700 transition-colors">Home</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <Link href="/account" className="hover:text-forest-700 transition-colors">Account</Link>
        <span aria-hidden="true" className="select-none text-ink-300">/</span>
        <span className="text-ink-700 font-medium">Help & Support</span>
      </nav>

      {/* Hero Banner */}
      <div className="bg-forest-900 text-white rounded-2xl p-6 sm:p-8 mb-8 text-center relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-200 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full mb-3">
            <LeafIcon size={12} /> Floria Customer Care
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-cream-50 mb-3 leading-tight">
            How can we help you today?
          </h1>
          <p className="text-xs sm:text-sm text-forest-100/90 mb-6">
            Find answers regarding your orders, local nursery delivery, payments, or plant care guarantee.
          </p>

          {/* Search Input */}
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics or questions..."
              className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl text-ink-900 bg-white placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-400 shadow-sm"
            />
            <SearchIcon className="absolute left-3 top-3.5 text-ink-400" size={16} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Main Content Area */}
        <div className="space-y-6">

          {/* Category Tabs */}
          <div className="flex border-b border-ink-100 gap-4 text-xs font-bold uppercase tracking-wider text-ink-300 overflow-x-auto pb-px">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={[
                    "pb-3 relative whitespace-nowrap transition-colors focus:outline-none",
                    isActive ? "text-forest-700 font-bold" : "hover:text-ink-900",
                  ].join(" ")}
                >
                  {cat}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest-700 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* FAQs Accordion */}
          <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-900 pb-3 border-b border-ink-100">
              Frequently Asked Questions ({filteredFaqs.length})
            </h2>

            {filteredFaqs.length === 0 ? (
              <p className="text-xs text-ink-400 py-4 text-center">No questions found matching your search.</p>
            ) : (
              <div className="divide-y divide-ink-100">
                {filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="py-3.5">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between text-left focus:outline-none group"
                      >
                        <span className="font-sans text-xs sm:text-sm font-bold text-ink-900 group-hover:text-forest-700 transition-colors">
                          {faq.question}
                        </span>
                        <span className="text-ink-400 group-hover:text-forest-700 font-bold text-sm ml-2">
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>

                      {isOpen && (
                        <p className="text-xs text-ink-600 mt-2.5 leading-relaxed bg-cream-50/50 p-3.5 rounded-xl border border-ink-100/50">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Support Cards */}
        <div className="space-y-4 lg:sticky lg:top-24">
          <div className="p-6 bg-white rounded-2xl border border-ink-100 shadow-sm space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
              <LeafIcon size={24} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-ink-900 text-base">Contact Support</h3>
              <p className="text-xs text-ink-500 mt-1">Our green support team is available Mon-Sat, 9 AM - 7 PM</p>
            </div>

            <div className="space-y-2 text-xs font-semibold text-ink-800 text-left pt-2 border-t border-ink-100">
              <div className="flex items-center justify-between py-1">
                <span className="text-ink-400">Email</span>
                <a href="mailto:support@floria.in" className="text-forest-700 hover:underline">support@floria.in</a>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-ink-400">Toll-Free</span>
                <span className="font-mono">1800-FLORIA</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toast.info("Floria Live Chat", "Support agents available Mon-Sat 9 AM - 7 PM.")}
              style={{ color: "#ffffff" }}
              className="w-full py-3 bg-forest-800 hover:bg-forest-900 !text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-800"
            >
              Start Live Chat
            </button>
          </div>

          <div className="p-4 bg-cream-50 rounded-xl border border-ink-100 text-xs text-ink-500 flex items-center gap-3">
            <ShieldIcon size={18} className="text-forest-700 flex-shrink-0" />
            <span>100% Quality Checked &amp; Direct from Verified Local Nurseries</span>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
