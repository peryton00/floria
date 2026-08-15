import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";

export default function CareersPage() {
  return (
    <CustomerShell>
      <div className="space-y-8 py-4 max-w-3xl mx-auto">
        <div className="space-y-3 text-center">
          <h1 className="font-serif text-3xl font-bold text-ink-900">
            Join the Floria Team
          </h1>
          <p className="text-xs text-ink-500 max-w-md mx-auto">
            We are building India&apos;s largest botanical e-commerce network. Help us bring green living to every home.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 p-8 space-y-6">
          <h2 className="font-serif text-lg font-bold text-ink-900">Open Positions</h2>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-ink-100 hover:border-forest-700 transition-colors flex justify-between items-center">
              <div>
                <p className="font-bold text-xs text-ink-900">Horticulture &amp; Plant Care Specialist</p>
                <p className="text-[11px] text-ink-400">Bengaluru • Full-Time</p>
              </div>
              <Link href="/contact?role=horticulture" className="text-xs font-bold text-forest-700 hover:text-forest-900">Apply &rarr;</Link>
            </div>

            <div className="p-4 rounded-xl border border-ink-100 hover:border-forest-700 transition-colors flex justify-between items-center">
              <div>
                <p className="font-bold text-xs text-ink-900">Full-Stack Engineer (Next.js &amp; Supabase)</p>
                <p className="text-[11px] text-ink-400">Remote / Hybrid • Full-Time</p>
              </div>
              <Link href="/contact?role=engineering" className="text-xs font-bold text-forest-700 hover:text-forest-900">Apply &rarr;</Link>
            </div>

            <div className="p-4 rounded-xl border border-ink-100 hover:border-forest-700 transition-colors flex justify-between items-center">
              <div>
                <p className="font-bold text-xs text-ink-900">Nursery Onboarding Operations Manager</p>
                <p className="text-[11px] text-ink-400">Pune / Nashik • Full-Time</p>
              </div>
              <Link href="/contact?role=operations" className="text-xs font-bold text-forest-700 hover:text-forest-900">Apply &rarr;</Link>
            </div>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
