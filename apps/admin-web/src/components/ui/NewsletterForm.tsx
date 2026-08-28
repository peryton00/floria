"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-forest-800/80 border border-forest-600/40 text-emerald-200 text-xs font-ui">
        <span>🌱</span>
        <span className="font-semibold">
          Welcome to the Floria plant club! Check your inbox soon.
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 font-ui"
      aria-label="Newsletter signup"
    >
      <label htmlFor="footer-email" className="sr-only">
        Email address
      </label>
      <input
        id="footer-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email for plant care tips"
        className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-white/[0.08] text-white placeholder-white/40 border border-white/15 focus:outline-none focus:border-forest-300 focus:bg-white/[0.12] transition-all"
      />
      <button
        type="submit"
        style={{ color: "#FFFFFF" }}
        className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-terracotta-700 hover:bg-terracotta-800 active:bg-terracotta-900 !text-white transition-all shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Subscribe
      </button>
    </form>
  );
}
