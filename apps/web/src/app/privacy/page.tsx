import { CustomerShell } from "@/components/layout/CustomerShell";

export default function PrivacyPage() {
  return (
    <CustomerShell>
      <div className="space-y-8 py-4 max-w-3xl mx-auto">
        <div className="space-y-3">
          <h1 className="font-serif text-3xl font-bold text-ink-900">
            Privacy Policy
          </h1>
          <p className="text-xs text-ink-500">
            Last updated: August 14, 2026
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-8 space-y-6 text-xs text-ink-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-ink-900">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when creating an account, updating your profile, placing an order, or communicating with support (name, email address, phone number, and delivery address).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-ink-900">2. How We Use Information</h2>
            <p>
              Your personal information is used exclusively to fulfill order deliveries, communicate shipping updates, provide plant care support, and maintain account security.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-ink-900">3. Data Protection &amp; Security</h2>
            <p>
              All customer sessions and passwords are encrypted using Supabase Auth industry-standard JWT encryption. We never sell or rent your personal data to third parties.
            </p>
          </section>
        </div>
      </div>
    </CustomerShell>
  );
}
