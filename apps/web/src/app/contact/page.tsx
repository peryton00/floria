"use client";

import { useState } from "react";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { CheckIcon, LeafIcon } from "@/components/ui/Icons";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <CustomerShell>
      <div className="space-y-8 py-4 max-w-2xl mx-auto">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest-50 border border-forest-200 text-forest-800 rounded-full text-xs font-bold uppercase tracking-wider">
            <LeafIcon size={14} />
            <span>Customer Support</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-ink-900">
            Contact Floria Support
          </h1>
          <p className="text-xs text-ink-500">
            Have a question about your plant order, nursery onboarding, or plant care? We&apos;re here to help!
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-8 shadow-sm">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-success-100 text-success-800 flex items-center justify-center mx-auto">
                <CheckIcon size={24} />
              </div>
              <h2 className="font-serif text-lg font-bold text-ink-900">Message Received!</h2>
              <p className="text-xs text-ink-500 max-w-sm mx-auto">
                Thank you for contacting Floria. Our horticulture support team will reply to <strong className="text-ink-900">{formData.email}</strong> within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2.5 rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1">
                  Topic *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700 bg-white"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Order Status & Delivery">Order Status &amp; Delivery</option>
                  <option value="Plant Care & Advice">Plant Care &amp; Advice</option>
                  <option value="Nursery Partnership">Nursery Partner Onboarding</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-ink-700 uppercase tracking-wider mb-1">
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your inquiry..."
                  className="w-full px-3 py-2.5 rounded-xl border border-ink-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <button
                type="submit"
                style={{ color: "#ffffff" }}
                className="w-full py-3 bg-forest-800 hover:bg-forest-900 !text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm min-h-[44px]"
              >
                Send Message &rarr;
              </button>
            </form>
          )}
        </div>
      </div>
    </CustomerShell>
  );
}
