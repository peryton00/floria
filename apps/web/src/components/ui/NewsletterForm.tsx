// Floria — NewsletterForm (client component for form interactivity)
"use client";

export function NewsletterForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex gap-2"
      aria-label="Newsletter signup"
    >
      <label htmlFor="footer-email" className="sr-only">Email address</label>
      <input
        id="footer-email"
        type="email"
        placeholder="Enter your email"
        className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-colors"
      />
      <button
        type="submit"
        className="px-4 py-2 text-sm font-semibold rounded-lg bg-forest-600 text-white hover:bg-forest-500 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Subscribe
      </button>
    </form>
  );
}
