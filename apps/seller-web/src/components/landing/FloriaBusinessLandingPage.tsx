"use client";

import React from "react";
import { BusinessNavbar } from "./BusinessNavbar";
import { HeroSection } from "./HeroSection";
import { WhyFloria } from "./WhyFloria";
import { BusinessCategories } from "./BusinessCategories";
import { HowItWorks } from "./HowItWorks";
import { TopBusinesses } from "./TopBusinesses";
import { BusinessWorkspacePreview } from "./BusinessWorkspacePreview";
import { SuccessStories } from "./SuccessStories";
import { SellerFAQ } from "./SellerFAQ";
import { FinalBusinessCTA } from "./FinalBusinessCTA";
import { BusinessFooter } from "./BusinessFooter";

export function FloriaBusinessLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-ink-900 selection:bg-forest-200 selection:text-forest-900 font-sans antialiased">
      {/* 1. Public Brand Navbar */}
      <BusinessNavbar />

      <main className="flex-1 w-full">
        {/* 2. Editorial Hero (Display headline, 2 CTAs, large photography & platform numbers) */}
        <HeroSection />

        {/* 3. Why Floria (More than a marketplace — 4 outcome storytelling blocks) */}
        <WhyFloria />

        {/* 4. Business Categories (Whatever you grow, make, or sell — 8 large category tiles) */}
        <BusinessCategories />

        {/* 5. How It Works (Clean 4-step editorial timeline) */}
        <HowItWorks />

        {/* 6. Top Businesses (3 photographic marketplace discovery cards with live data) */}
        <TopBusinesses />

        {/* 7. Seller Cockpit Preview (Operational workplace showcase) */}
        <BusinessWorkspacePreview />

        {/* 8. Success Stories (Restrained partner perspective) */}
        <SuccessStories />

        {/* 9. Seller FAQs (Clean policy answers) */}
        <SellerFAQ />

        {/* 10. Final Call to Action */}
        <FinalBusinessCTA />
      </main>

      {/* 11. Minimal Footer */}
      <BusinessFooter />
    </div>
  );
}
