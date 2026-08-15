import { CustomerShell } from "@/components/layout/CustomerShell";

export default function TermsPage() {
  return (
    <CustomerShell>
      <div className="space-y-8 py-4 max-w-3xl mx-auto">
        <div className="space-y-3">
          <h1 className="font-serif text-3xl font-bold text-ink-900">
            Terms of Service &amp; Conditions
          </h1>
          <p className="text-xs text-ink-500">
            Effective Date: August 14, 2026
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-8 space-y-6 text-xs text-ink-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-ink-900">1. Platform Services</h2>
            <p>
              Floria Technologies Pvt. Ltd. provides a digital e-commerce marketplace platform connecting customers with verified third-party plant nurseries and garden artisans across India.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-ink-900">2. Customer Responsibilities</h2>
            <p>
              Users are responsible for providing accurate delivery addresses and receiving live botanical goods promptly upon courier arrival to ensure plant safety.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-ink-900">3. Seller &amp; Nursery Obligations</h2>
            <p>
              Nursery partners warrant that plants supplied are healthy, rooted, and accurately represented in catalog listings.
            </p>
          </section>
        </div>
      </div>
    </CustomerShell>
  );
}
